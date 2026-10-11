"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
const labels: Record<string, string> = {
  clients: "Total clients",
  activeCases: "Active cases",
  criminal: "Criminal cases",
  civil: "Civil cases",
  todayHearings: "Today's hearings",
  upcomingHearings: "Upcoming hearings",
  pendingTasks: "Pending tasks",
  pendingFees: "Pending fees",
  employees: "Employees",
};
export default function DashboardPanel() {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setData(p);
      })
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading dashboard…</p>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-navy-900">
          Management dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Live information from your firm’s saved records.
        </p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(data.stats)
          .filter(([, v]) => v !== null)
          .map(([k, v]) => (
            <div key={k} className="bg-white rounded-xl border p-5">
              <div className="text-sm text-slate-500">{labels[k]}</div>
              <div className="text-2xl font-semibold mt-2">
                {k === "pendingFees"
                  ? `₹${Number(v).toLocaleString("en-IN")}`
                  : String(v)}
              </div>
            </div>
          ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {Object.entries(data.charts)
          .filter(([, v]) => (v as any[]).length > 0)
          .map(([k, v]) => (
            <div key={k} className="bg-white rounded-xl border p-5">
              <h2 className="font-semibold mb-4">
                {
                  (
                    {
                      court: "Cases by court",
                      practice: "Cases by practice area",
                      status: "Case status",
                      revenue: "Monthly collections (INR)",
                      workload: "Advocate case workload",
                      balances: "Pending fees by client (INR)",
                      hearingDays: "Upcoming hearings by date",
                    } as any
                  )[k]
                }
              </h2>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={v as any[]}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <section className="bg-white border rounded-xl p-5">
          <Link href="/admin/calendar" className="font-semibold">
            Upcoming hearings
          </Link>
          <div className="divide-y mt-3">
            {data.hearings.map((h: any) => (
              <div key={h.id} className="py-3 text-sm">
                <strong>{h.case.title}</strong>
                <p>
                  {h.case.client.name} · {h.court} ·{" "}
                  {new Date(h.hearingDate).toLocaleString("en-IN")}
                </p>
                <p className="text-slate-500">{h.purpose}</p>
              </div>
            ))}
            {!data.hearings.length && (
              <p className="text-sm text-slate-500">No upcoming hearings.</p>
            )}
          </div>
        </section>
        <section className="bg-white border rounded-xl p-5">
          <Link href="/admin/tasks" className="font-semibold">
            Pending tasks
          </Link>
          <div className="divide-y mt-3">
            {data.tasks.map((t: any) => (
              <div key={t.id} className="py-3 text-sm">
                <strong>{t.title}</strong>
                <p>
                  {t.priority} ·{" "}
                  {t.dueDate
                    ? new Date(t.dueDate).toLocaleDateString("en-IN")
                    : "No deadline"}
                </p>
              </div>
            ))}
            {!data.tasks.length && (
              <p className="text-sm text-slate-500">No pending tasks.</p>
            )}
          </div>
        </section>
      </div>
      {data.holidays.length > 0 && (
        <section className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Upcoming court holidays</h2>
          {data.holidays.map((h: any) => (
            <p key={h.id} className="text-sm mt-2">
              {new Date(h.date).toLocaleDateString("en-IN")} · {h.name} ·{" "}
              {h.court || "All courts"}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
