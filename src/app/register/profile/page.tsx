import { redirect } from "next/navigation";
import RegisterProfileForm from "@/components/RegisterProfileContent/RegisterProfileForm";
import { verifySessionServer } from "@/utils/supabase/server";
import { UserProfileService } from "@/server/application/userProfiles";

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export default async function RegisterProfilePage() {
  const session = await verifySessionServer();

  if (!session) {
    throw new Error("Session could not be verified.");
  }

  const profileService = new UserProfileService();
  const nextPath = await profileService.resolvePostAuthDestination(session.id);

  if (nextPath !== "/register/profile") {
    redirect(nextPath);
  }

  const initialFullName =
    readString(session.user_metadata?.full_name) ??
    readString(session.user_metadata?.name) ??
    undefined;

  const email = session.email ?? readString(session.user_metadata?.email) ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background-default-default p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <RegisterProfileForm
          email={email}
          initialFullName={initialFullName}
        />
      </div>
    </div>
  );
}
