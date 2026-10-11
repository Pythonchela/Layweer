import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { audit, hashPassword, hasPermission } from "@/lib/auth";
import { queueClientMessage } from "@/lib/notifications";
import {
  ApiError,
  authorize,
  modules,
  ModuleName,
  fields,
  cleanData,
  delegate,
  scope,
  checkRelations,
  lookup,
  listRecords,
  recordFilter,
} from "@/lib/admin";
export const runtime = "nodejs";
type Context = { params: Promise<{ module: string }> };
async function config(ctx: Context) {
  const { module } = await ctx.params;
  if (!Object.hasOwn(modules, module))
    throw new ApiError("Module not found", 404);
  return module as ModuleName;
}
function failure(e: unknown) {
  if (e instanceof ApiError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  const code = (e as { code?: string }).code;
  return NextResponse.json(
    {
      error:
        code === "P2002"
          ? "This record already exists"
          : code === "P2003"
            ? "This record is linked to other records. Remove the links first."
            : "Unable to save. Check required fields and linked records.",
    },
    { status: 400 },
  );
}
export async function GET(req: NextRequest, ctx: Context) {
  try {
    const module = await config(ctx);
    const user = await authorize(req, `${modules[module].permission}:read`);
    if (
      ["payroll", "employeeDocuments"].includes(module) &&
      !hasPermission(user.role, "employees:sensitive")
    )
      throw new ApiError(
        "Confidential employee records are restricted to HR and account administrators",
        403,
      );
    const page = Number(req.nextUrl.searchParams.get("page") || 1),
      take = Number(req.nextUrl.searchParams.get("limit") || 50),
      search = req.nextUrl.searchParams.get("search") || "";
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(take) ||
      take < 1 ||
      take > 100
    )
      throw new ApiError("Invalid page or limit");
    const total = await delegate(modules[module].model).count({
      where: recordFilter(module, user, search),
    });
    return NextResponse.json({
      records: await listRecords(module, user, {
        skip: (page - 1) * take,
        take,
        search,
      }),
      total,
      page,
      pages: Math.ceil(total / take),
      fields: fields(module),
      canDelete: user.role === "SUPER_ADMIN",
      canCreate: module !== "employees" || user.role === "SUPER_ADMIN",
      canManageAccounts: user.role === "SUPER_ADMIN",
      canManageTeam: ["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role),
      canPublish: ["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role),
      ownEmployeeId: user.employee?.id,
      canProvisionLogin: ["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role),
      lookups: await lookup(user),
      canWrite: (await import("@/lib/auth")).hasPermission(
        user.role,
        `${modules[module].permission}:write`,
      ),
      title: modules[module].title,
    });
  } catch (e) {
    return failure(e);
  }
}
async function save(req: NextRequest, ctx: Context, update: boolean) {
  try {
    const module = await config(ctx);
    const user = await authorize(req, `${modules[module].permission}:write`);
    const body = await readJson(req);
    const data = cleanData(module, body);
    if (module === "reminders")
      throw new ApiError("Reminders are managed through hearings");
    if (update && !body.id) throw new ApiError("Record ID is required");
    if (["payments", "billing"].includes(module) && update)
      throw new ApiError(
        "Issued invoices and recorded payments are immutable. Cancel an invoice or record a separate payment.",
      );
    const record = await prisma.$transaction(async (tx) => {
      const model = delegate(modules[module].model, tx);
      const previous = update
        ? await model.findFirst({
            where: { AND: [{ id: body.id }, scope(module, user)] },
          })
        : null;
      if (update && !previous) throw new ApiError("Record not found", 404);
      if (
        module === "cases" &&
        !["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role)
      ) {
        const teamFields = ["seniorAdvocateId", "juniorAdvocateId", "clerkId"];
        if (
          update &&
          teamFields.some(
            (field) => field in data && data[field] !== previous[field],
          )
        )
          throw new ApiError(
            "Only a supervising advocate or super administrator can change case-team access",
            403,
          );
        if (
          !update &&
          (data.seniorAdvocateId !== user.employee?.id ||
            data.juniorAdvocateId ||
            data.clerkId)
        )
          throw new ApiError(
            "New cases must be assigned to you; a supervisor can add other team members",
            403,
          );
      }
      await checkRelations(module, data, user, tx);
      if (module === "clients" && !update)
        data.clientId = `CLT-${randomUUID().slice(0, 8)}`;
      if (module === "cases" && !update)
        data.caseId = `CASE-${randomUUID().slice(0, 8)}`;
      if (module === "history") data.addedBy = user.id;
      if (module === "communications") data.sentBy = user.id;
      if (module === "expenses") data.recordedBy = user.id;
      if (module === "tasks") {
        if (!update) data.creatorId = user.id;
        if (data.status === "COMPLETED") data.completedAt = new Date();
        else if (data.status !== undefined) data.completedAt = null;
      }
      if (
        module === "leave" &&
        data.fromDate &&
        data.toDate &&
        data.fromDate > data.toDate
      )
        throw new ApiError("Leave end date must follow start date");
      if (module === "payroll") {
        const existing = update
          ? await model.findUnique({ where: { id: body.id } })
          : {};
        const salary = { ...existing, ...data };
        data.netSalary =
          Math.round(
            ((salary.basicSalary || 0) +
              (salary.allowances || 0) +
              (salary.incentives || 0) -
              (salary.deductions || 0)) *
              100,
          ) / 100;
        if (data.netSalary < 0)
          throw new ApiError("Deductions cannot exceed salary");
        if (salary.month < 1 || salary.month > 12 || salary.year < 2000)
          throw new ApiError("Enter a valid payroll month and year");
      }
      if (module === "documents" || module === "employeeDocuments")
        throw new ApiError("Use the secure file upload action");
      if (module === "employees") {
        if (!update && user.role !== "SUPER_ADMIN")
          throw new ApiError(
            "Only the super administrator can provision login accounts",
            403,
          );
        if (!body.name || !body.email)
          throw new ApiError("Name and email are required");
        const role = String(body.role || "ADVOCATE");
        if (
          !Object.hasOwn((await import("@/lib/auth")).ROLE_PERMISSIONS, role) ||
          role === "CLIENT"
        )
          throw new ApiError("Invalid employee role");
        if (
          user.role !== "SUPER_ADMIN" &&
          ["SUPER_ADMIN", "IT_ADMIN", "SENIOR_ADVOCATE"].includes(role)
        )
          throw new ApiError(
            "Only the super administrator can assign this role",
            403,
          );
        const userData: any = {
          name: String(body.name),
          email: String(body.email).trim().toLowerCase(),
          phone: body.phone || null,
          role,
          isActive: data.isActive ?? true,
        };
        if (body.password) {
          if (String(body.password).length < 10)
            throw new ApiError("Password must contain at least 10 characters");
          userData.password = await hashPassword(String(body.password));
        }
        if (update) {
          const existing = await model.findUnique({
            where: { id: body.id },
            include: { user: true },
          });
          userData.isActive = data.isActive ?? existing.user.isActive;
          if (
            user.role !== "SUPER_ADMIN" &&
            (role !== existing.user.role ||
              body.password ||
              userData.email !== existing.user.email)
          )
            throw new ApiError(
              "Only the super administrator can change roles, login emails or passwords",
              403,
            );
          if (
            existing.user.role === "SUPER_ADMIN" &&
            (role !== "SUPER_ADMIN" || !userData.isActive) &&
            (await tx.user.count({
              where: {
                role: "SUPER_ADMIN",
                isActive: true,
                id: { not: existing.userId },
              },
            })) === 0
          )
            throw new ApiError(
              "The last active super administrator cannot be disabled or demoted",
              400,
            );
          if (
            user.role !== "SUPER_ADMIN" &&
            ["SUPER_ADMIN", "IT_ADMIN", "SENIOR_ADVOCATE"].includes(
              existing.user.role,
            )
          )
            throw new ApiError(
              "Only the super administrator can modify this account",
              403,
            );
          await tx.user.update({
            where: { id: existing.userId },
            data: userData,
          });
          if (
            userData.password ||
            existing.user.role !== role ||
            existing.user.email !== userData.email ||
            !userData.isActive
          )
            await tx.session.deleteMany({ where: { userId: existing.userId } });
        } else {
          if (!userData.password)
            throw new ApiError("An initial login password is required");
          const account = await tx.user.create({ data: userData });
          data.userId = account.id;
          data.employeeId = `EMP-${randomUUID().slice(0, 8)}`;
        }
        if (userData.password) {
          const linked = await tx.user.findUnique({
            where: { id: update ? previous.userId : data.userId },
          });
          if (linked)
            await tx.user.update({
              where: { id: linked.id },
              data: { mustChangePassword: true },
            });
        }
      }
      if (module === "billing") {
        if (!Array.isArray(body.items) || !body.items.length)
          throw new ApiError("Add at least one invoice item");
        const items = body.items.map((i: any) => {
          const quantity = Number(i.quantity || 1),
            rate = Number(i.rate);
          if (
            !Number.isFinite(rate) ||
            rate < 0 ||
            !Number.isFinite(quantity) ||
            quantity <= 0
          )
            throw new ApiError("Invalid invoice item amount");
          return {
            feeType: String(i.feeType || "CASE_FEE"),
            description: String(i.description || "Legal services"),
            quantity,
            rate,
            amount: Math.round(rate * quantity * 100) / 100,
          };
        });
        const subtotal =
            Math.round(
              items.reduce((s: number, i: any) => s + i.amount, 0) * 100,
            ) / 100,
          gstRate = Number(body.gstRate || 0);
        if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100)
          throw new ApiError("Invalid GST rate");
        data.gstAmount = Math.round(subtotal * gstRate) / 100;
        data.totalAmount = Math.round((subtotal + data.gstAmount) * 100) / 100;
        data.pendingAmount = data.totalAmount;
        data.invoiceNumber = `INV-${new Date().getFullYear()}-${randomUUID().slice(0, 8)}`;
        data.createdBy = user.id;
        data.items = { create: items };
      }
      if (module === "payments") {
        if (!data.invoiceId) throw new ApiError("Select an invoice");
        const invoice = await tx.invoice.findUnique({
          where: { id: data.invoiceId },
        });
        if (!invoice || invoice.clientId !== data.clientId)
          throw new ApiError("Invoice does not belong to this client");
        if (
          data.amount <= 0 ||
          data.amount > invoice.pendingAmount ||
          invoice.status === "CANCELLED"
        )
          throw new ApiError(
            "Payment must be positive and no greater than the invoice balance",
          );
        data.paymentId = `PAY-${randomUUID()}`;
        data.receiptNumber = `REC-${randomUUID().slice(0, 8)}`;
        data.recordedBy = user.id;
        const paidAmount =
            Math.round((invoice.paidAmount + data.amount) * 100) / 100,
          pendingAmount =
            Math.round((invoice.totalAmount - paidAmount) * 100) / 100;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount,
            pendingAmount,
            status: pendingAmount === 0 ? "PAID" : "PARTIAL",
          },
        });
      }
      if (
        module === "appointments" &&
        data.advocateId &&
        data.appointmentDate &&
        data.slot
      ) {
        const conflict = await tx.appointment.findFirst({
          where: {
            advocateId: data.advocateId,
            appointmentDate: data.appointmentDate,
            slot: data.slot,
            status: { not: "CANCELLED" },
            ...(update ? { id: { not: body.id } } : {}),
          },
        });
        if (conflict)
          throw new ApiError("This advocate is already booked for that slot");
      }
      const saved = update
        ? await model.update({ where: { id: body.id }, data })
        : await model.create({ data });
      if (module === "clients" && body.portalPassword) {
        if (!["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role))
          throw new ApiError(
            "Only a senior advocate or super administrator can provision client logins",
            403,
          );
        if (!saved.email)
          throw new ApiError(
            "Enter the client's email before provisioning login",
          );
        if (String(body.portalPassword).length < 8)
          throw new ApiError(
            "Portal password must contain at least 8 characters",
          );
        const accountData = {
          name: saved.name,
          email: saved.email.trim().toLowerCase(),
          password: await hashPassword(String(body.portalPassword)),
          role: "CLIENT",
          isActive: saved.isActive,
          mustChangePassword: true,
        };
        const account = saved.userId
          ? await tx.user.update({
              where: { id: saved.userId },
              data: accountData,
            })
          : await tx.user.create({ data: accountData });
        await tx.client.update({
          where: { id: saved.id },
          data: { userId: account.id },
        });
        await tx.session.deleteMany({ where: { userId: account.id } });
      }
      if (module === "calendar") {
        if (previous && previous.caseId !== saved.caseId) {
          const formerNext = await tx.hearing.findFirst({
            where: {
              caseId: previous.caseId,
              status: "SCHEDULED",
              hearingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
            orderBy: { hearingDate: "asc" },
          });
          await tx.case.update({
            where: { id: previous.caseId },
            data: { nextHearingDate: formerNext?.hearingDate || null },
          });
        }
        await tx.reminder.deleteMany({
          where: { hearingId: saved.id, isSent: false },
        });
        if (saved.status === "SCHEDULED") {
          const caseRecord = await tx.case.findUnique({
            where: { id: saved.caseId },
            include: { client: true },
          });
          await tx.reminder.createMany({
            data: [7, 3, 1, 0].map((days) => ({
              hearingId: saved.id,
              caseId: saved.caseId,
              type: "WHATSAPP",
              message: `${caseRecord?.title}: hearing on ${saved.hearingDate.toISOString().slice(0, 10)} at ${saved.court || caseRecord?.court}. Client contact: ${caseRecord?.client.mobile}`,
              sendAt: new Date(saved.hearingDate.getTime() - days * 86400000),
              recipientId: caseRecord?.client.userId || caseRecord?.clientId,
            })),
          });
        }
        const next = await tx.hearing.findFirst({
          where: {
            caseId: saved.caseId,
            status: "SCHEDULED",
            hearingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          orderBy: { hearingDate: "asc" },
        });
        await tx.case.update({
          where: { id: saved.caseId },
          data: {
            nextHearingDate: next?.hearingDate || saved.nextDate || null,
          },
        });
        await tx.caseHistory.create({
          data: {
            caseId: saved.caseId,
            event: saved.status,
            description: saved.outcome || saved.purpose || "Hearing scheduled",
            date: saved.hearingDate,
            addedBy: user.id,
          },
        });
        const linked = await tx.case.findUnique({
          where: { id: saved.caseId },
          select: { client: { select: { userId: true } } },
        });
        if (linked?.client.userId)
          await tx.notification.create({
            data: {
              userId: linked.client.userId,
              title: "Hearing update",
              message: `Hearing ${saved.status.toLowerCase()} for ${saved.hearingDate.toISOString().slice(0, 10)}. ${saved.purpose || ""}`,
              link: "/portal",
            },
          });
      }
      if (module === "cases" && update && data.status) {
        const client = await tx.client.findUnique({
          where: { id: saved.clientId },
        });
        if (client?.userId)
          await tx.notification.create({
            data: {
              userId: client.userId,
              title: "Case status updated",
              message: `${saved.title}: ${saved.status}`,
              link: "/portal",
            },
          });
        await queueClientMessage(
          tx,
          client,
          `${saved.title}: ${saved.status}`,
          saved.id,
        );
      }
      if (module === "billing") {
        const client = await tx.client.findUnique({
          where: { id: saved.clientId },
        });
        if (client?.userId)
          await tx.notification.create({
            data: {
              userId: client.userId,
              title: "New invoice",
              message: `${saved.invoiceNumber}: INR ${saved.totalAmount}`,
              link: "/portal",
            },
          });
        await queueClientMessage(
          tx,
          client,
          `Invoice ${saved.invoiceNumber}: INR ${saved.totalAmount}. Due ${saved.dueDate?.toISOString().slice(0, 10) || "on receipt"}.`,
          saved.caseId,
        );
      }
      if (
        module === "appointments" &&
        saved.clientId &&
        data.status === "CONFIRMED"
      ) {
        const client = await tx.client.findUnique({
          where: { id: saved.clientId },
        });
        await queueClientMessage(
          tx,
          client,
          `Appointment confirmed for ${saved.appointmentDate.toISOString().slice(0, 10)} at ${saved.slot || "the office"}.`,
        );
      }
      if (module === "tasks" && saved.assigneeId)
        await tx.notification.create({
          data: {
            userId: saved.assigneeId,
            title: "Task updated",
            message: saved.title,
            link: "/admin/tasks",
          },
        });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: update ? "UPDATE" : "CREATE",
          entity: modules[module].model,
          entityId: saved.id,
        },
      });
      return saved;
    });
    return NextResponse.json({ record }, { status: update ? 200 : 201 });
  } catch (e) {
    return failure(e);
  }
}
export const POST = (req: NextRequest, ctx: Context) => save(req, ctx, false);
export const PATCH = (req: NextRequest, ctx: Context) => save(req, ctx, true);
export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    const module = await config(ctx),
      user = await authorize(req, `${modules[module].permission}:write`);
    if (user.role !== "SUPER_ADMIN")
      throw new ApiError(
        "Only the super administrator can delete records",
        403,
      );
    if (["payments", "billing", "employees"].includes(module))
      throw new ApiError(
        "Financial records cannot be deleted. Deactivate employees instead.",
      );
    const { id } = await readJson(req);
    const record = await delegate(modules[module].model).findFirst({
      where: { AND: [{ id }, scope(module, user)] },
    });
    if (!record) throw new ApiError("Record not found", 404);
    await prisma.$transaction(async (tx) => {
      if (module === "calendar")
        await tx.reminder.deleteMany({ where: { hearingId: id } });
      if (module === "documents")
        await tx.documentVersion.deleteMany({ where: { documentId: id } });
      await delegate(modules[module].model, tx).delete({ where: { id } });
      if (module === "calendar") {
        const next = await tx.hearing.findFirst({
          where: {
            caseId: record.caseId,
            status: "SCHEDULED",
            hearingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          orderBy: { hearingDate: "asc" },
        });
        await tx.case.update({
          where: { id: record.caseId },
          data: { nextHearingDate: next?.hearingDate || null },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "DELETE",
          entity: modules[module].model,
          entityId: id,
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
