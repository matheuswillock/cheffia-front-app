import RegisterRestaurantForm from "@/components/RegisterRestaurantContent/RegisterRestaurantForm";
import { verifySessionServer } from "@/utils/supabase/server";

export default async function RestaurantPage() {
  const session = await verifySessionServer();

  if (!session) {
    throw new Error("Session could not be verified.");
  }
  
  const { user_metadata, id } = session;

  console.log('Register -> RestaurantPage | user_metadata', user_metadata);
  console.log('Register -> RestaurantPage | id', id);

  return (
    <div className="w-screen flex min-h-svh flex-col items-center bg-background-default-default justify-center p-6 md:p-10">
      <div className="w-full mx-auto max-w-sm md:max-w-3xl">
        <RegisterRestaurantForm 
          email={user_metadata.email || null}
          id={id}
          ownerFullName={user_metadata.full_name} 
          emailVerified={user_metadata.email_verified}
          avatarUrl={user_metadata.avatar_url}
        />
      </div>
    </div>
  );
}
