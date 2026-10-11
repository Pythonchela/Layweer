"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scale, Menu, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { checkout } from "@/lib/checkout";
const sections = [
  ["dashboard", "Dashboard", "dashboard"],
  ["clients", "Clients", "clients"],
  ["cases", "Cases", "cases"],
  ["criminal", "Criminal cases", "cases"],
  ["civil", "Civil cases", "cases"],
  ["history", "Case history", "cases"],
  ["calendar", "Hearings", "calendar"],
  ["holidays", "Court holidays", "calendar"],
  ["documents", "Documents", "documents"],
  ["employees", "Employees", "employees"],
  ["attendance", "Attendance", "employees"],
  ["leave", "Leave", "employees"],
  ["payroll", "Payroll", "employees"],
  ["employeeDocuments", "Employee files", "employees"],
  ["billing", "Invoices", "billing"],
  ["payments", "Payments & receipts", "billing"],
  ["expenses", "Expenses", "billing"],
  ["leads", "Leads", "leads"],
  ["appointments", "Appointments", "appointments"],
  ["tasks", "Tasks", "tasks"],
  ["communications", "Communications", "clients"],
  ["reminders", "Reminder outbox", "calendar"],
  ["reports", "Reports", "reports"],
  ["settings", "Settings", "settings"],
  ["news", "News", "settings"],
  ["testimonials", "Testimonials", "settings"],
];
export default function AdminWorkspace({
  children,
  user,
  permissions,
}: {
  children: React.ReactNode;
  user: { name: string; role: string };
  permissions: string[];
}) {
  const pathname = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false);
  const links = sections.filter(
    (s) =>
      permissions.includes("*") ||
      (permissions.includes(`${s[2]}:read`) &&
        (!["payroll", "employeeDocuments"].includes(s[0]) ||
          permissions.includes("employees:sensitive"))),
  );
  const allowed = links.some((s) => pathname === `/admin/${s[0]}`);
  async function logout() {
    const r = await fetch("/api/auth/logout", { method: "POST" });
    if (r.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
      router.refresh();
    } else toast.error("Unable to sign out");
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed inset-x-0 top-0 h-16 z-30 bg-navy-950 text-white flex items-center gap-4 px-5">
        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
        >
          <Menu />
        </button>
        <Link
          href="/admin/dashboard"
          className="font-serif text-xl flex items-center gap-2"
        >
          <Scale className="text-gold-400" />
          LexFirm Pro
        </Link>
        <div className="ml-auto text-right text-sm">
          <div>{user.name}</div>
          <div className="text-xs text-gray-300">
            {user.role.replaceAll("_", " ")}
          </div>
        </div>
        <button onClick={logout} aria-label="Sign out" className="p-2">
          <LogOut size={19} />
        </button>
      </header>
      <aside
        className={`${open ? "block" : "hidden"} lg:block fixed top-16 bottom-0 left-0 w-60 bg-white border-r overflow-auto z-20 p-3`}
      >
        <nav className="space-y-1">
          {links.map(([id, label]) => (
            <Link
              key={id}
              href={`/admin/${id}`}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${pathname === `/admin/${id}` ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </Link>
          ))}
          <Link href="/admin/security" className="block px-3 py-2 text-sm">
            My account & security
          </Link>
        </nav>
      </aside>
      <main className="pt-20 p-4 lg:ml-60 lg:p-8 lg:pt-24">
        {allowed || pathname === "/admin/security" ? (
          children
        ) : (
          <div role="alert" className="bg-white border rounded-xl p-8">
            Your role does not have access to this module.
          </div>
        )}
      </main>
    </div>
  );
}

type Field = {
  name: string;
  type: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
};
const label = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Id$/, " ID")
    .replace(/^./, (c) => c.toUpperCase());
