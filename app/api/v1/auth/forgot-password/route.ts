import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordRecoveryLink,
  getDisplayNameFromSupabaseUser,
  getEmailService,
} from "@/app/api/useCases/email";
import { failOutput, fromThrowable, okOutput } from "@/lib/server/output";
import { resolveRequestIdFromRequest } from "@/lib/server/requestId";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalido."),
  nextPath: z.string().trim().optional().default("/set-password"),
});

const safeSuccessResponse = okOutput<null>(null, [
  "Se existir uma conta com esse email, enviamos um link para redefinir a senha.",
]);

export async function POST(request: NextRequest) {
  const requestId = resolveRequestIdFromRequest(request);

  try {
    const body = (await request.json()) as unknown;
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(failOutput(parsed.error.issues.map((issue) => issue.message)), {
        status: 400,
      });
    }

    try {
      const link = await createPasswordRecoveryLink({
        email: parsed.data.email,
        nextPath: parsed.data.nextPath,
        appBaseUrl: request.nextUrl.origin,
      });

      const result = await getEmailService().sendPasswordResetEmail(
        {
          userName: getDisplayNameFromSupabaseUser(link.supabaseUser, parsed.data.email),
          userEmail: parsed.data.email,
          resetUrl: link.deliveryUrl,
        },
        {
          supabaseUserId: link.supabaseUser.id,
          requestId,
        }
      );

      if (!result.success) {
        console.error("auth.forgot_password.email_failed", {
          requestId,
          email: parsed.data.email,
          supabaseUserId: link.supabaseUser.id,
          message: result.error,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown forgot password error";
      console.error("auth.forgot_password.email_failed", {
        requestId,
        email: parsed.data.email,
        message,
      });
    }

    return NextResponse.json(safeSuccessResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(fromThrowable(error, { requestId }), { status: 500 });
  }
}
