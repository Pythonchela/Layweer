import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { currentUser, hasPermission } from "./auth";
import { NextRequest } from "next/server";
import { validOrigin } from "./security";

export const modules = {
  clients: { model: "Client", permission: "clients", title: "Clients" },
  cases: { model: "Case", permission: "cases", title: "Cases" },
  criminal: {
    model: "CriminalCase",
    permission: "cases",
    title: "Criminal case details",
  },
  civil: {
    model: "CivilCase",
    permission: "cases",
    title: "Civil case details",
  },
  history: { model: "CaseHistory", permission: "cases", title: "Case history" },
  employees: {
    model: "Employee",
    permission: "employees",
    title: "Employees & advocates",
  },
  attendance: {
    model: "Attendance",
    permission: "employees",
    title: "Attendance",
  },
  leave: { model: "Leave", permission: "employees", title: "Leave requests" },
  payroll: {
    model: "SalarySlip",
    permission: "employees",
    title: "Salary slips",
  },
  employeeDocuments: {
    model: "EmployeeDocument",
    permission: "employees",
    title: "Employee documents",
  },
  calendar: { model: "Hearing", permission: "calendar", title: "Hearings" },
  holidays: {
    model: "CourtHoliday",
    permission: "calendar",
    title: "Court holidays",
  },
  documents: {
    model: "Document",
    permission: "documents",
    title: "Document vault",
  },
  billing: { model: "Invoice", permission: "billing", title: "Invoices" },
  payments: {
    model: "Payment",
    permission: "billing",
    title: "Payments & receipts",
  },
  expenses: { model: "Expense", permission: "billing", title: "Expenses" },
  leads: { model: "Lead", permission: "leads", title: "Leads" },
  tasks: { model: "Task", permission: "tasks", title: "Tasks" },
  appointments: {
    model: "Appointment",
    permission: "appointments",
    title: "Appointments",
  },
  communications: {
    model: "Communication",
    permission: "clients",
    title: "Client communications",
  },
  reminders: {
    model: "Reminder",
    permission: "calendar",
    title: "Reminder outbox",
  },
  news: {
    model: "NewsUpdate",
    permission: "settings",
    title: "News & legal updates",
  },
  testimonials: {
    model: "Testimonial",
    permission: "settings",
    title: "Testimonials",
  },
} as const;
export type ModuleName = keyof typeof modules;
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export type Actor = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export const modelInfo = (name: string) =>
  Prisma.dmmf.datamodel.models.find((m) => m.name === name)!;
export const delegate = (name: string, db: any = prisma): any =>
  db[name[0].toLowerCase() + name.slice(1)];