type Row = Record<string, any>;
export function RecordsPanel({ module }: { module: string }) {
  const [payload, setPayload] = useState<{
      records: Row[];
      fields: Field[];
      lookups: any;
      canWrite: boolean;
      canCreate: boolean;
      canManageAccounts: boolean;
      canManageTeam: boolean;
      canPublish: boolean;
      ownEmployeeId?: string;
      canDelete: boolean;
      canProvisionLogin: boolean;
      title: string;
      total: number;
      page: number;
      pages: number;
    } | null>(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState<Row | null>(null),
    [form, setForm] = useState<Row>({}),
    [busy, setBusy] = useState(false),
    [view, setView] = useState<Row | null>(null),
    [file, setFile] = useState<File | null>(null),
    [invoiceItems, setInvoiceItems] = useState([
      {
        description: "Legal services",
        feeType: "CASE_FEE",
        quantity: 1,
        rate: 0,
      },
    ]);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const serial = ++requestId.current;
    try {
      const r = await fetch(
        `/api/admin/${module}?page=${page}&search=${encodeURIComponent(search)}`,
      );
      const p = await r.json();
      if (!r.ok) throw new Error(p.error);
      if (serial === requestId.current) {
        setPayload(p);
        setError("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [module, page, search]);
  useEffect(() => {
    void load();
  }, [load]);
  const show = async (id: string, version?: number) => {
    const r = await fetch(
      `/api/files/${id}${version ? `?version=${version}` : ""}`,
    );
    if (!r.ok) {
      const p = await r.json();
      toast.error(p.error);
      return;
    }
    const url = URL.createObjectURL(await r.blob());
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const start = (row: Row = {}) => {
    setEditing(row);
    const defaults = Object.fromEntries(
      (payload?.fields || [])
        .filter((f) => f.defaultValue !== undefined)
        .map((f) => [f.name, f.defaultValue]),
    );
    setForm(
      row.user
        ? { ...defaults, ...row, ...row.user, id: row.id }
        : {
            ...defaults,
            ...(module === "cases" && !row.id && !payload?.canManageTeam
              ? { seniorAdvocateId: payload?.ownEmployeeId }
              : {}),
            ...row,
          },
    );
    setFile(null);
    setInvoiceItems([
      {
        description: "Legal services",
        feeType: "CASE_FEE",
        quantity: 1,
        rate: 0,
      },
    ]);
  };
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let r: Response;
      if (module === "documents" || module === "employeeDocuments") {
        if (!file) throw new Error("Choose a file");
        const body = new FormData();
        body.set("file", file);
        body.set("module", module);
        Object.entries(form).forEach(([k, v]) => {
          if (v != null) body.set(k, String(v));
        });
        r = await fetch("/api/files", { method: "POST", body });
      } else
        r = await fetch(`/api/admin/${module}`, {
          method: editing?.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            ...(module === "billing" ? { items: invoiceItems } : {}),
          }),
        });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      toast.success("Saved successfully");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(row: Row, name: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name, id: row.id }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p.error);
      toast.success("Updated successfully");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row: Row) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const r = await fetch(`/api/admin/${module}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id }),
    });
    const p = await r.json();
    if (!r.ok) toast.error(p.error);
    else {
      toast.success("Deleted");
      await load();
    }
  }
  async function downloadInvoice(row: Row) {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;
    const text = (s: string) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(s, 15, y);
      y += 9;
    };
    text(module === "payments" ? "PAYMENT RECEIPT" : "INVOICE");
    text(row.invoiceNumber || row.receiptNumber);
    text(`Date: ${new Date(row.createdAt).toLocaleDateString("en-IN")}`);
    text(`Client: ${display("clientId", row.clientId)}`);
    for (const i of row.items || [])
      text(`${i.description}: ${i.quantity} x INR ${i.rate} = INR ${i.amount}`);
    if (row.gstAmount) text(`GST: INR ${row.gstAmount}`);
    text(`Amount: INR ${row.totalAmount ?? row.amount}`);
    if (row.pendingAmount != null)
      text(`Paid: INR ${row.paidAmount} | Balance: INR ${row.pendingAmount}`);
    doc.save(`${row.invoiceNumber || row.receiptNumber}.pdf`);
  }
  if (error)
    return (
      <div role="alert" className="bg-red-50 rounded-xl p-5 text-red-700">
        {error}
        <button onClick={load} className="ml-4 underline">
          Retry
        </button>
      </div>
    );
  if (!payload) return <p>Loading records…</p>;
  const { records, fields, lookups, canWrite, title } = payload;
  function choices(name: string) {
    if (["clientId"].includes(name))
      return lookups.clients.map((r: Row) => ({
        id: r.id,
        name: `${r.clientId} · ${r.name}`,
      }));
    if (name === "caseId")
      return lookups.cases.map((r: Row) => ({
        id: r.id,
        name: `${r.caseId} · ${r.title}`,
      }));
    if (
      [
        "employeeId",
        "seniorAdvocateId",
        "juniorAdvocateId",
        "clerkId",
        "advocateId",
        "assignedAdvocate",
        "assignedClerk",
      ].includes(name)
    )
      return lookups.employees
        .filter((r: Row) => {
          const roles: Record<string, string[]> = {
            seniorAdvocateId: ["SENIOR_ADVOCATE", "ADVOCATE"],
            juniorAdvocateId: [
              "JUNIOR_ADVOCATE",
              "ASSOCIATE",
              "LEGAL_ASSISTANT",
            ],
            clerkId: ["CLERK", "TYPIST"],
            assignedClerk: ["CLERK", "TYPIST"],
            assignedAdvocate: [
              "SENIOR_ADVOCATE",
              "ADVOCATE",
              "JUNIOR_ADVOCATE",
              "ASSOCIATE",
            ],
            advocateId: [
              "SENIOR_ADVOCATE",
              "ADVOCATE",
              "JUNIOR_ADVOCATE",
              "ASSOCIATE",
            ],
          };
          return !roles[name] || roles[name].includes(r.user.role);
        })
        .map((r: Row) => ({
          id: r.id,
          name: r.user.name,
        }));
    if (["assigneeId", "assignedTo"].includes(name)) return lookups.users;
    if (name === "invoiceId")
      return (lookups.invoices || []).filter(
        (r: Row) => !form.clientId || r.clientId === form.clientId,
      );
    return null;
  }
  function display(name: string, value: any): string {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    const c = choices(name)?.find((r: Row) => r.id === value);
    if (c) return c.name;
    if (/^\d{4}-\d\d-\d\dT/.test(String(value)))
      return ["hearingDate", "appointmentDate", "checkIn", "checkOut"].includes(
        name,
      )
        ? new Date(value).toLocaleString("en-IN")
        : new Date(value).toLocaleDateString("en-IN");
    return String(value);
  }
  const visible = records;
  const preferred: Record<string, string[]> = {
    clients: ["clientId", "name", "mobile", "city", "clientType"],
    cases: ["caseId", "title", "court", "stage", "status", "nextHearingDate"],
    criminal: [
      "caseId",
      "firNumber",
      "accusedName",
      "bailStatus",
      "trialStage",
    ],
    civil: [
      "caseId",
      "plaintiffName",
      "defendantName",
      "suitType",
      "injunctionStatus",
    ],
    employees: ["employeeId", "name", "role", "department", "joiningDate"],
    calendar: [
      "caseId",
      "hearingDate",
      "hearingTime",
      "court",
      "purpose",
      "status",
    ],
    billing: [
      "invoiceNumber",
      "clientId",
      "totalAmount",
      "paidAmount",
      "pendingAmount",
      "status",
    ],
    payments: [
      "receiptNumber",
      "clientId",
      "amount",
      "paymentMethod",
      "paymentDate",
    ],
    documents: ["name", "caseId", "category", "version", "isPublic"],
    tasks: ["title", "assigneeId", "priority", "status", "dueDate"],
    leads: ["name", "mobile", "practiceArea", "status", "followUpDate"],
    reminders: ["message", "type", "sendAt", "deliveryStatus", "lastError"],
  };
  const columns = preferred[module] || fields.slice(0, 6).map((f) => f.name);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-900">
            {title}
          </h1>
          <p className="text-sm text-slate-500">
            {payload.total} saved records
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="border rounded-lg px-4 py-2 bg-white text-sm"
          >
            Refresh
          </button>
          {canWrite && payload.canCreate && module !== "reminders" && (
            <button
              onClick={() => start()}
              className="bg-navy-900 text-white rounded-lg px-4 py-2 text-sm"
            >
              {module.includes("Documents") || module === "documents"
                ? "Upload file"
                : "Add record"}
            </button>
          )}
        </div>
      </div>
      {module === "reminders" && (
        <p className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          Reminders are queued when hearings are saved. External WhatsApp/SMS
          delivery requires provider configuration; queued records are not proof
          of delivery.
        </p>
      )}
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search saved records…"
        aria-label="Search records"
        className="w-full border rounded-lg p-3 bg-white"
      />
      <div className="bg-white border rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c} className="p-3 text-left whitespace-nowrap">
                  {label(c)}
                </th>
              ))}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-t">
                {columns.map((c) => (
                  <td key={c} className="p-3 max-w-xs truncate">
                    {display(c, row[c] ?? row.user?.[c])}
                  </td>
                ))}
                <td className="p-3 whitespace-nowrap space-x-3">
                  <button
                    className="text-blue-700"
                    onClick={() => setView(row)}
                  >
                    View
                  </button>
                  {(module === "documents" ||
                    module === "employeeDocuments") && (
                    <>
                      <button
                        className="text-blue-700"
                        onClick={() => show(row.id)}
                      >
                        Open file
                      </button>
                      {canWrite &&
                        module === "documents" &&
                        (!row.isPublic || payload.canPublish) && (
                          <button
                            className="text-blue-700"
                            onClick={() => start(row)}
                          >
                            New version
                          </button>
                        )}
                    </>
                  )}
                  {["billing", "payments"].includes(module) && (
                    <button
                      className="text-blue-700"
                      onClick={() => downloadInvoice(row)}
                    >
                      PDF
                    </button>
                  )}
                  {canWrite &&
                    ![
                      "billing",
                      "payments",
                      "documents",
                      "employeeDocuments",
                      "reminders",
                    ].includes(module) && (
                      <button
                        className="text-blue-700"
                        onClick={() => start(row)}
                      >
                        Edit
                      </button>
                    )}
                  {canWrite &&
                    module === "billing" &&
                    row.pendingAmount > 0 &&
                    row.status !== "CANCELLED" && (
                      <button
                        className="text-blue-700"
                        onClick={() =>
                          checkout(row.id, () => {
                            toast.success("Payment verified");
                            void load();
                          }).catch((e) => toast.error(e.message))
                        }
                      >
                        Online payment
                      </button>
                    )}
                  {canWrite &&
                    module === "tasks" &&
                    row.status !== "COMPLETED" && (
                      <button
                        className="text-green-700"
                        disabled={busy}
                        onClick={() => action(row, "completeTask")}
                      >
                        Complete
                      </button>
                    )}
                  {canWrite &&
                    module === "leads" &&
                    row.status !== "CONVERTED" && (
                      <button
                        className="text-green-700"
                        disabled={busy}
                        onClick={() => action(row, "convertLead")}
                      >
                        Convert
                      </button>
                    )}
                  {canWrite &&
                    module === "billing" &&
                    row.paidAmount === 0 &&
                    row.status !== "CANCELLED" && (
                      <button
                        className="text-red-700"
                        disabled={busy}
                        onClick={() => action(row, "cancelInvoice")}
                      >
                        Cancel
                      </button>
                    )}
                  {payload.canDelete &&
                    !["billing", "payments", "employees", "reminders"].includes(
                      module,
                    ) && (
                      <button
                        className="text-red-700"
                        onClick={() => remove(row)}
                      >
                        Delete
                      </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-8 text-center text-slate-500">
            No records found. {canWrite ? "Add a record to get started." : ""}
          </p>
        )}
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>
          Page {page} of {Math.max(1, payload.pages)}
        </span>
        <div className="flex gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="border rounded-lg px-3 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= payload.pages}
            onClick={() => setPage(page + 1)}
            className="border rounded-lg px-3 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
          <form
            onSubmit={save}
            className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto"
          >
            <div className="flex justify-between mb-5">
              <h2 className="text-xl font-semibold">
                {editing.id ? "Update" : "Add"} {title}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {module === "clients" && payload.canProvisionLogin && (
                <label className="text-sm">
                  Temporary portal password (optional, at least 8 characters)
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={form.portalPassword || ""}
                    onChange={(e) =>
                      setForm({ ...form, portalPassword: e.target.value })
                    }
                    className="block w-full border rounded-lg p-2 mt-1"
                  />
                  <span className="text-xs text-slate-500">
                    Provide an email and password to create client portal
                    access.
                  </span>
                </label>
              )}
              {module === "employees" &&
                ["name", "email", "phone", "role", "password"]
                  .filter(
                    (name) => name !== "password" || payload.canManageAccounts,
                  )
                  .map((name) => (
                    <label key={name} className="text-sm">
                      {label(name)}
                      {name === "role" ? (
                        <select
                          disabled={!payload.canManageAccounts}
                          className="block w-full border rounded-lg p-2 mt-1"
                          value={form.role || "ADVOCATE"}
                          onChange={(e) =>
                            setForm({ ...form, role: e.target.value })
                          }
                        >
                          {[
                            "ADVOCATE",
                            "SENIOR_ADVOCATE",
                            "JUNIOR_ADVOCATE",
                            "ASSOCIATE",
                            "LEGAL_ASSISTANT",
                            "CLERK",
                            "TYPIST",
                            "ACCOUNTANT",
                            "RECEPTIONIST",
                            "OFFICE_MANAGER",
                            "HR_ADMIN",
                            "IT_ADMIN",
                            "SUPER_ADMIN",
                          ].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          readOnly={
                            name === "email" && !payload.canManageAccounts
                          }
                          required={
                            ["name", "email"].includes(name) ||
                            (name === "password" && !editing.id)
                          }
                          type={
                            name === "password"
                              ? "password"
                              : name === "email"
                                ? "email"
                                : "text"
                          }
                          minLength={name === "password" ? 8 : undefined}
                          className="block w-full border rounded-lg p-2 mt-1"
                          value={form[name] || ""}
                          onChange={(e) =>
                            setForm({ ...form, [name]: e.target.value })
                          }
                        />
                      )}
                    </label>
                  ))}
              {fields.map((f) => {
                const opts = choices(f.name);
                const value = form[f.name];
                return (
                  <label key={f.name} className="text-sm text-slate-700">
                    {label(f.name)}
                    {f.required ? " *" : ""}
                    {f.type === "Boolean" ? (
                      <input
                        type="checkbox"
                        disabled={f.name === "isPublic" && !payload.canPublish}
                        className="ml-3"
                        checked={!!value}
                        onChange={(e) =>
                          setForm({ ...form, [f.name]: e.target.checked })
                        }
                      />
                    ) : opts || f.options ? (
                      <select
                        required={f.required}
                        disabled={
                          module === "cases" &&
                          [
                            "seniorAdvocateId",
                            "juniorAdvocateId",
                            "clerkId",
                          ].includes(f.name) &&
                          !payload.canManageTeam
                        }
                        className="block w-full border rounded-lg p-2 mt-1"
                        value={value || ""}
                        onChange={(e) =>
                          setForm({ ...form, [f.name]: e.target.value })
                        }
                      >
                        <option value="">Select…</option>
                        {(
                          opts || f.options!.map((o) => ({ id: o, name: o }))
                        ).map((o: Row) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={f.required}
                        type={
                          f.type === "DateTime"
                            ? "datetime-local"
                            : ["Int", "Float"].includes(f.type)
                              ? "number"
                              : f.name === "email"
                                ? "email"
                                : "text"
                        }
                        step={f.type === "Float" ? "0.01" : undefined}
                        min={["Int", "Float"].includes(f.type) ? 0 : undefined}
                        className="block w-full border rounded-lg p-2 mt-1"
                        value={
                          f.type === "DateTime" && value
                            ? new Date(
                                new Date(value).getTime() -
                                  new Date(value).getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : (value ?? "")
                        }
                        onChange={(e) =>
                          setForm({ ...form, [f.name]: e.target.value })
                        }
                      />
                    )}
                  </label>
                );
              })}
              {(module === "documents" || module === "employeeDocuments") && (
                <label className="md:col-span-2">
                  File (up to 20 MB)
                  <input
                    type="file"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block mt-2"
                  />
                </label>
              )}
            </div>
            {module === "billing" && (
              <div className="space-y-3 mt-5">
                <h3 className="font-semibold">Invoice items</h3>
                <label className="block text-sm">
                  GST rate (optional, %)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.gstRate || 0}
                    onChange={(e) =>
                      setForm({ ...form, gstRate: Number(e.target.value) })
                    }
                    className="ml-3 border rounded p-2"
                  />
                </label>
                {invoiceItems.map((it, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2"
                  >
                    <input
                      aria-label="Description"
                      required
                      value={it.description}
                      onChange={(e) =>
                        setInvoiceItems(
                          invoiceItems.map((v, j) =>
                            j === i ? { ...v, description: e.target.value } : v,
                          ),
                        )
                      }
                      className="border p-2 rounded"
                    />
                    <select
                      aria-label="Fee type"
                      value={it.feeType}
                      onChange={(e) =>
                        setInvoiceItems(
                          invoiceItems.map((v, j) =>
                            j === i ? { ...v, feeType: e.target.value } : v,
                          ),
                        )
                      }
                      className="border p-2 rounded"
                    >
                      {[
                        "CONSULTATION",
                        "CASE_FEE",
                        "APPEARANCE",
                        "DRAFTING",
                        "FILING",
                        "DOCUMENTATION",
                        "COURT_EXPENSES",
                        "TRAVEL",
                        "MISCELLANEOUS",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    <input
                      aria-label="Quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={it.quantity}
                      onChange={(e) =>
                        setInvoiceItems(
                          invoiceItems.map((v, j) =>
                            j === i
                              ? { ...v, quantity: Number(e.target.value) }
                              : v,
                          ),
                        )
                      }
                      className="border p-2 rounded"
                    />
                    <input
                      aria-label="Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.rate}
                      onChange={(e) =>
                        setInvoiceItems(
                          invoiceItems.map((v, j) =>
                            j === i
                              ? { ...v, rate: Number(e.target.value) }
                              : v,
                          ),
                        )
                      }
                      className="border p-2 rounded"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-blue-700"
                  onClick={() =>
                    setInvoiceItems([
                      ...invoiceItems,
                      {
                        description: "",
                        feeType: "CASE_FEE",
                        quantity: 1,
                        rate: 0,
                      },
                    ])
                  }
                >
                  Add item
                </button>
                <p>
                  Total: ₹
                  {invoiceItems
                    .reduce((s, i) => s + i.rate * i.quantity, 0)
                    .toLocaleString("en-IN")}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border rounded-lg px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="bg-navy-900 text-white rounded-lg px-5 py-2"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
      {view && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Record details</h2>
              <button onClick={() => setView(null)} aria-label="Close">
                ✕
              </button>
            </div>
            {module === "documents" && view.versions?.length > 0 && (
              <section className="mb-4">
                <h3 className="font-semibold">Version history</h3>
                {view.versions.map((v: any) => (
                  <button
                    key={v.version}
                    onClick={() => show(view.id, v.version)}
                    className="text-blue-700 mr-4 text-sm"
                  >
                    Download version {v.version}
                  </button>
                ))}
              </section>
            )}
            <dl className="grid md:grid-cols-2 gap-3">
              {Object.entries(view.user ? { ...view, ...view.user } : view)
                .filter(
                  ([k]) =>
                    !["user", "password", "fileUrl", "token"].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg p-3">
                    <dt className="text-xs text-slate-500">{label(k)}</dt>
                    <dd className="text-sm mt-1 break-words whitespace-pre-wrap">
                      {display(k, v)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
