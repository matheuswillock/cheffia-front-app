import RegisterRestaurantForm from "@/components/RegisterRestaurantContent/RegisterRestaurantForm";
import { verifySessionServer } from "@/utils/supabase/server";

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export default async function RestaurantPage() {
  const session = await verifySessionServer();

  if (!session) {
    throw new Error("Session could not be verified.");
  }

  const ownerFullName =
    readString(session.user_metadata?.full_name) ??
    readString(session.user_metadata?.name) ??
    undefined;
  const avatarUrl = readString(session.user_metadata?.avatar_url);
  const email =
    session.email ??
    readString(session.user_metadata?.email) ??
    "";

  return (
    <div className="flex min-h-svh flex-col items-center bg-background-default justify-center p-6 md:p-10">
      <div className="w-full mx-auto max-w-sm md:max-w-3xl">
        <RegisterRestaurantForm
          email={email}
          id={session.id}
          ownerFullName={ownerFullName}
          emailVerified={Boolean(session.email_confirmed_at)}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  );
}
