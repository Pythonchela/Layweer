const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const base = process.env.TEST_BASE_URL || "http://localhost:3101";
if (
  !process.env.DATABASE_URL?.endsWith("/admin-test.db") ||
  !/^http:\/\/localhost:3101$/.test(base)
)
  throw new Error(
    "Integration tests require the isolated .data/admin-test.db and localhost:3101 test server.",
  );
let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed++;
  console.log("PASS", message);
}
async function request(
  url,
  { cookie, method = "GET", body, raw = false } = {},
) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const r = await fetch(base + url, {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
    redirect: "manual",
  });
  const data = raw
    ? await r.arrayBuffer()
    : r.headers.get("content-type")?.includes("json")
      ? await r.json()
      : await r.text();
  return { r, data, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
async function main() {
  check(
    (await request("/api/admin/clients")).r.status === 401,
    "Anonymous API denied",
  );
  check(
    (await request("/admin/dashboard")).r.status === 307,
    "Anonymous admin page redirects",
  );
  check(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "admin@test.invalid", password: "wrong" },
      })
    ).r.status === 401,
    "Invalid password rejected",
  );
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@test.invalid", password: "TestOnly@12345" },
  });
  check(login.r.status === 200 && login.cookie, "Administrator login succeeds");
  check(
    login.r.headers.get("set-cookie").includes("HttpOnly"),
    "Session cookie is HttpOnly",
  );
  const cookie = login.cookie;
  check(
    (await request("/api/auth/me", { cookie })).data.user.role ===
      "SUPER_ADMIN",
    "Session authenticates",
  );
  const create = async (module, body) => {
    const { r, data } = await request("/api/admin/" + module, {
      cookie,
      method: "POST",
      body,
    });
    assert.equal(r.status, 201, JSON.stringify(data));
    return data.record;
  };
  const client = await create("clients", {
    name: "Integration Client",
    mobile: "9999999999",
    email: "client@test.invalid",
    clientType: "INDIVIDUAL",
  });
  const other = await create("clients", {
    name: "Private Client",
    mobile: "8888888888",
  });
  check(
    (await request("/api/admin/clients", { cookie })).data.records.some(
      (c) => c.id === client.id,
    ),
    "Client persists and reloads",
  );
  check(
    (
      await request("/api/admin/clients", {
        cookie,
        method: "PATCH",
        body: { id: client.id, city: "Patna" },
      })
    ).r.status === 200,
    "Client update saves",
  );
  const employee = await create("employees", {
    name: "Junior test",
    email: "junior@test.invalid",
    password: "JuniorTest@12345",
    role: "JUNIOR_ADVOCATE",
    department: "Litigation",
  });
  const case1 = await create("cases", {
    title: "Test Case",
    caseType: "CRIMINAL",
    court: "District Court",
    clientId: client.id,
    juniorAdvocateId: employee.id,
  });
  const case2 = await create("cases", {
    title: "Private Case",
    caseType: "CIVIL",
    court: "High Court",
    clientId: other.id,
  });
  await create("criminal", {
    caseId: case1.id,
    firNumber: "TEST-FIR",
    policeStation: "Test Station",
    accusedName: "Test Accused",
  });
  await create("civil", {
    caseId: case2.id,
    plaintiffName: "Test Plaintiff",
    defendantName: "Test Defendant",
    plaint: "Test pleading",
  });
  await create("history", {
    caseId: case1.id,
    event: "FILING",
    description: "Test filing",
    date: "2026-10-10T10:00:00Z",
  });
  const hearing = await create("calendar", {
    caseId: case1.id,
    hearingDate: "2026-11-10T10:00:00Z",
    court: "District Court",
    purpose: "ARGUMENTS",
    status: "SCHEDULED",
  });
  check(
    (await request("/api/admin/reminders", { cookie })).data.records.filter(
      (r) => r.hearingId === hearing.id,
    ).length === 4,
    "Hearing creates four reminder records",
  );
  const cases = (await request("/api/admin/cases", { cookie })).data.records;
  check(
    cases.find((c) => c.id === case1.id).nextHearingDate ===
      "2026-11-10T10:00:00.000Z",
    "Hearing updates case next date",
  );
  const invoice = await create("billing", {
    clientId: client.id,
    caseId: case1.id,
    items: [{ description: "Fee", rate: 100, quantity: 2 }],
  });
  check(
    invoice.totalAmount === 200 && invoice.pendingAmount === 200,
    "Invoice totals computed on server",
  );
  await create("payments", {
    clientId: client.id,
    invoiceId: invoice.id,
    amount: 75,
    paymentMethod: "UPI",
  });
  const invoice2 = (
    await request("/api/admin/billing", { cookie })
  ).data.records.find((i) => i.id === invoice.id);
  check(
    invoice2.paidAmount === 75 &&
      invoice2.pendingAmount === 125 &&
      invoice2.status === "PARTIAL",
    "Partial payment updates balances",
  );
  check(
    (
      await request("/api/admin/payments", {
        cookie,
        method: "POST",
        body: {
          clientId: client.id,
          invoiceId: invoice.id,
          amount: 126,
          paymentMethod: "CASH",
        },
      })
    ).r.status === 400,
    "Overpayment rejected",
  );
  const task = await create("tasks", {
    title: "Prepare bail",
    assigneeId: employee.userId,
    caseId: case1.id,
    priority: "HIGH",
  });
  check(
    (
      await request("/api/admin/actions", {
        cookie,
        method: "POST",
        body: { action: "completeTask", id: task.id },
      })
    ).data.record.status === "COMPLETED",
    "Task completion persists",
  );
  const lead = await create("leads", {
    name: "New Lead",
    mobile: "7777777777",
  });
  const conversion = await request("/api/admin/actions", {
    cookie,
    method: "POST",
    body: { action: "convertLead", id: lead.id },
  });
  check(conversion.data.record.clientId, "Lead conversion creates client");
  const again = await request("/api/admin/actions", {
    cookie,
    method: "POST",
    body: { action: "convertLead", id: lead.id },
  });
  check(
    again.data.record.clientId === conversion.data.record.clientId,
    "Repeated conversion is idempotent",
  );
  await create("attendance", {
    employeeId: employee.id,
    date: "2026-10-10T00:00:00Z",
    status: "PRESENT",
  });
  await create("leave", {
    employeeId: employee.id,
    leaveType: "CASUAL",
    fromDate: "2026-11-01T00:00:00Z",
    toDate: "2026-11-02T00:00:00Z",
  });
  const salary = await create("payroll", {
    employeeId: employee.id,
    month: 10,
    year: 2026,
    basicSalary: 10000,
    allowances: 1000,
    deductions: 500,
  });
  check(salary.netSalary === 10500, "Payroll net salary calculated");
  await create("expenses", {
    description: "Court travel",
    category: "TRAVEL",
    amount: 500,
  });
  const form = new FormData();
  form.set(
    "file",
    new Blob(["test confidential document"], { type: "text/plain" }),
    "test.txt",
  );
  form.set("name", "Test document");
  form.set("caseId", case1.id);
  form.set("clientId", client.id);
  form.set("isPublic", "true");
  const upload = await request("/api/files", {
    cookie,
    method: "POST",
    body: form,
  });
  check(upload.r.status === 201, "File upload saves metadata");
  const download = await request("/api/files/" + upload.data.record.id, {
    cookie,
    raw: true,
  });
  check(
    Buffer.from(download.data).toString() === "test confidential document",
    "Encrypted file download round trip",
  );
  const encrypted = fs.readFileSync(
    (process.env.DOCUMENT_STORAGE_DIR || ".data/documents") +
      "/" +
      upload.data.record.fileUrl,
  );
  check(
    !encrypted.includes(Buffer.from("test confidential document")),
    "Stored file content is encrypted",
  );
  const junior = await request("/api/auth/login", {
    method: "POST",
    body: { email: "junior@test.invalid", password: "JuniorTest@12345" },
  });
  check(junior.r.status === 200, "Created employee can log in");
  check(
    (await request("/api/admin/cases", { cookie: junior.cookie })).r.status ===
      403,
    "Temporary employee password blocks record access",
  );
  check(
    (
      await request("/api/admin/security", {
        cookie: junior.cookie,
        method: "POST",
        body: {
          action: "password",
          password: "JuniorTest@12345",
          newPassword: "JuniorChanged@12345",
        },
      })
    ).r.status === 200,
    "Employee replaces temporary password",
  );
  const juniorCases = (
    await request("/api/admin/cases", { cookie: junior.cookie })
  ).data.records;
  check(
    juniorCases.length === 1 && juniorCases[0].id === case1.id,
    "Junior sees assigned cases only",
  );
  check(
    !("invoices" in juniorCases[0]),
    "Case detail hides finances from junior",
  );
  check(
    (await request("/api/admin/billing", { cookie: junior.cookie })).r
      .status === 403,
    "Junior billing access denied",
  );
  check(
    (await request("/api/cases", { cookie: junior.cookie })).data.records
      .length === 1,
    "Legacy case endpoint enforces assigned scope",
  );
  check(
    (
      await request("/api/admin/calendar", {
        cookie: junior.cookie,
        method: "POST",
        body: { caseId: case2.id, hearingDate: "2026-12-01T00:00:00Z" },
      })
    ).r.status === 403,
    "Unauthorized write denied",
  );
  const report = await request("/api/admin/reports?type=case&format=excel", {
    cookie,
    raw: true,
  });
  check(
    report.r.status === 200 &&
      Buffer.from(report.data).subarray(0, 2).toString() === "PK",
    "Excel export generates XLSX",
  );
  check(
    (
      await request(
        "/api/admin/reports?type=case&from=2026-01-01&to=2026-12-31",
        { cookie },
      )
    ).data.rows.length >= 2,
    "Reports query persisted records",
  );
  check(
    (await request("/api/admin/dashboard", { cookie })).data.stats.clients >= 3,
    "Dashboard uses saved records",
  );
  check(
    (
      await request("/api/admin/settings", {
        cookie,
        method: "POST",
        body: { firmName: "Test firm" },
      })
    ).r.status === 200,
    "Firm settings save",
  );
  check(
    (await request("/api/admin/settings", { cookie })).data.settings
      .firmName === "Test firm",
    "Firm settings reload",
  );
  const tsPayments = require("typescript");
  require.extensions[".ts"] = (module, filename) =>
    module._compile(
      tsPayments.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: tsPayments.ModuleKind.CommonJS,
          target: tsPayments.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
  const payments = require("../src/lib/payments.ts"),
    crypto = require("node:crypto");
  const signature = crypto
    .createHmac("sha256", "test-secret")
    .update("order|payment")
    .digest("hex");
  check(
    payments.validSignature("order|payment", signature, "test-secret"),
    "Payment HMAC signature validates",
  );
  check(
    !payments.validSignature("order|other-payment", signature, "test-secret"),
    "Tampered payment signature rejected",
  );
  check(
    (
      await request("/api/payments/order", {
        cookie,
        method: "POST",
        body: { invoiceId: invoice.id },
      })
    ).r.status === 503,
    "Unconfigured gateway fails without charging",
  );
  check(
    (
      await request("/api/payments/webhook", {
        method: "POST",
        body: { event: "payment.captured" },
      })
    ).r.status === 401,
    "Unsigned payment webhook rejected",
  );
  const paymentDb = new PrismaClient();
  await paymentDb.paymentOrder.create({
    data: { id: "order_isolated_test", invoiceId: invoice.id, amount: 12500 },
  });
  await paymentDb.$disconnect();
  const captured = {
    id: "pay_isolated_test",
    order_id: "order_isolated_test",
    amount: 12500,
    currency: "INR",
    status: "captured",
  };
  await payments.recordCapturedPayment(captured);
  check(
    (await payments.recordCapturedPayment(captured)).alreadyRecorded,
    "Duplicate captured payment is idempotent",
  );
  const paid = (
    await request("/api/admin/billing", { cookie })
  ).data.records.find((i) => i.id === invoice.id);
  check(
    paid.paidAmount === 200 &&
      paid.pendingAmount === 0 &&
      paid.status === "PAID",
    "Verified online payment reconciles invoice",
  );
  check(
    (
      await request("/api/admin/notifications", {
        cookie,
        method: "POST",
        body: {},
      })
    ).r.status === 503,
    "Unconfigured messaging does not send messages",
  );
  const gstInvoice = await create("billing", {
    clientId: client.id,
    items: [{ description: "Drafting", rate: 1000, quantity: 1 }],
    gstRate: 18,
  });
  check(
    gstInvoice.totalAmount === 1180 && gstInvoice.gstAmount === 180,
    "GST amount calculated server-side",
  );
  check(
    (
      await request("/api/admin/calendar", {
        cookie,
        method: "PATCH",
        body: {
          id: hearing.id,
          status: "ADJOURNED",
          nextDate: "2026-12-15T10:00:00Z",
          adjournmentReason: "Test adjournment",
        },
      })
    ).r.status === 200,
    "Hearing adjournment saves",
  );
  check(
    (await request("/api/admin/cases", { cookie })).data.records.find(
      (c) => c.id === case1.id,
    ).nextHearingDate === "2026-12-15T10:00:00.000Z",
    "Adjournment updates next hearing date",
  );
  check(
    (
      await request("/api/admin/calendar", {
        cookie,
        method: "PATCH",
        body: {
          id: hearing.id,
          status: "SCHEDULED",
          hearingDate: "2026-11-10T10:00:00Z",
          nextDate: null,
        },
      })
    ).r.status === 200,
    "Hearing rescheduling saves",
  );
  const backup = await request("/api/admin/backup", { cookie, raw: true });
  check(
    backup.r.status === 200 &&
      Buffer.from(backup.data).subarray(0, 6).equals(Buffer.from("LFBK1\0")),
    "Backup is encrypted and downloadable",
  );
  fs.writeFileSync(".data/test-backup.lfbackup", Buffer.from(backup.data));
  const db = new PrismaClient();
  const password = await bcrypt.hash("ClientTest@12345", 12);
  const account = await db.user.create({
    data: {
      name: "Portal client",
      email: "portal@test.invalid",
      password,
      role: "CLIENT",
    },
  });
  await db.client.update({
    where: { id: client.id },
    data: { userId: account.id },
  });
  await db.$disconnect();
  const portal = await request("/api/auth/login", {
    method: "POST",
    body: { email: "portal@test.invalid", password: "ClientTest@12345" },
  });
  check(portal.r.status === 200, "Client login succeeds");
  check(
    (await request("/api/admin/clients", { cookie: portal.cookie })).r
      .status === 403,
    "Client cannot access admin API",
  );
  check(
    (await request("/admin/dashboard", { cookie: portal.cookie })).r.status ===
      307,
    "Client admin page redirects",
  );
  const portalData = (await request("/api/portal", { cookie: portal.cookie }))
    .data;
  check(
    portalData.cases.length === 1 && portalData.cases[0].id === case1.id,
    "Portal shows own cases only",
  );
  check(
    (
      await request("/api/files/" + upload.data.record.id, {
        cookie: portal.cookie,
        raw: true,
      })
    ).r.status === 200,
    "Client can download shared own file",
  );
  const setup = await request("/api/admin/security", {
    cookie,
    method: "POST",
    body: { action: "setup2FA", password: "TestOnly@12345" },
  });
  check(
    setup.r.status === 200 && setup.data.secret,
    "Authenticator setup produces a secret",
  );
  const ts = require("typescript");
  const compiled = ts.transpileModule(
    fs.readFileSync("src/lib/totp.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  const loader = new Function("require", "exports", compiled);
  const totp = {};
  loader(require, totp);
  const otp = totp.totpCode(setup.data.secret);
  const secretDb = new PrismaClient();
  const secretAccount = await secretDb.user.findUnique({
    where: { email: "admin@test.invalid" },
  });
  check(
    secretAccount.twoFASecret.startsWith("enc1:") &&
      secretAccount.twoFASecret !== setup.data.secret,
    "Authenticator secret is encrypted in the database",
  );
  await secretDb.$disconnect();
  check(
    (
      await request("/api/admin/security", {
        cookie,
        method: "POST",
        body: { action: "enable2FA", password: "TestOnly@12345", code: otp },
      })
    ).r.status === 200,
    "Authenticator enrollment validates code",
  );
  check(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "admin@test.invalid", password: "TestOnly@12345" },
      })
    ).r.status === 401,
    "Enabled 2FA rejects login without code",
  );
  const secondLogin = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@test.invalid",
      password: "TestOnly@12345",
      code: totp.totpCode(setup.data.secret),
    },
  });
  check(secondLogin.r.status === 200, "Enabled 2FA accepts valid code");
  const sessions = (await request("/api/admin/security", { cookie })).data
    .sessions;
  const otherSession = sessions.find((s) => !s.current);
  check(!!otherSession, "Other session can be identified");
  await request("/api/admin/security", {
    cookie,
    method: "POST",
    body: { action: "revoke", id: otherSession.id },
  });
  check(
    (await request("/api/auth/me", { cookie: secondLogin.cookie })).r.status ===
      401,
    "Terminating session invalidates it",
  );
  check(
    (
      await request("/api/admin/security", {
        cookie,
        method: "POST",
        body: {
          action: "disable2FA",
          password: "TestOnly@12345",
          code: totp.totpCode(setup.data.secret),
        },
      })
    ).r.status === 200,
    "2FA disable requires password and valid code",
  );
  check(
    (await request("/api/admin/clients?limit=1&page=2", { cookie })).data
      .records.length === 1,
    "Record pagination works",
  );
  check(
    (await request("/api/admin/clients?search=Integration", { cookie })).data
      .records.length === 1,
    "Server search filters saved records",
  );
  check(
    (await request("/api/admin/clients?limit=-1", { cookie })).r.status === 400,
    "Invalid pagination rejected",
  );
  check(
    (
      await request("/api/admin/cases", {
        cookie,
        method: "POST",
        body: {
          title: "Bad enum",
          caseType: "NOT_A_TYPE",
          court: "Test",
          clientId: client.id,
        },
      })
    ).r.status === 400,
    "Invalid case enum rejected",
  );
  const versions = new FormData();
  versions.set("id", upload.data.record.id);
  versions.set(
    "file",
    new Blob(["updated evidence"], { type: "text/plain" }),
    "test-v2.txt",
  );
  versions.set("name", "Test document");
  versions.set("caseId", case1.id);
  versions.set("clientId", client.id);
  versions.set("isPublic", "true");
  const updated = await request("/api/files", {
    cookie,
    method: "POST",
    body: versions,
  });
  check(
    updated.r.status === 201 && updated.data.record.version === 2,
    "Document version update persists",
  );
  check(
    Buffer.from(
      (
        await request("/api/files/" + upload.data.record.id + "?version=1", {
          cookie,
          raw: true,
        })
      ).data,
    ).toString() === "test confidential document",
    "Previous document version downloads",
  );
  check(
    (
      await request(
        "/api/admin/calendar-month?from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z",
        { cookie },
      )
    ).data.records.length === 1,
    "Month calendar queries saved hearings",
  );
  check(
    (
      await request("/api/admin/calendar", {
        cookie,
        method: "PATCH",
        body: { id: hearing.id, caseId: case2.id, nextDate: null },
      })
    ).r.status === 200,
    "Hearing can move between cases",
  );
  const movedCases = (await request("/api/admin/cases", { cookie })).data
    .records;
  check(
    movedCases.find((c) => c.id === case1.id).nextHearingDate === null &&
      movedCases.find((c) => c.id === case2.id).nextHearingDate ===
        "2026-11-10T10:00:00.000Z",
    "Moved hearing reconciles both case dates",
  );
  check(
    (
      await request("/api/admin/calendar", {
        cookie,
        method: "DELETE",
        body: { id: hearing.id },
      })
    ).r.status === 200 &&
      (await request("/api/admin/cases", { cookie })).data.records.find(
        (c) => c.id === case2.id,
      ).nextHearingDate === null,
    "Hearing deletion clears the next case date",
  );
  check(
    (
      await request("/api/admin/documents", {
        cookie,
        method: "DELETE",
        body: { id: upload.data.record.id },
      })
    ).r.status === 200 &&
      (await request("/api/files/" + upload.data.record.id, { cookie })).r
        .status === 404,
    "Versioned document deletion revokes downloads",
  );
  await request("/api/auth/logout", { cookie, method: "POST" });
  check(
    (await request("/api/auth/me", { cookie })).r.status === 401,
    "Logout invalidates copied session cookie",
  );
  console.log(`Completed ${passed} integration assertions`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
