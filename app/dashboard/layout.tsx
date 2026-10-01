import { redirect } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  if (
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN"
  ) {
    redirect("/admin");
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}