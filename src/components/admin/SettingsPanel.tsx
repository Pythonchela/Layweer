"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
export default function SettingsPanel() {
  const [data, setData] = useState<any>(null),
    [form, setForm] = useState<any>({}),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setData(p);
        setForm(p.settings);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const p = await r.json();
    r.ok ? toast.success("Settings saved") : toast.error(p.error);
  }
  async function backup() {
    const r = await fetch("/api/admin/backup");
    if (!r.ok) {
      toast.error((await r.json()).error);
      return;
    }
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "lexfirm-backup.lfbackup";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="text-2xl font-serif font-bold">Firm settings</h1>
      <form
        onSubmit={save}
        className="bg-white rounded-xl border p-5 grid md:grid-cols-2 gap-4"
      >
        {[
          "firmName",
          "firmEmail",
          "firmPhone",
          "firmAddress",
          "gstNumber",
          "notificationEmail",
        ].map((k) => (
          <label key={k} className="text-sm">
            {k.replace(/([A-Z])/g, " $1")}
            <input
              value={form[k] || ""}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="block w-full border p-2 rounded-lg mt-1"
            />
          </label>
        ))}
        <button className="bg-navy-900 rounded-lg text-white p-2">
          Save settings
        </button>
        <Link href="/admin/security" className="p-2 text-blue-700">
          Password, 2FA & sessions
        </Link>
      </form>
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">Backup</h2>
        <p className="text-sm text-slate-500 mb-3">
          Download an encrypted backup of records and document files. Store the
          document encryption key separately so files can be restored. Backups
          contain sensitive firm information.
        </p>
        <button onClick={backup} className="border rounded-lg p-2">
          Download backup (Super Admin)
        </button>
      </section>
      <section className="bg-white rounded-xl border p-5 overflow-auto">
        <h2 className="font-semibold mb-3">Enforced role permissions</h2>
        {Object.entries(data?.roles || {}).map(([role, p]) => (
          <p key={role} className="text-sm border-t py-2">
            <strong>{role}</strong>: {(p as string[]).join(", ")}
          </p>
        ))}
      </section>
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">Firm activity log</h2>
        {data?.logs?.map((l: any) => (
          <p key={l.id} className="text-sm border-t py-2">
            {new Date(l.createdAt).toLocaleString("en-IN")} · {l.user.name} ·{" "}
            {l.action} · {l.entity}
          </p>
        ))}
      </section>
    </div>
  );
}
