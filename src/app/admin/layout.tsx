import { currentUser, ROLE_PERMISSIONS } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminWorkspace from "@/components/admin/AdminWorkspace";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword || user.mustEnable2FA) redirect("/account");
  if (user.role === "CLIENT") redirect("/portal");
  return (
    <AdminWorkspace
      user={{ name: user.name, role: user.role }}
      permissions={ROLE_PERMISSIONS[user.role] || []}
    >
      {children}
    </AdminWorkspace>
  );
}
