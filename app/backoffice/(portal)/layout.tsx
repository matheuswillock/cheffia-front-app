import { BackofficeShell } from "@/components/backoffice/BackofficeShell";
import { requireBackofficePage } from "@/app/api/useCases/backoffice";

export default async function BackofficePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireBackofficePage({ minimumRole: "operator" });

  return <BackofficeShell currentUser={session.internalUser}>{children}</BackofficeShell>;
}
