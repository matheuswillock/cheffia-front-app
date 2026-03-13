import { redirect } from "next/navigation";
import { verifySessionServer } from "@/utils/supabase/server";
import { UserProfileService } from "@/server/application/userProfiles";

export default async function RegisterProfilePage() {
  const session = await verifySessionServer();

  if (!session) {
    throw new Error("Session could not be verified.");
  }

  const profileService = new UserProfileService();
  redirect(await profileService.resolvePostAuthDestination(session.id));
}
