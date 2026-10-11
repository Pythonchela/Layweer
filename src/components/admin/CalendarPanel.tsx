"use client";
import { useEffect, useState } from "react";
import { RecordsPanel } from "./AdminWorkspace";
export default function CalendarPanel() {
  const [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [records, setRecords] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const q = new URLSearchParams({
      from: month.toISOString(),
      to: to.toISOString(),
    });
    fetch(`/api/admin/calendar-month?${q}`)
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setRecords(p.records);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [month]);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <div className="space-y-7">
      <section className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            className="border rounded-lg px-3 py-2"
          >
            Previous month
          </button>
          <h1 className="font-serif font-semibold text-xl">
            {month.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            className="border rounded-lg px-3 py-2"
          >
            Next month
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-semibold p-2">
              {d}
            </div>
          ))}
          {Array.from({ length: month.getDay() }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i + 1),
              events = records.filter(
                (r) =>
                  new Date(r.hearingDate).toDateString() ===
                  date.toDateString(),
              );
            return (
              <div
                key={i}
                className={`border rounded-md p-2 min-h-20 ${date.toDateString() === new Date().toDateString() ? "bg-blue-50 border-blue-300" : ""}`}
              >
                <span className="font-semibold">{i + 1}</span>
                {events.map((e) => (
                  <details key={e.id} className="mt-1 bg-navy-50 rounded p-1">
                    <summary className="cursor-pointer truncate">
                      {e.hearingTime ||
                        new Date(e.hearingDate).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                      · {e.case.title}
                    </summary>
                    <p className="break-words">
                      {e.case.client.name} · {e.court} · {e.courtroom} ·{" "}
                      {e.purpose} · {e.status}
                    </p>
                  </details>
                ))}
              </div>
            );
          })}
        </div>
      </section>
      <RecordsPanel module="calendar" />
    </div>
  );
}
