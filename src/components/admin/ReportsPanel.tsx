"use client";
import { useState } from "react";
import toast from "react-hot-toast";
const types = [
  ["client", "Client report"],
  ["case", "Case report"],
  ["criminal", "Criminal cases"],
  ["civil", "Civil cases"],
  ["hearing", "Hearing report"],
  ["advocate", "Advocate workload"],
  ["employee", "Employee report"],
  ["fee", "Fee collection"],
  ["outstanding", "Outstanding payments"],
  ["expense", "Expense report"],
  ["revenue", "Revenue report"],
  ["court", "Court-wise cases"],
  ["stage", "Case-stage report"],
  ["document", "Document report"],
  ["task", "Task report"],
];
export default function ReportsPanel() {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [busy, setBusy] = useState("");
  async function download(type: string, format: string) {
    setBusy(type);
    try {
      const q = new URLSearchParams({ type, format, from, to });
      const r = await fetch(`/api/admin/reports?${q}`);
      if (!r.ok) throw new Error((await r.json()).error);
      if (format === "excel") {
        const url = URL.createObjectURL(await r.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}-report.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const { rows } = await r.json();
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF({ orientation: "landscape" });
        doc.text(
          `${types.find((t) => t[0] === type)?.[1]} | LexFirm Pro`,
          14,
          15,
        );
        const cells = rows.flatMap((row: any, index: number) => [
          ["Record", String(index + 1)],
          ...Object.entries(row).map(([key, value]) => [
            key,
            String(value ?? ""),
          ]),
        ]);
        autoTable(doc, {
          startY: 22,
          head: [["Field", "Value"]],
          body: cells,
          styles: { fontSize: 8, overflow: "linebreak" },
          columnStyles: { 0: { cellWidth: 55 } },
          margin: 14,
        });
        if (!rows.length) doc.text("No records in the selected period", 14, 30);
        doc.save(`${type}-report.pdf`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif font-bold">Reports & exports</h1>
      <p className="text-slate-500">
        Generate reports from saved records. Your role controls which reports
        you can access. Date filters apply to creation dates, hearing dates or
        payment dates as relevant.
      </p>
      <div className="flex gap-4">
        <label className="text-sm">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block border p-2 rounded-lg"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block border p-2 rounded-lg"
          />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {types.map(([id, name]) => (
          <section key={id} className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-4">{name}</h2>
            <div className="flex gap-3">
              <button
                disabled={!!busy}
                onClick={() => download(id, "pdf")}
                className="bg-navy-900 text-white rounded-lg px-4 py-2 text-sm"
              >
                PDF
              </button>
              <button
                disabled={!!busy}
                onClick={() => download(id, "excel")}
                className="border rounded-lg px-4 py-2 text-sm"
              >
                Excel
              </button>
            </div>
            {busy === id && <p className="text-sm mt-2">Preparing…</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
