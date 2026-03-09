import { z } from "zod";
import { prisma } from "@/server/infra/prisma/client";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type {
  BackofficeUserOutput,
  CreateBackofficeUserInput,
  UpdateBackofficeUserInput,
} from "./types";
import { isCorporateBackofficeEmail } from "./auth";

const createInternalUserSchema = z.object({
  email: z.string().trim().email("Invalid corporate email"),
  fullName: z.string().trim().min(3, "Full name is required").max(120),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  role: z.enum(["admin", "operator"]),
});

const updateInternalUserSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  role: z.enum(["admin", "operator"]).optional(),
  isActive: z.boolean().optional(),
});

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const mapInternalUser = (user: {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  role: "admin" | "operator";
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BackofficeUserOutput => ({
  id: user.id,
  supabaseUserId: user.supabaseUserId,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export class InternalUsersService {
  public async countUsers(): Promise<number> {
    return prisma.internalUser.count();
  }

  public async list(): Promise<Output<BackofficeUserOutput[]>> {
    const users = await prisma.internalUser.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    });

    return okOutput(users.map(mapInternalUser));
  }

  public async findBySupabaseUserId(supabaseUserId: string): Promise<BackofficeUserOutput | null> {
    const user = await prisma.internalUser.findUnique({
      where: { supabaseUserId },
    });

    return user ? mapInternalUser(user) : null;
  }

  public async findById(id: string): Promise<BackofficeUserOutput | null> {
    const user = await prisma.internalUser.findUnique({
      where: { id },
    });

    return user ? mapInternalUser(user) : null;
  }

  public async recordLogin(supabaseUserId: string): Promise<void> {
    await prisma.internalUser.updateMany({
      where: { supabaseUserId },
      data: { lastLoginAt: new Date() },
    });
  }

  public async create(input: CreateBackofficeUserInput): Promise<Output<BackofficeUserOutput>> {
    const parsed = createInternalUserSchema.safeParse(input);
    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const normalizedEmail = normalizeEmail(parsed.data.email);
    if (!isCorporateBackofficeEmail(normalizedEmail)) {
      return failOutput("Backoffice users must use @cheffia-tech.com email");
    }

    const existing = await prisma.internalUser.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return failOutput("Internal user email already exists");
    }

    const adminClient = getSupabaseAdminClient();
    const createdAuthUser = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        portal: "backoffice",
      },
      app_metadata: {
        backoffice: true,
        backoffice_role: parsed.data.role,
      },
    });

    if (createdAuthUser.error || !createdAuthUser.data.user) {
      return failOutput(
        createdAuthUser.error?.message ?? "Failed to create auth user for backoffice access"
      );
    }

    try {
      const created = await prisma.internalUser.create({
        data: {
          supabaseUserId: createdAuthUser.data.user.id,
          email: normalizedEmail,
          fullName: parsed.data.fullName.trim(),
          role: parsed.data.role,
        },
      });

      return okOutput(mapInternalUser(created), ["Backoffice user created successfully"]);
    } catch (error) {
      await adminClient.auth.admin.deleteUser(createdAuthUser.data.user.id).catch(() => undefined);
      const message = error instanceof Error ? error.message : "Unexpected persistence error";
      return failOutput(`Failed to persist backoffice user: ${message}`);
    }
  }

  public async bootstrapAdmin(
    input: CreateBackofficeUserInput
  ): Promise<Output<BackofficeUserOutput>> {
    const count = await this.countUsers();
    if (count > 0) {
      return failOutput("Bootstrap is no longer available");
    }

    return this.create({
      ...input,
      role: "admin",
    });
  }

  public async update(
    id: string,
    input: UpdateBackofficeUserInput
  ): Promise<Output<BackofficeUserOutput>> {
    const parsed = updateInternalUserSchema.safeParse(input);
    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const existing = await prisma.internalUser.findUnique({
      where: { id },
    });

    if (!existing) {
      return failOutput("Internal user not found");
    }

    const updated = await prisma.internalUser.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName?.trim() ?? existing.fullName,
        role: parsed.data.role ?? existing.role,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    const adminClient = getSupabaseAdminClient();
    await adminClient.auth.admin
      .updateUserById(existing.supabaseUserId, {
        user_metadata: {
          full_name: updated.fullName,
          portal: "backoffice",
        },
        app_metadata: {
          backoffice: true,
          backoffice_role: updated.role,
        },
      })
      .catch(() => undefined);

    return okOutput(mapInternalUser(updated), ["Backoffice user updated successfully"]);
  }
}
