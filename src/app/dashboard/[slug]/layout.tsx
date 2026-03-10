import { redirect } from "next/navigation";
import { resolveRestaurantPortalContext } from "@/app/_lib/restaurantPortalContext";
import { RestaurantShell } from "@/components/restaurant-shell/restaurant-shell";

interface DashboardSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function DashboardSlugLayout({ children, params }: DashboardSlugLayoutProps) {
  const { slug } = await params;
  const portalContext = await resolveRestaurantPortalContext();

  if (slug !== portalContext.user.supabaseId) {
    redirect(`/dashboard/${portalContext.user.supabaseId}`);
  }

  return (
    <RestaurantShell restaurantId={portalContext.restaurantId} user={portalContext.user}>
      {children}
    </RestaurantShell>
  );
}
