import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { RestaurantService } from "@/app/api/useCases/restaurant";
import { normalizeRelativeAppPath } from "@/app/api/useCases/email";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = normalizeRelativeAppPath(searchParams.get("next"), "/");

  if (token_hash && type) {
    const supabase = await createClient();
    const restaurantService = new RestaurantService();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const supabaseUserId = data.user?.id;

      if (supabaseUserId) {
        try {
          await restaurantService.syncEmailVerifiedFromAuthState(supabaseUserId);
        } catch (syncError) {
          const message =
            syncError instanceof Error ? syncError.message : "Unknown email sync error";
          console.error("auth.confirm.email_sync_failed", {
            supabaseUserId,
            message,
          });
        }
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/error", origin));
}
