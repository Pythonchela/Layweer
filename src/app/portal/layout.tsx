import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword || user.mustEnable2FA) redirect("/account");
  if (user.role !== "CLIENT") redirect("/admin/dashboard");
  return children;
}
