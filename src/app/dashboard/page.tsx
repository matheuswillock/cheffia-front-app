import { redirect } from "next/navigation";
import { verifySessionServer } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const user = await verifySessionServer();
  if (!user) {
    redirect("/sign-in");
  }
  redirect(`/dashboard/${user.id}`);
}
