import RegisterRestaurantForm from "@/components/RegisterRestaurantContent/RegisterRestaurantForm";
import { verifySessionServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserProfileService } from "@/server/application/userProfiles";

export default async function RestaurantPage() {
  const session = await verifySessionServer();
  const profileService = new UserProfileService();

  if (!session) {
    throw new Error("Session could not be verified.");
  }

  const profile = await profileService.findBySupabaseUserId(session.id);

  if (!profile) {
    redirect("/register/profile");
  }

  return (
    <div className="flex min-h-svh flex-col items-center bg-background-default-default justify-center p-6 md:p-10">
      <div className="w-full mx-auto max-w-sm md:max-w-3xl">
        <RegisterRestaurantForm 
          email={session.email ?? profile.email}
          id={session.id}
          ownerFullName={profile.fullName}
          emailVerified={Boolean(session.email_confirmed_at)}
          avatarUrl={
            (typeof session.user_metadata?.avatar_url === "string"
              ? session.user_metadata.avatar_url
              : profile.avatarUrl) ?? undefined
          }
        />
      </div>
    </div>
  );
}
