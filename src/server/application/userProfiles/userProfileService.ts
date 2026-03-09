import { Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/server/infra/prisma/client";
import { getSupabaseAdminClient } from "@/server/infra/supabase/adminClient";
import { failOutput, okOutput, type Output } from "@/server/shared/output";
import type { UpsertUserProfileInput, UserProfileOutput } from "./types";

const PROFILE_NAME_REGEX = /^[\p{L}\s'-]+$/u;

const stripAccents = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeSpaces = (value: string): string => value.trim().replace(/\s+/g, " ");

const normalizeDigits = (value: string): string => value.replace(/\D/g, "");

const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const normalizeText = (value: string): string => normalizeSpaces(value);

const userProfileInputSchema = z.object({
  supabaseUserId: z.string().uuid("Supabase user id is required"),
  email: z.string().email("Invalid user email"),
  fullName: z
    .string()
    .trim()
    .min(3, "O nome completo deve ter no minimo 3 caracteres")
    .max(120, "O nome completo deve ter no maximo 120 caracteres")
    .regex(PROFILE_NAME_REGEX, "O nome completo deve conter apenas letras"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A data de nascimento deve estar no formato AAAA-MM-DD"),
  document: z.string().min(11, "O documento deve conter 11 digitos").max(14, "O documento deve conter 11 digitos"),
  role: z.string().trim().min(2, "A role deve ter no minimo 2 caracteres").max(80, "A role deve ter no maximo 80 caracteres"),
  jobTitle: z.string().trim().min(2, "O cargo deve ter no minimo 2 caracteres").max(120, "O cargo deve ter no maximo 120 caracteres"),
  department: z.string().trim().min(2, "O setor deve ter no minimo 2 caracteres").max(120, "O setor deve ter no maximo 120 caracteres"),
  avatarUrl: z.string().trim().url("Avatar URL invalida").optional().nullable().or(z.literal("")),
}).superRefine((data, ctx) => {
  const documentDigits = normalizeDigits(data.document);

  if (documentDigits.length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["document"],
      message: "O documento do usuario deve ser um CPF com 11 digitos",
    });
  }

  const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "A data de nascimento e invalida",
    });
    return;
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  if (birthDate.getTime() > todayUtc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthDate"],
      message: "A data de nascimento nao pode estar no futuro",
    });
  }
});

