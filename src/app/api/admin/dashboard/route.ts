import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, caseScope, scope, ApiError } from "@/lib/admin";
import { hasPermission } from "@/lib/auth";
export async function GET(req: NextRequest) {
  try {
    const user = await authorize(req, "dashboard:read");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const can = (s: string) => hasPermission(user.role, `${s}:read`);
    const [clients, cases, hearings, tasks, invoices, employees, holidays] =
      await Promise.all([
        can("clients")
          ? prisma.client.count({ where: scope("clients", user) })
          : null,
        can("cases")
          ? prisma.case.findMany({
              where: caseScope(user),
              select: {
                id: true,
                caseType: true,
                court: true,
                stage: true,
                status: true,
                seniorAdvocateId: true,
              },
            })
          : [],
        can("calendar")
          ? prisma.hearing.findMany({
              where: {
                AND: [
                  scope("calendar", user),
                  { hearingDate: { gte: today }, status: "SCHEDULED" },
                ],
              },
              include: {
                case: {
                  select: { title: true, client: { select: { name: true } } },
                },
              },
              orderBy: { hearingDate: "asc" },
            })
          : [],
        can("tasks")
          ? prisma.task.findMany({
              where: {
                AND: [scope("tasks", user), { status: { not: "COMPLETED" } }],
              },
            })
          : [],
        can("billing")
          ? prisma.invoice.findMany({
              where: { status: { not: "CANCELLED" } },
              include: { client: { select: { name: true } } },
            })
          : [],
        can("employees")
          ? prisma.employee.count({ where: { isActive: true } })
          : null,
        can("calendar")
          ? prisma.courtHoliday.findMany({
              where: { date: { gte: today } },
              orderBy: { date: "asc" },
              take: 5,
            })
          : [],
      ]);
    const group = (key: string) =>
      Object.entries(
        cases.reduce((acc: any, c: any) => {
          const k = c[key] || "Unassigned";
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value }));
    const payments = can("billing")
      ? await prisma.payment.findMany({ orderBy: { paymentDate: "asc" } })
      : [];
    const revenue = Object.entries(
      payments.reduce((a: any, p) => {
        const m = p.paymentDate.toISOString().slice(0, 7);
        a[m] = (a[m] || 0) + p.amount;
        return a;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    const assigned = await prisma.employee.findMany({
      where: {
        id: {
          in: cases
            .map((c) => c.seniorAdvocateId)
            .filter((id): id is string => !!id),
        },
      },
      select: { id: true, user: { select: { name: true } } },
    });
    const workload = assigned.map((employee) => ({
      name: employee.user.name,
      value: cases.filter((c) => c.seniorAdvocateId === employee.id).length,
    }));
    const balances = Object.entries(
      invoices.reduce((a: Record<string, number>, invoice) => {
        if (invoice.pendingAmount > 0)
          a[invoice.client.name] =
            (a[invoice.client.name] || 0) + invoice.pendingAmount;
        return a;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    const hearingDays = Object.entries(
      hearings.reduce((a: Record<string, number>, hearing) => {
        const day = hearing.hearingDate.toLocaleDateString("en-IN");
        a[day] = (a[day] || 0) + 1;
        return a;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    return NextResponse.json({
      stats: {
        clients,
        activeCases: can("cases")
          ? cases.filter((c) => c.status === "ACTIVE").length
          : null,
        criminal: can("cases")
          ? cases.filter((c) => c.caseType === "CRIMINAL").length
          : null,
        civil: can("cases")
          ? cases.filter((c) => c.caseType === "CIVIL").length
          : null,
        todayHearings: can("calendar")
          ? hearings.filter((h) => h.hearingDate < tomorrow).length
          : null,
        upcomingHearings: can("calendar") ? hearings.length : null,
        pendingTasks: can("tasks") ? tasks.length : null,
        pendingFees: can("billing")
          ? invoices.reduce((s, i) => s + i.pendingAmount, 0)
          : null,
        employees,
      },
      hearings: hearings.slice(0, 12),
      tasks: tasks.slice(0, 10),
      holidays,
      charts: {
        court: group("court"),
        practice: group("caseType"),
        status: group("status"),
        revenue,
        workload,
        balances,
        hearingDays,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 500 },
    );
  }
}
