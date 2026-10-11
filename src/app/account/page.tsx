import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SecurityPanel from "@/components/admin/SecurityPanel";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <SecurityPanel />
      </div>
    </main>
  );
}
