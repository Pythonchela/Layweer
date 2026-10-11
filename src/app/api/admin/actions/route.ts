import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, ApiError, scope } from "@/lib/admin";
import { randomUUID } from "crypto";
export async function POST(req: NextRequest) {
  try {
    const { action, id } = await readJson(req);
    const permission =
      action === "convertLead"
        ? "leads:write"
        : action === "completeTask"
          ? "tasks:write"
          : action === "cancelInvoice"
            ? "billing:write"
            : "";
    if (!permission) throw new ApiError("Unknown action");
    const user = await authorize(req, permission);
    const record = await prisma.$transaction(async (tx) => {
      let result;
      if (action === "convertLead") {
        const lead = await tx.lead.findUnique({ where: { id } });
        if (!lead) throw new ApiError("Lead not found", 404);
        if (lead.clientId) return lead;
        const client = await tx.client.create({
          data: {
            clientId: `CLT-${randomUUID().slice(0, 8)}`,
            name: lead.name,
            mobile: lead.mobile,
            email: lead.email,
            referenceSource: lead.source,
            notes: lead.description,
          },
        });
        result = await tx.lead.update({
          where: { id },
          data: {
            status: "CONVERTED",
            clientId: client.id,
            conversionDate: new Date(),
          },
        });
      } else if (action === "completeTask") {
        const task = await tx.task.findFirst({
          where: { AND: [{ id }, scope("tasks", user)] },
        });
        if (!task) throw new ApiError("Task not found", 404);
        result = await tx.task.update({
          where: { id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      } else {
        const invoice = await tx.invoice.findUnique({ where: { id } });
        if (!invoice) throw new ApiError("Invoice not found", 404);
        if (invoice.paidAmount > 0)
          throw new ApiError("An invoice with payments cannot be cancelled");
        result = await tx.invoice.update({
          where: { id },
          data: { status: "CANCELLED", pendingAmount: 0 },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action,
          entity:
            action === "convertLead"
              ? "Lead"
              : action === "completeTask"
                ? "Task"
                : "Invoice",
          entityId: id,
        },
      });
      return result;
    });
    return NextResponse.json({ record });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 400 },
    );
  }
}
