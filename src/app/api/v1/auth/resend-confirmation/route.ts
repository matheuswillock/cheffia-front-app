import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  createEmailConfirmationLink,
  getDisplayNameFromSupabaseUser,
  getEmailService,
} from "@/server/application/email";
import { RestaurantService } from "@/server/application/restaurant";
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

    const restaurantService = new RestaurantService();

    try {
      const link = await createEmailConfirmationLink({
        email: parsed.data.email,
        nextPath: parsed.data.nextPath,
        appBaseUrl: request.nextUrl.origin,
      });

      if (link.supabaseUser.email_confirmed_at) {
        try {
          await restaurantService.syncEmailVerifiedBySupabaseUserId(link.supabaseUser.id, true);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown email sync error";
          console.error("auth.resend_confirmation.email_sync_failed", {
            email: parsed.data.email,
            supabaseUserId: link.supabaseUser.id,
            message,
          });
        }

        return NextResponse.json(safeSuccessResponse, { status: 200 });
      }

      const result = await getEmailService().sendEmailConfirmationEmail(
        {
          userName: getDisplayNameFromSupabaseUser(link.supabaseUser, parsed.data.email),
          userEmail: link.email,
          confirmationUrl: link.deliveryUrl,
        },
        {
          supabaseUserId: link.supabaseUser.id,
        }
      );

      if (!result.success) {
        console.error("auth.resend_confirmation.email_failed", {
          email: link.email,
          supabaseUserId: link.supabaseUser.id,
          message: result.error,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown resend confirmation error";
      console.error("auth.resend_confirmation.email_failed", {
        email: parsed.data.email,
        message,
      });
    }

    return NextResponse.json(safeSuccessResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(fromThrowable(error), { status: 500 });
  }
}
