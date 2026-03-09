import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  createEmailConfirmationLink,
  getEmailService,
} from "@/server/application/email";
import { RestaurantService } from "@/server/application/restaurant";
import { UserProfileService } from "@/server/application/userProfiles";
import { failOutput, fromThrowable, okOutput } from "@/server/shared/output";

export const runtime = "nodejs";

const resendConfirmationSchema = z.object({
  email: z.string().trim().email("Email invalido."),
  nextPath: z.string().trim().optional().default("/register/restaurant"),
});

const safeSuccessResponse = okOutput<null>(null, [
  "Se a conta ainda precisar de confirmacao, enviamos um novo link para o email informado.",
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = resendConfirmationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failOutput(parsed.error.issues.map((issue) => issue.message)), {
        status: 400,
      });
    }

    const profileService = new UserProfileService();
    const restaurantService = new RestaurantService();
    const profile = await profileService.findByEmail(parsed.data.email);

    if (!profile) {
      return NextResponse.json(safeSuccessResponse, { status: 200 });
    }

    const emailVerified = await restaurantService.readAuthEmailVerified(profile.supabaseUserId);

    if (emailVerified === true) {
      try {
        await restaurantService.syncEmailVerifiedBySupabaseUserId(profile.supabaseUserId, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown email sync error";
        console.error("auth.resend_confirmation.email_sync_failed", {
          email: parsed.data.email,
          supabaseUserId: profile.supabaseUserId,
          message,
        });
      }

      return NextResponse.json(safeSuccessResponse, { status: 200 });
    }

    try {
      const link = await createEmailConfirmationLink({
        email: profile.email,
        nextPath: parsed.data.nextPath,
        appBaseUrl: request.nextUrl.origin,
      });

      const result = await getEmailService().sendEmailConfirmationEmail(
        {
          userName: profile.fullName,
          userEmail: profile.email,
          confirmationUrl: link.deliveryUrl,
        },
        {
          supabaseUserId: profile.supabaseUserId,
        }
      );

      if (!result.success) {
        console.error("auth.resend_confirmation.email_failed", {
          email: profile.email,
          supabaseUserId: profile.supabaseUserId,
          message: result.error,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown resend confirmation error";
      console.error("auth.resend_confirmation.email_failed", {
        email: parsed.data.email,
        supabaseUserId: profile.supabaseUserId,
        message,
      });
    }

    return NextResponse.json(safeSuccessResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
