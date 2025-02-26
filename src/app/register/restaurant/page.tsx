import RegisterRestaurantForm from "@/components/RegisterRestaurantContent/RegisterRestaurantForm";
import { checkUserSession } from "@/utils/supabase/client";

export default async function RestaurantPage() {
  const { user_metadata, id } = await checkUserSession();

  console.log(user_metadata);

  return (
    <div className="flex min-h-svh flex-col items-center bg-background justify-center p-6 md:p-10">
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