export async function authorize(req: NextRequest, permission: string) {
  const user = await currentUser(req);
  if (!user) throw new ApiError("Please sign in", 401);
  if (!hasPermission(user.role, permission))
    throw new ApiError("You do not have permission to access this module", 403);
  if (user.mustChangePassword || user.mustEnable2FA)
    throw new ApiError(
      "Change your temporary password in My account before accessing firm records",
      403,
    );
  if (req.method !== "GET") {
    if (!validOrigin(req)) throw new ApiError("Invalid request origin", 403);
  }
  return user;
}
export function caseScope(user: Actor): any {
  if (
    [
      "SUPER_ADMIN",
      "SENIOR_ADVOCATE",
      "ACCOUNTANT",
      "RECEPTIONIST",
      "OFFICE_MANAGER",
      "HR_ADMIN",
      "IT_ADMIN",
    ].includes(user.role)
  )
    return {};
  if (user.role === "CLIENT")
    return { clientId: user.client?.id || "__none__" };
  const id = user.employee?.id || "__none__";
  return {
    OR: [{ seniorAdvocateId: id }, { juniorAdvocateId: id }, { clerkId: id }],
  };
}
export function scope(module: ModuleName, user: Actor): any {
  const restricted = ![
    "SUPER_ADMIN",
    "SENIOR_ADVOCATE",
    "ACCOUNTANT",
    "RECEPTIONIST",
    "OFFICE_MANAGER",
    "HR_ADMIN",
    "IT_ADMIN",
  ].includes(user.role);
  if (!restricted) return {};
  if (module === "cases") return caseScope(user);
  if (["criminal", "civil", "history", "calendar"].includes(module))
    return { case: caseScope(user) };
  if (module === "reminders") return { hearing: { case: caseScope(user) } };
  if (module === "clients")
    return user.role === "CLIENT"
      ? { id: user.client?.id || "__none__" }
      : { cases: { some: caseScope(user) } };
  if (module === "documents")
    return {
      OR: [
        { case: caseScope(user) },
        { caseId: null, client: { cases: { some: caseScope(user) } } },
      ],
    };
  if (module === "tasks") return { assigneeId: user.id };
  if (module === "appointments")
    return { advocateId: user.employee?.id || "__none__" };
  if (module === "holidays") return {};
  return { id: "__none__" };
}
const automatic = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "clientId_AUTO",
  "caseId_AUTO",
  "employeeId_AUTO",
  "paymentId",
  "invoiceNumber",
  "uploadedBy",
  "addedBy",
  "sentBy",
  "recordedBy",
  "createdBy",
  "creatorId",
  "totalAmount",
  "paidAmount",
  "pendingAmount",
  "gstAmount",
  "creditAmount",
  "deliveryStatus",
  "providerMessageId",
  "lastError",
  "isSent",
  "sentAt",
  "remindersSet",
  "completedAt",
  "fileUrl",
  "fileName",
  "fileSize",
  "mimeType",
  "version",
  "url",
  "conversionDate",
  "receiptNumber",
  "netSalary",
]);
export const options: Record<string, string[]> = {
  clientType: ["INDIVIDUAL", "CORPORATE", "NRI"],
  caseType: [
    "CRIMINAL",
    "CIVIL",
    "FAMILY",
    "PROPERTY",
    "CHEQUE_BOUNCE",
    "BAIL",
    "CORPORATE",
    "CONSUMER",
    "LABOUR",
    "BANKING",
    "CYBER_CRIME",
    "CONSTITUTIONAL",
    "OTHER",
  ],
  priority: ["LOW", "NORMAL", "HIGH", "URGENT"],
  role: [
    "SUPER_ADMIN",
    "SENIOR_ADVOCATE",
    "ADVOCATE",
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
    "CLIENT",
  ],
  paymentMethod: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"],
  category: [
    "FIR",
    "CHARGE_SHEET",
    "PLAINT",
    "WRITTEN_STATEMENT",
    "VAKALATNAMA",
    "AFFIDAVIT",
    "EVIDENCE",
    "COURT_ORDER",
    "JUDGMENT",
    "NOTICE",
    "AGREEMENT",
    "IDENTITY_DOCUMENT",
    "PROPERTY_DOCUMENT",
    "PHOTO",
    "OTHER",
  ],
  bailType: ["NONE", "REGULAR", "ANTICIPATORY"],
  bailStatus: ["NONE", "APPLIED", "GRANTED", "REJECTED"],
  custodyType: ["POLICE", "JUDICIAL", "RELEASED"],
  verdict: ["ACQUITTED", "CONVICTED"],
  stage: [
    "FILING",
    "COGNIZANCE",
    "FRAMING_CHARGES",
    "EVIDENCE",
    "ARGUMENTS",
    "JUDGMENT",
    "EXECUTION",
    "APPEAL",
    "REVISION",
  ],
  feeType: [
    "CONSULTATION",
    "CASE_FEE",
    "APPEARANCE",
    "DRAFTING",
    "FILING",
    "DOCUMENTATION",
    "COURT_EXPENSES",
    "TRAVEL",
    "MISCELLANEOUS",
  ],
};
const statuses: Record<string, string[]> = {
  Case: [
    "ACTIVE",
    "CLOSED",
    "DISPOSED",
    "STAYED",
    "TRANSFERRED",
    "WITHDRAWN",
    "APPEALED",
  ],
  Task: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
  Hearing: ["SCHEDULED", "COMPLETED", "ADJOURNED", "CANCELLED"],
  Lead: ["NEW", "CONTACTED", "CONSULTATION", "CONVERTED", "LOST"],
  Leave: ["PENDING", "APPROVED", "REJECTED"],
  Attendance: ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"],
  Appointment: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
};
export function fields(module: ModuleName) {
  const model = modules[module].model;
  const list = modelInfo(model).fields.filter(
    (f) =>
      f.kind !== "object" &&
      !automatic.has(f.name) &&
      !(model === "Client" && ["clientId", "userId"].includes(f.name)) &&
      !(model === "Case" && f.name === "caseId") &&
      !(model === "Employee" && ["employeeId", "userId"].includes(f.name)) &&
      !(model === "Invoice" && ["status", "issueDate"].includes(f.name)) &&
      !(model === "Payment" && f.name === "paymentDate") &&
      !(model === "Reminder"),
  );
  return list.map((f) => ({
    name: f.name,
    type: f.type,
    required: f.isRequired && !f.hasDefaultValue,
    defaultValue:
      f.hasDefaultValue &&
      ["string", "boolean", "number"].includes(typeof f.default)
        ? f.default
        : undefined,
    options:
      f.name === "status"
        ? statuses[model]
        : f.name === "type" && model === "Appointment"
          ? ["ONLINE", "OFFLINE", "PHONE"]
          : f.name === "category" && model !== "Document"
            ? undefined
            : options[f.name],
  }));
}
export function cleanData(
  module: ModuleName,
  body: Record<string, unknown>,
): any {
  const data: any = {};
  for (const field of fields(module)) {
    if (!(field.name in body)) continue;
    let value = body[field.name];
    if (value === "" || value === null) {
      if (field.required) throw new ApiError(`${field.name} is required`);
      data[field.name] = null;
      continue;
    }
    if (field.type === "DateTime") {
      const d = new Date(String(value));
      if (!Number.isFinite(d.getTime()))
        throw new ApiError(`Invalid ${field.name}`);
      value = d;
    } else if (field.type === "Int" || field.type === "Float") {
      value = Number(value);
      if (
        !Number.isFinite(value) ||
        (field.type === "Int" && !Number.isInteger(value)) ||
        Number(value) < 0
      )
        throw new ApiError(`Invalid ${field.name}`);
    } else if (field.type === "Boolean") {
      if (typeof value !== "boolean")
        throw new ApiError(`Invalid ${field.name}`);
    } else {
      if (typeof value !== "string" || value.length > 50000)
        throw new ApiError(`Invalid ${field.name}`);
      value = value.trim();
      if (field.required && !value)
        throw new ApiError(`${field.name} is required`);
      if (field.options && !field.options.includes(String(value)))
        throw new ApiError(`Invalid ${field.name}`);
    }
    data[field.name] = value;
  }
  return data;
}
export async function checkRelations(
  module: ModuleName,
  data: any,
  user: Actor,
  db: any = prisma,
) {
  const assignmentRoles: Record<string, string[]> = {
    seniorAdvocateId: ["SENIOR_ADVOCATE", "ADVOCATE"],
    juniorAdvocateId: ["JUNIOR_ADVOCATE", "ASSOCIATE", "LEGAL_ASSISTANT"],
    clerkId: ["CLERK", "TYPIST"],
    assignedAdvocate: [
      "SENIOR_ADVOCATE",
      "ADVOCATE",
      "JUNIOR_ADVOCATE",
      "ASSOCIATE",
    ],
    assignedClerk: ["CLERK", "TYPIST"],
    advocateId: ["SENIOR_ADVOCATE", "ADVOCATE", "JUNIOR_ADVOCATE", "ASSOCIATE"],
  };
  for (const [field, roles] of Object.entries(assignmentRoles)) {
    if (
      data[field] &&
      !(await db.employee.findFirst({
        where: {
          id: data[field],
          isActive: true,
          user: { isActive: true, role: { in: roles } },
        },
      }))
    )
      throw new ApiError(
        `Select an active employee with the appropriate role for ${field}`,
        400,
      );
  }
  for (const field of ["assignedAdvocate", "assignedClerk", "advocateId"])
    if (
      data[field] &&
      !(await db.employee.findFirst({
        where: { id: data[field], isActive: true },
      }))
    )
      throw new ApiError(`Invalid ${field}`);
  if (
    module === "leads" &&
    data.assignedTo &&
    !(await db.user.findFirst({
      where: { id: data.assignedTo, isActive: true, role: { not: "CLIENT" } },
    }))
  )
    throw new ApiError("Invalid assigned employee");
  const relations = modelInfo(modules[module].model).fields.filter(
    (f) => f.kind === "object" && f.relationFromFields?.length,
  );
  for (const relation of relations) {
    const field = relation.relationFromFields![0];
    if (!data[field]) continue;
    const filter: any = { id: data[field] };
    if (relation.type === "Case") Object.assign(filter, caseScope(user));
    if (relation.type === "Client" && Object.keys(caseScope(user)).length)
      Object.assign(filter, scope("clients", user));
    if (
      relation.type === "User" &&
      module === "tasks" &&
      !["SUPER_ADMIN", "SENIOR_ADVOCATE", "OFFICE_MANAGER"].includes(
        user.role,
      ) &&
      data[field] !== user.id
    )
      throw new ApiError("You can only manage tasks assigned to you", 403);
    if (!(await delegate(relation.type, db).findFirst({ where: filter })))
      throw new ApiError(`Invalid or inaccessible ${field}`, 403);
  }
  if (data.caseId && data.clientId) {
    const c = await db.case.findUnique({ where: { id: data.caseId } });
    if (c.clientId !== data.clientId)
      throw new ApiError("Case does not belong to the selected client");
  }
}
export async function lookup(user: Actor) {
  const cases =
    hasPermission(user.role, "cases:read") ||
    hasPermission(user.role, "billing:read") ||
    hasPermission(user.role, "documents:read")
      ? await prisma.case.findMany({
          where: caseScope(user),
          select: { id: true, title: true, caseId: true, clientId: true },
        })
      : [];
  const clients =
    hasPermission(user.role, "clients:read") ||
    hasPermission(user.role, "billing:read")
      ? await prisma.client.findMany({
          where: scope("clients", user),
          select: { id: true, name: true, clientId: true },
        })
      : [];
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      user: { select: { name: true, role: true } },
    },
  });
  const invoices = hasPermission(user.role, "billing:read")
    ? await prisma.invoice.findMany({
        where: { status: { not: "CANCELLED" } },
        select: {
          id: true,
          invoiceNumber: true,
          clientId: true,
          pendingAmount: true,
        },
      })
    : [];
  return {
    cases,
    clients,
    employees,
    users: employees.map((e) => ({ id: e.userId, name: e.user.name })),
    invoices: invoices.map((i) => ({
      ...i,
      name: `${i.invoiceNumber} · balance ₹${i.pendingAmount}`,
    })),
  };
}
export async function listRecords(
  module: ModuleName,
  user: Actor,
  paging?: { skip: number; take: number; search: string },
) {
  const finance = hasPermission(user.role, "billing:read");
  const include: any =
    module === "billing"
      ? { items: true, payments: true, client: { select: { name: true } } }
      : module === "employees"
        ? {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
              },
            },
            attendances: true,
            leaves: true,
            salarySlips: true,
            documents: true,
          }
        : module === "cases"
          ? {
              criminalDetail: true,
              civilDetail: true,
              caseHistory: { orderBy: { date: "desc" } },
              hearings: true,
              documents: {
                select: { id: true, name: true, category: true, version: true },
              },
              tasks: true,
              ...(finance ? { invoices: true } : {}),
            }
          : module === "clients"
            ? {
                cases: {
                  where: caseScope(user),
                  select: {
                    id: true,
                    caseId: true,
                    title: true,
                    status: true,
                    nextHearingDate: true,
                  },
                },
                ...(hasPermission(user.role, "clients:write")
                  ? { communications: true }
                  : {}),
                documents: {
                  where: scope("documents", user),
                  select: { id: true, name: true, category: true },
                },
                ...(finance ? { invoices: true, payments: true } : {}),
              }
            : module === "documents"
              ? {
                  versions: {
                    select: {
                      version: true,
                      createdAt: true,
                      uploadedBy: true,
                    },
                  },
                }
              : undefined;
  const where = recordFilter(module, user, paging?.search || "");
  const records = await delegate(modules[module].model).findMany({
    where,
    include,
    orderBy: modelInfo(modules[module].model).fields.some(
      (f) => f.name === "createdAt",
    )
      ? { createdAt: "desc" }
      : { id: "desc" },
    ...(paging ? { take: paging.take, skip: paging.skip } : {}),
  });
  if (module === "tasks")
    return records.map((r: any) => ({
      ...r,
      status:
        r.status !== "COMPLETED" && r.dueDate && r.dueDate < new Date()
          ? "OVERDUE"
          : r.status,
    }));
  if (module === "clients" && !hasPermission(user.role, "clients:write"))
    return records.map(
      ({ notes, idNumber, idType, userId, ...record }: any) => record,
    );
  if (
    module === "employees" &&
    !["SUPER_ADMIN", "HR_ADMIN", "OFFICE_MANAGER"].includes(user.role)
  )
    return records.map(
      ({
        salary,
        bankAccount,
        ifscCode,
        panNumber,
        aadharNumber,
        emergencyContact,
        address,
        salarySlips,
        documents,
        ...record
      }: any) => record,
    );
  return records;
}
export function recordFilter(module: ModuleName, user: Actor, search: string) {
  const conditions: any[] = [scope(module, user)];
  if (search) {
    const hiddenSearchFields = ["fileUrl", "url"];
    if (
      module === "employees" &&
      !hasPermission(user.role, "employees:sensitive")
    )
      hiddenSearchFields.push(
        "bankAccount",
        "ifscCode",
        "panNumber",
        "aadharNumber",
        "address",
        "emergencyContact",
      );
    if (module === "clients" && !hasPermission(user.role, "clients:write"))
      hiddenSearchFields.push("notes", "idNumber", "idType", "userId");
    const strings = modelInfo(modules[module].model).fields.filter(
      (f) =>
        f.kind !== "object" &&
        f.type === "String" &&
        !hiddenSearchFields.includes(f.name),
    );
    const matches: any[] = strings.map((f) => ({
      [f.name]: { contains: search.slice(0, 200) },
    }));
    if (module === "employees")
      matches.push(
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      );
    conditions.push({ OR: matches });
  }
  return { AND: conditions };
}