const mapProfile = (profile: {
  id: string;
  supabaseUserId: string;
  email: string;
  fullName: string;
  birthDate: Date;
  document: string;
  role: string;
  jobTitle: string;
  department: string;
  cheffiaId: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UserProfileOutput => ({
  id: profile.id,
  supabaseUserId: profile.supabaseUserId,
  email: profile.email,
  fullName: profile.fullName,
  birthDate: profile.birthDate.toISOString().slice(0, 10),
  document: profile.document,
  role: profile.role,
  jobTitle: profile.jobTitle,
  department: profile.department,
  cheffiaId: profile.cheffiaId,
  avatarUrl: profile.avatarUrl,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

const buildCheffiaPrefix = (fullName: string): string => {
  const normalizedName = stripAccents(fullName)
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalizedName.split(" ").filter(Boolean);
  const initials = words.slice(0, 3).map((word) => word[0]).join("");
  const merged = words.join("");
  const consonants = merged.replace(/[AEIOU]/g, "");
  const prefix = `${initials}${consonants}${merged}`.replace(/[^A-Z]/g, "").slice(0, 4);

  return prefix.padEnd(4, "X");
};

export class UserProfileService {
  private readonly prisma = prisma;

  public async findBySupabaseUserId(supabaseUserId: string): Promise<UserProfileOutput | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { supabaseUserId },
    });

    return profile ? mapProfile(profile) : null;
  }

  public async findByEmail(email: string): Promise<UserProfileOutput | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { email: normalizeEmail(email) },
    });

    return profile ? mapProfile(profile) : null;
  }

  public async resolvePostAuthDestination(supabaseUserId: string): Promise<string> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { supabaseUserId },
      select: { id: true },
    });

    if (!profile) return "/register/profile";

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { supabaseUserId },
      select: { id: true },
    });

    return restaurant ? `/dashboard/${supabaseUserId}` : "/register/restaurant";
  }

  public async upsert(input: UpsertUserProfileInput): Promise<Output<UserProfileOutput>> {
    const parsed = userProfileInputSchema.safeParse(input);

    if (!parsed.success) {
      return failOutput(parsed.error.issues.map((issue) => issue.message));
    }

    const normalizedInput = {
      supabaseUserId: parsed.data.supabaseUserId,
      email: normalizeEmail(parsed.data.email),
      fullName: normalizeText(parsed.data.fullName),
      birthDate: parsed.data.birthDate,
      document: normalizeDigits(parsed.data.document),
      role: normalizeText(parsed.data.role),
      jobTitle: normalizeText(parsed.data.jobTitle),
      department: normalizeText(parsed.data.department),
      avatarUrl: parsed.data.avatarUrl ? parsed.data.avatarUrl.trim() : null,
    };

    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { supabaseUserId: normalizedInput.supabaseUserId },
    });

    let persisted = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const cheffiaId =
        existingProfile?.cheffiaId ?? (await this.generateUniqueCheffiaId(normalizedInput.fullName));

      try {
        persisted = existingProfile
          ? await this.prisma.userProfile.update({
              where: { supabaseUserId: normalizedInput.supabaseUserId },
              data: {
                email: normalizedInput.email,
                fullName: normalizedInput.fullName,
                birthDate: new Date(`${normalizedInput.birthDate}T00:00:00.000Z`),
                document: normalizedInput.document,
                role: normalizedInput.role,
                jobTitle: normalizedInput.jobTitle,
                department: normalizedInput.department,
                avatarUrl: normalizedInput.avatarUrl,
              },
            })
          : await this.prisma.userProfile.create({
              data: {
                supabaseUserId: normalizedInput.supabaseUserId,
                email: normalizedInput.email,
                fullName: normalizedInput.fullName,
                birthDate: new Date(`${normalizedInput.birthDate}T00:00:00.000Z`),
                document: normalizedInput.document,
                role: normalizedInput.role,
                jobTitle: normalizedInput.jobTitle,
                department: normalizedInput.department,
                cheffiaId,
                avatarUrl: normalizedInput.avatarUrl,
              },
            });

        break;
      } catch (error) {
        if (this.isCheffiaIdCollision(error) && !existingProfile) {
          continue;
        }

        const message = error instanceof Error ? error.message : "Unexpected profile persistence error";
        return failOutput(`Falha ao salvar o perfil do usuario: ${message}`);
      }
    }

    if (!persisted) {
      return failOutput("Falha ao gerar um cheffiaId unico para o usuario");
    }

    await this.syncAuthMetadata(mapProfile(persisted));

    return okOutput(mapProfile(persisted), [
      existingProfile ? "Perfil do usuario atualizado com sucesso" : "Perfil do usuario criado com sucesso",
    ]);
  }

  private async generateUniqueCheffiaId(fullName: string): Promise<string> {
    const prefix = buildCheffiaPrefix(fullName);

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const candidate = `${prefix}${randomInt(100000, 1000000)}`;
      const existing = await this.prisma.userProfile.findUnique({
        where: { cheffiaId: candidate },
        select: { id: true },
      });

      if (!existing) return candidate;
    }

    throw new Error("Unable to allocate a unique cheffiaId");
  }

  private isCheffiaIdCollision(error: unknown): boolean {
    const target = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : null;
    const normalizedTargets = Array.isArray(target)
      ? target.map((item) => String(item))
      : typeof target === "string"
        ? [target]
        : [];

    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      normalizedTargets.some((item) => item.includes("cheffia_id") || item.includes("cheffiaId"))
    );
  }

  private async syncAuthMetadata(profile: UserProfileOutput): Promise<void> {
    try {
      const adminClient = getSupabaseAdminClient();
      const fetched = await adminClient.auth.admin.getUserById(profile.supabaseUserId);

      if (fetched.error) {
        console.error("user_profiles.sync_auth_metadata.get_user_failed", {
          supabaseUserId: profile.supabaseUserId,
          message: fetched.error.message,
        });
        return;
      }

      const currentMetadata = (fetched.data.user?.user_metadata ?? {}) as Record<string, unknown>;
      const nextMetadata = {
        ...currentMetadata,
        full_name: profile.fullName,
        cheffia_id: profile.cheffiaId,
        role: profile.role,
        job_title: profile.jobTitle,
        department: profile.department,
        profile_completed: true,
      };

      const updated = await adminClient.auth.admin.updateUserById(profile.supabaseUserId, {
        user_metadata: nextMetadata,
      });

      if (updated.error) {
        console.error("user_profiles.sync_auth_metadata.update_failed", {
          supabaseUserId: profile.supabaseUserId,
          message: updated.error.message,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected auth metadata sync error";
      console.error("user_profiles.sync_auth_metadata.failed", {
        supabaseUserId: profile.supabaseUserId,
        message,
      });
    }
  }
}
