import { resolveRestaurantPortalContext } from "@/app/_lib/restaurantPortalContext";
import { RestaurantShell } from "@/components/restaurant-shell/restaurant-shell";

interface RestaurantLayoutProps {
  children: React.ReactNode;
}

export default async function RestaurantLayout({ children }: RestaurantLayoutProps) {
  const portalContext = await resolveRestaurantPortalContext();

  return (
    <RestaurantShell restaurantId={portalContext.restaurantId} user={portalContext.user}>
      {children}
    </RestaurantShell>
  );
}
