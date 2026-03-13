import { RestaurantAccountContainer } from "@/app/restaurant/account/features/container/RestaurantAccountContainer";
import { RestaurantAccountFeatureProvider } from "@/app/restaurant/account/features/context/RestaurantAccountFeatureContext";

export default function AccountPage() {
  return (
    <RestaurantAccountFeatureProvider>
      <RestaurantAccountContainer />
    </RestaurantAccountFeatureProvider>
  );
}
