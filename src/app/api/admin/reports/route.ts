import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  authorize,
  modules,
  ModuleName,
  listRecords,
} from "@/lib/admin";
import { hasPermission } from "@/lib/auth";
const aliases: Record<string, ModuleName> = {
  client: "clients",
  case: "cases",
  criminal: "criminal",
  civil: "civil",
  hearing: "calendar",
  employee: "employees",
  fee: "payments",
  outstanding: "billing",
  expense: "expenses",
  revenue: "payments",
  court: "cases",
  stage: "cases",
  document: "documents",
  task: "tasks",
  advocate: "cases",
};
export async function GET(req: NextRequest) {
  try {
    const user = await authorize(req, "reports:read"),
      type = req.nextUrl.searchParams.get("type") || "case",
      module = aliases[type];
    if (!module) throw new ApiError("Unknown report");
    if (!hasPermission(user.role, `${modules[module].permission}:read`))
      throw new ApiError("This report is not available to your role", 403);
    let rows = await listRecords(module, user);
    const from = req.nextUrl.searchParams.get("from"),
      to = req.nextUrl.searchParams.get("to");
    const dateField =
      module === "payments"
        ? "paymentDate"
        : module === "calendar"
          ? "hearingDate"
          : module === "expenses"
            ? "date"
            : "createdAt";
    if (from || to) {
      const start = from ? new Date(from).getTime() : 0,
        end = to ? new Date(to).getTime() + 86400000 : Infinity;
      if (!Number.isFinite(start) || (to && !Number.isFinite(end)))
        throw new ApiError("Invalid date range");
      rows = rows.filter((r: any) => {
        const d = new Date(r[dateField]).getTime();
        return d >= start && d < end;
      });
    }
    if (type === "outstanding")
      rows = rows.filter(
        (r: any) => r.pendingAmount > 0 && r.status !== "CANCELLED",
      );
    if (type === "court" || type === "stage" || type === "advocate") {
      const key =
        type === "court"
          ? "court"
          : type === "stage"
            ? "stage"
            : "seniorAdvocateId";
      let names: Record<string, string> = {};
      if (type === "advocate") {
        const employees = await prisma.employee.findMany({
          select: { id: true, user: { select: { name: true } } },
        });
        names = Object.fromEntries(employees.map((e) => [e.id, e.user.name]));
      }
      const counts = rows.reduce((a: any, r: any) => {
        const name = names[r[key]] || r[key] || "Unassigned";
        a[name] = (a[name] || 0) + 1;
        return a;
      }, {});
      rows = Object.entries(counts).map(([name, cases]) => ({ name, cases }));
    }
    if (type === "revenue") {
      const totals = rows.reduce((a: any, r: any) => {
        const month = new Date(r.paymentDate).toISOString().slice(0, 7);
        a[month] = (a[month] || 0) + r.amount;
        return a;
      }, {});
      rows = Object.entries(totals).map(([month, collected]) => ({
        month,
        collected,
      }));
    }
    const hidden = ["fileUrl", "url", "password", "token", "twoFASecret"];
    rows = rows.map((r: any) =>
      Object.fromEntries(
        Object.entries(r)
          .filter(([k]) => !hidden.includes(k))
          .map(([k, v]) => [
            k,
            v instanceof Date
              ? v.toISOString()
              : typeof v === "object" && v
                ? JSON.stringify(v)
                : v,
          ]),
      ),
    );
    if (req.nextUrl.searchParams.get("format") === "excel") {
      const ExcelJS = await import("exceljs");
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet(type);
      const keys = Object.keys(rows[0] || { result: "No records" });
      sheet.columns = keys.map((k) => ({ header: k, key: k, width: 24 }));
      sheet.addRows(rows);
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      const bytes = await book.xlsx.writeBuffer();
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${type}-report.xlsx"`,
        },
      });
    }
    return NextResponse.json({ rows, type });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 500 },
    );
  }
}
