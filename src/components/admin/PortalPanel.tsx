"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { checkout } from "@/lib/checkout";
export default function PortalPanel() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function load() {
    const r = await fetch("/api/portal");
    const p = await r.json();
    if (!r.ok) {
      setError(p.error);
      return;
    }
    setData(p);
  }
  useEffect(() => {
    void load();
  }, []);
  async function send() {
    const r = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const p = await r.json();
    if (r.ok) {
      toast.success("Message saved for your firm");
      setMessage("");
      await load();
    } else toast.error(p.error);
  }
  if (error) return <p>{error}</p>;
  if (!data) return <p className="p-8">Loading your portal…</p>;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-950 text-white flex justify-between p-5">
        <strong>LexFirm Pro · Client portal</strong>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-serif">Welcome, {data.client.name}</h1>
        <Link href="/consultation" className="text-blue-700">
          Request appointment
        </Link>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">My cases</h2>
          {data.cases.map((c: any) => (
            <div key={c.id} className="border-t py-3 mt-3">
              <strong>{c.title}</strong>
              <p className="text-sm">
                {c.caseId} · {c.status} · {c.stage} · {c.court}
              </p>
              <p className="text-sm">
                Advocate: {c.seniorAdvocate?.user.name || "To be assigned"} ·
                Next hearing:{" "}
                {c.nextHearingDate
                  ? new Date(c.nextHearingDate).toLocaleDateString("en-IN")
                  : "Not scheduled"}
              </p>
            </div>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Hearings</h2>
          {data.hearings.map((h: any) => (
            <p key={h.id} className="text-sm mt-3">
              {new Date(h.hearingDate).toLocaleString("en-IN")} · {h.court} ·{" "}
              {h.purpose} · {h.status}
            </p>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Shared documents</h2>
          {data.documents.map((d: any) => (
            <a
              key={d.id}
              className="block text-blue-700 mt-3 text-sm"
              href={`/api/files/${d.id}`}
            >
              {d.name} · version {d.version}
            </a>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Invoices & payment history</h2>
          {data.invoices.map((i: any) => (
            <div key={i.id} className="border-t py-3 mt-3">
              <strong>{i.invoiceNumber}</strong>
              <p>
                Total ₹{i.totalAmount.toLocaleString("en-IN")} · Paid ₹
                {i.paidAmount.toLocaleString("en-IN")} · Pending ₹
                {i.pendingAmount.toLocaleString("en-IN")}
              </p>
              {i.pendingAmount > 0 && i.status !== "CANCELLED" && (
                <button
                  onClick={() =>
                    checkout(i.id, () => {
                      toast.success("Payment verified");
                      void load();
                    }).catch((e) => toast.error(e.message))
                  }
                  className="text-blue-700 text-sm my-2"
                >
                  Pay online
                </button>
              )}
              {i.payments.map((p: any) => (
                <p key={p.id} className="text-sm">
                  {new Date(p.paymentDate).toLocaleDateString("en-IN")} · ₹
                  {p.amount} · {p.paymentMethod} · {p.receiptNumber}
                </p>
              ))}
            </div>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Notifications</h2>
          {data.notifications.map((n: any) => (
            <p key={n.id} className="text-sm mt-3">
              <strong>{n.title}</strong> · {n.message}
            </p>
          ))}
        </section>
        <section className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold">Messages</h2>
          <textarea
            aria-label="Message to your firm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-lg p-3 mt-3"
          />
          <button
            onClick={send}
            className="bg-navy-900 text-white p-2 rounded-lg"
          >
            Send message
          </button>
          {data.communications.map((c: any) => (
            <p key={c.id} className="border-t py-2 mt-2 text-sm">
              {new Date(c.sentAt).toLocaleString("en-IN")} · {c.message}
            </p>
          ))}
        </section>
      </main>
    </div>
  );
}
