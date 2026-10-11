const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
if (!process.env.DATABASE_URL?.endsWith("/admin-test.db"))
  throw new Error("Security checks require the isolated test database");
const base = "http://localhost:3101",
  db = new PrismaClient(),
  password = "ReviewOnly@12345";
let passed = 0;
const results = [];
function check(ok, label) {
  assert.ok(ok, label);
  passed++;
  results.push({ label, passed: true });
  console.log("PASS", label);
}
async function req(url, { cookie, method = "GET", body, headers = {} } = {}) {
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
  const data = r.headers.get("content-type")?.includes("json")
    ? await r.json()
    : await r.text();
  return {
    status: r.status,
    data,
    headers: r.headers,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
const roles = [
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
];
const modules = [
  "cases",
  "clients",
  "employees",
  "billing",
  "tasks",
  "calendar",
  "documents",
  "leads",
  "appointments",
  "settings",
  "payroll",
  "employeeDocuments",
];
const read = {
  SUPER_ADMIN: modules,
  SENIOR_ADVOCATE: [
    "cases",
    "clients",
    "employees",
    "billing",
    "tasks",
    "calendar",
    "documents",
    "leads",
    "appointments",
  ],
  ADVOCATE: [
    "cases",
    "clients",
    "tasks",
    "calendar",
    "documents",
    "appointments",
  ],
  JUNIOR_ADVOCATE: ["cases", "clients", "tasks", "calendar", "documents"],
  ASSOCIATE: ["cases", "clients", "tasks", "documents"],
  LEGAL_ASSISTANT: ["cases", "tasks", "documents"],
  CLERK: ["cases", "tasks", "calendar", "documents"],
  TYPIST: ["documents"],
  ACCOUNTANT: ["billing"],
  RECEPTIONIST: ["clients", "leads", "appointments"],
  OFFICE_MANAGER: ["employees", "tasks", "payroll", "employeeDocuments"],
  HR_ADMIN: ["employees", "payroll", "employeeDocuments"],
  IT_ADMIN: ["settings"],
  CLIENT: [],
};
const write = {
  SUPER_ADMIN: modules,
  SENIOR_ADVOCATE: [
    "cases",
    "clients",
    "billing",
    "tasks",
    "calendar",
    "documents",
    "leads",
    "appointments",
  ],
  ADVOCATE: ["cases", "tasks", "calendar", "documents"],
  JUNIOR_ADVOCATE: ["tasks", "documents"],
  ASSOCIATE: [],
  LEGAL_ASSISTANT: ["documents"],
  CLERK: ["calendar", "documents"],
  TYPIST: ["documents"],
  ACCOUNTANT: ["billing"],
  RECEPTIONIST: ["clients", "leads", "appointments"],
  OFFICE_MANAGER: ["employees", "tasks", "payroll", "employeeDocuments"],
  HR_ADMIN: ["employees", "payroll", "employeeDocuments"],
  IT_ADMIN: ["settings"],
  CLIENT: [],
};
async function main() {
  const actors = {},
    hash = await bcrypt.hash(password, 12);
  for (const role of roles) {
    const user =
      role === "SUPER_ADMIN"
        ? await db.user.findUniqueOrThrow({
            where: { email: "admin@test.invalid" },
          })
        : await db.user.create({
            data: {
              name: "Security " + role,
              email: role.toLowerCase() + "@security.invalid",
              password: hash,
              role,
            },
          });
    const employee =
      role === "CLIENT"
        ? null
        : await db.employee.create({
            data: {
              employeeId: "SEC-" + role,
              userId: user.id,
              salary: 10000,
              bankAccount: "PRIVATE-BANK",
              panNumber: "PRIVATE-PAN",
            },
          });
    const login = await req("/api/auth/login", {
      method: "POST",
      body: {
        email: user.email,
        password: role === "SUPER_ADMIN" ? "TestOnly@12345" : password,
      },
    });
    check(login.status === 200, role + " sign-in");
    actors[role] = { user, employee, cookie: login.cookie };
  }
  const admin = actors.SUPER_ADMIN.cookie,
    junior = actors.JUNIOR_ADVOCATE.cookie,
    clientCookie = actors.CLIENT.cookie;
  const ca = await db.client.create({
      data: {
        clientId: "SEC-A",
        name: "Client A",
        mobile: "+910000000001",
        userId: actors.CLIENT.user.id,
      },
    }),
    cb = await db.client.create({
      data: { clientId: "SEC-B", name: "Client B", mobile: "+910000000002" },
    });
  const a = await db.case.create({
      data: {
        caseId: "SEC-A",
        title: "Case A",
        caseType: "CIVIL",
        court: "Review court",
        clientId: ca.id,
        seniorAdvocateId: actors.ADVOCATE.employee.id,
        juniorAdvocateId: actors.JUNIOR_ADVOCATE.employee.id,
        clerkId: actors.CLERK.employee.id,
        notes: "PRIVATE-STRATEGY",
      },
    }),
    b = await db.case.create({
      data: {
        caseId: "SEC-B",
        title: "Case B",
        caseType: "CIVIL",
        court: "Review court",
        clientId: cb.id,
        seniorAdvocateId: actors.SENIOR_ADVOCATE.employee.id,
      },
    });
  await db.hearing.create({
    data: {
      caseId: a.id,
      hearingDate: new Date("2026-11-20T10:00:00Z"),
      notes: "PRIVATE-HEARING",
    },
  });
  await db.communication.createMany({
    data: [
      {
        clientId: ca.id,
        type: "INTERNAL_NOTE",
        message: "PRIVATE-COMMUNICATION",
      },
      { clientId: ca.id, type: "PORTAL_REPLY", message: "Shared reply" },
    ],
  });
  await db.invoice.create({
    data: {
      invoiceNumber: "SEC-INVOICE",
      clientId: ca.id,
      caseId: a.id,
      totalAmount: 100,
      pendingAmount: 100,
      notes: "PRIVATE-INVOICE",
      createdBy: actors.SUPER_ADMIN.user.id,
    },
  });
  const appointment = await db.appointment.create({
    data: {
      name: "Appointment A",
      mobile: "+910000000001",
      advocateId: actors.ADVOCATE.employee.id,
      appointmentDate: new Date("2026-11-20"),
      slot: "10:00 AM",
      type: "ONLINE",
    },
  });
  await db.appointment.create({
    data: {
      name: "Appointment B",
      mobile: "+910000000002",
      advocateId: actors.SENIOR_ADVOCATE.employee.id,
      appointmentDate: new Date("2026-11-20"),
      slot: "10:30 AM",
      type: "ONLINE",
    },
  });
  for (const role of roles)
    for (const module of modules) {
      const r = await req("/api/admin/" + module, {
        cookie: actors[role].cookie,
      });
      check(
        r.status === (read[role].includes(module) ? 200 : 403),
        role + " " + module + " read boundary",
      );
      if (!write[role].includes(module)) {
        const w = await req("/api/admin/" + module, {
          cookie: actors[role].cookie,
          method: "POST",
          body: {},
        });
        check(w.status === 403, role + " " + module + " write denial");
      }
    }
  for (const actor of ["HR_ADMIN", "OFFICE_MANAGER"]) {
    for (const target of roles.filter((r) => r !== actor)) {
      const r = await req("/api/admin/employees", {
        cookie: actors[actor].cookie,
        method: "PATCH",
        body: {
          id: actors[actor].employee.id,
          name: actors[actor].user.name,
          email: actors[actor].user.email,
          role: target,
          isActive: true,
        },
      });
      check(
        [400, 403].includes(r.status),
        actor + " cannot self-promote to " + target,
      );
    }
    check(
      (
        await req("/api/admin/employees", {
          cookie: actors[actor].cookie,
          method: "POST",
          body: {
            name: "Unauthorized account",
            email: "new-" + actor + "@security.invalid",
            role: "ACCOUNTANT",
            password,
          },
        })
      ).status === 403,
      actor + " cannot provision login accounts",
    );
    for (const change of [
      { password: "UnauthorizedReset@12345" },
      { email: "hijacked@security.invalid" },
    ]) {
      const r = await req("/api/admin/employees", {
        cookie: actors[actor].cookie,
        method: "PATCH",
        body: {
          id: actors.ACCOUNTANT.employee.id,
          name: actors.ACCOUNTANT.user.name,
          email: actors.ACCOUNTANT.user.email,
          role: "ACCOUNTANT",
          ...change,
        },
      });
      check(
        r.status === 403,
        actor + " cannot change another account credential",
      );
    }
    check(
      (
        await req("/api/admin/employees", {
          cookie: actors[actor].cookie,
          method: "PATCH",
          body: {
            id: actors[actor].employee.id,
            name: actors[actor].user.name,
            email: actors[actor].user.email,
            role: actor,
            department: "HR updated profile",
          },
        })
      ).status === 200,
      actor + " can edit a staff profile",
    );
  }
  check(
    (
      await req("/api/admin/employees", {
        cookie: admin,
        method: "PATCH",
        body: {
          id: actors.SUPER_ADMIN.employee.id,
          name: actors.SUPER_ADMIN.user.name,
          email: actors.SUPER_ADMIN.user.email,
          role: "HR_ADMIN",
        },
      })
    ).status === 400,
    "Last active super administrator is protected",
  );
  const seniorRecords = (
    await req("/api/admin/employees", { cookie: actors.SENIOR_ADVOCATE.cookie })
  ).data.records;
  check(
    seniorRecords.every(
      (r) =>
        !("salary" in r) &&
        !("bankAccount" in r) &&
        !("panNumber" in r) &&
        !("salarySlips" in r) &&
        !("documents" in r),
    ),
    "Team directory excludes confidential HR fields",
  );
  check(
    (
      await req("/api/admin/employees?search=PRIVATE-PAN", {
        cookie: actors.SENIOR_ADVOCATE.cookie,
      })
    ).data.records.length === 0,
    "Hidden HR fields cannot be inferred through search",
  );
  const juniorCases = (await req("/api/admin/cases", { cookie: junior })).data
    .records;
  check(
    juniorCases.length === 1 &&
      juniorCases[0].id === a.id &&
      !("invoices" in juniorCases[0]),
    "Junior case scope and financial redaction",
  );
  check(
    (
      await req("/api/admin/cases", {
        cookie: actors.ADVOCATE.cookie,
        method: "PATCH",
        body: { id: a.id, juniorAdvocateId: actors.ASSOCIATE.employee.id },
      })
    ).status === 403,
    "Advocate cannot grant case-team access",
  );
  check(
    (
      await req("/api/admin/cases", {
        cookie: admin,
        method: "PATCH",
        body: { id: a.id, clerkId: actors.ACCOUNTANT.employee.id },
      })
    ).status === 400,
    "Role-inappropriate case assignment is rejected",
  );
  const appointments = (
    await req("/api/admin/appointments", { cookie: actors.ADVOCATE.cookie })
  ).data.records;
  check(
    appointments.length === 1 && appointments[0].id === appointment.id,
    "Advocate sees own appointment and not another advocate appointment",
  );
  const portal = (await req("/api/portal", { cookie: clientCookie })).data;
  const juniorClients = (await req("/api/admin/clients", { cookie: junior }))
    .data.records;
  check(
    juniorClients.every(
      (record) =>
        !("notes" in record) &&
        !("idNumber" in record) &&
        !("communications" in record),
    ),
    "Case staff cannot read client-wide confidential notes or communications",
  );
  check(
    portal.cases.length === 1 && portal.cases[0].id === a.id,
    "Client own-case boundary",
  );
  check(
    !JSON.stringify(portal).includes("PRIVATE-") &&
      !("notes" in portal.cases[0]) &&
      !("notes" in portal.hearings[0]) &&
      !("createdBy" in portal.invoices[0]),
    "Portal excludes internal notes and administrative fields",
  );
  check(
    portal.communications.length === 1 &&
      portal.communications[0].type === "PORTAL_REPLY",
    "Only explicitly shared messages reach the portal",
  );
  for (const url of [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/admin/clients",
    "/api/admin/security",
    "/api/portal",
    "/api/payments/order",
    "/api/payments/verify",
    "/api/appointments",
  ]) {
    const cookie = url === "/api/portal" ? clientCookie : admin;
    check(
      (
        await req(url, {
          cookie,
          method: "POST",
          headers: {
            Origin: "https://attacker.invalid",
            "sec-fetch-site": "cross-site",
          },
          body: {
            email: "admin@test.invalid",
            password: "TestOnly@12345",
            action: "password",
            newPassword: "UnauthorizedChange@12345",
          },
        })
      ).status === 403,
      "Cross-site request rejected: " + url,
    );
  }
  async function fileUpload(cookie, caseId, clientId, isPublic, id) {
    const form = new FormData();
    form.set(
      "file",
      new Blob(["confidential evidence"], { type: "text/plain" }),
      "evidence.txt",
    );
    form.set("name", "Evidence");
    form.set("caseId", caseId);
    form.set("clientId", clientId);
    form.set("isPublic", String(isPublic));
    if (id) form.set("id", id);
    return req("/api/files", { cookie, method: "POST", body: form });
  }
  const privateA = await fileUpload(admin, a.id, ca.id, false),
    privateB = await fileUpload(admin, b.id, cb.id, false);
  check(
    privateA.status === 201 && privateB.status === 201,
    "Private document upload works",
  );
  check(
    (await req("/api/files/" + privateB.data.record.id, { cookie: junior }))
      .status === 404,
    "Cross-team document download blocked",
  );
  check(
    (
      await req("/api/files/" + privateA.data.record.id, {
        cookie: clientCookie,
      })
    ).status === 404,
    "Client cannot download unshared document",
  );
  check(
    (await fileUpload(junior, a.id, ca.id, true)).status === 403,
    "Junior cannot publish client-shared documents",
  );
  const published = await fileUpload(
    admin,
    a.id,
    ca.id,
    true,
    privateA.data.record.id,
  );
  check(published.status === 201, "Supervisor can publish a document version");
  check(
    (
      await req("/api/files/" + privateA.data.record.id, {
        cookie: clientCookie,
      })
    ).status === 200,
    "Client can download shared current version",
  );
  check(
    (
      await req("/api/files/" + privateA.data.record.id + "?version=1", {
        cookie: clientCookie,
      })
    ).status === 403,
    "Client cannot retrieve historical private version",
  );
  check(
    (await fileUpload(junior, a.id, ca.id, false, privateA.data.record.id))
      .status === 403,
    "Junior cannot replace a published document",
  );
  const unsafe = new FormData();
  unsafe.set(
    "file",
    new Blob(["<script>alert(1)</script>"], { type: "text/html" }),
    "attack.html",
  );
  unsafe.set("caseId", a.id);
  unsafe.set("clientId", ca.id);
  check(
    (await req("/api/files", { cookie: admin, method: "POST", body: unsafe }))
      .status === 400,
    "HTML upload rejected",
  );
  check(
    (
      await req("/api/admin/clients", {
        cookie: admin,
        method: "POST",
        body: { name: "X", mobile: "12345678", notes: "x".repeat(300000) },
      })
    ).status === 400,
    "Oversized JSON request rejected",
  );
  const headers = (await req("/api/auth/me", { cookie: admin })).headers;
  check(
    headers.get("x-frame-options") === "DENY" &&
      headers.get("x-content-type-options") === "nosniff" &&
      headers.get("cache-control").includes("no-store"),
    "Anti-framing, type and private-cache headers",
  );
  check(
    headers.get("content-security-policy")?.includes("'nonce-") &&
      headers.get("content-security-policy")?.includes("object-src 'none'"),
    "Nonce content security policy is present",
  );
  const created = await req("/api/admin/employees", {
    cookie: admin,
    method: "POST",
    body: {
      name: "Temporary employee",
      email: "temporary@security.invalid",
      role: "JUNIOR_ADVOCATE",
      password: "TemporaryPass@12345",
    },
  });
  check(
    created.status === 201,
    "Super administrator provisions temporary account",
  );
  const temp = await req("/api/auth/login", {
    method: "POST",
    body: {
      email: "temporary@security.invalid",
      password: "TemporaryPass@12345",
    },
  });
  check(
    temp.data.user.mustChangePassword === true &&
      (await req("/api/admin/cases", { cookie: temp.cookie })).status === 403,
    "Temporary credentials cannot access records",
  );
  check(
    (
      await req("/api/admin/security", {
        cookie: temp.cookie,
        method: "POST",
        body: {
          action: "password",
          password: "TemporaryPass@12345",
          newPassword: "TemporaryPass@12345",
        },
      })
    ).status === 400,
    "Temporary password cannot be reused to bypass replacement",
  );
  check(
    (
      await req("/api/admin/security", {
        cookie: temp.cookie,
        method: "POST",
        body: {
          action: "password",
          password: "TemporaryPass@12345",
          newPassword: "Mint@82",
        },
      })
    ).status === 400,
    "Seven-character replacement password rejected",
  );
  check(
    (
      await req("/api/admin/security", {
        cookie: temp.cookie,
        method: "POST",
        body: {
          action: "password",
          password: "TemporaryPass@12345",
          newPassword: "password",
        },
      })
    ).status === 400,
    "Common eight-character password is rejected",
  );
  check(
    (
      await req("/api/admin/security", {
        cookie: temp.cookie,
        method: "POST",
        body: {
          action: "password",
          password: "TemporaryPass@12345",
          newPassword: "Mint@82Q",
        },
      })
    ).status === 200 &&
      (await req("/api/admin/cases", { cookie: temp.cookie })).status === 200,
    "Unique eight-character password unlocks only permitted workspace",
  );
  for (let n = 0; n < 8; n++)
    await req("/api/auth/login", {
      method: "POST",
      headers: { "x-forwarded-for": "192.0.2." + n },
      body: { email: "limited@security.invalid", password: "wrong" },
    });
  check(
    (
      await req("/api/auth/login", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.10" },
        body: { email: "limited@security.invalid", password: "wrong" },
      })
    ).status === 429,
    "Forwarded header changes cannot bypass account lockout",
  );
  const durable = await db.authThrottle.findUnique({
    where: {
      key:
        "login-account:" +
        crypto
          .createHash("sha256")
          .update("limited@security.invalid")
          .digest("hex"),
    },
  });
  check(
    durable.count === 8 && durable.expiresAt > new Date(),
    "Login throttle persists in the database",
  );
  await db.user.update({
    where: { id: actors.JUNIOR_ADVOCATE.user.id },
    data: { isActive: false },
  });
  check(
    (await req("/api/auth/me", { cookie: junior })).status === 401,
    "Deactivation immediately blocks an existing session",
  );
  const changedRole = await req("/api/admin/employees", {
    cookie: admin,
    method: "PATCH",
    body: {
      id: actors.HR_ADMIN.employee.id,
      name: actors.HR_ADMIN.user.name,
      email: actors.HR_ADMIN.user.email,
      role: "ACCOUNTANT",
    },
  });
  check(
    changedRole.status === 200 &&
      (await req("/api/auth/me", { cookie: actors.HR_ADMIN.cookie })).status ===
        401,
    "Authorized role change revokes the previous session",
  );
  const stale = crypto.randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      userId: actors.CLIENT.user.id,
      token: crypto.createHash("sha256").update(stale).digest("hex"),
      expiresAt: new Date(Date.now() - 60000),
    },
  });
  check(
    (await req("/api/auth/me", { cookie: "lexfirm_session=" + stale }))
      .status === 401,
    "Expired session cannot authenticate",
  );
  const ts = require("typescript");
  require.extensions[".ts"] = (module, filename) =>
    module._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
  const authentication = require("../src/lib/auth.ts"),
    security = require("../src/lib/security.ts"),
    administration = require("../src/lib/admin.ts");
  const protectedSecret = security.protectSecret("TESTAUTHENTICATORSECRET");
  check(
    protectedSecret.startsWith("enc1:") &&
      security.revealSecret(protectedSecret) === "TESTAUTHENTICATORSECRET",
    "Encrypted authenticator secret round trip",
  );
  process.env.REQUIRE_PRIVILEGED_2FA = "true";
  const rootToken = admin.split("=")[1];
  check(
    (await authentication.getUserFromToken(rootToken)).mustEnable2FA === true &&
      authentication.privileged2FARequired("CLIENT") === false,
    "Privileged deployment policy requires MFA without blocking ordinary clients",
  );
  let mfaBlocked = false;
  try {
    await administration.authorize(
      new (require("next/server").NextRequest)(base + "/api/admin/settings", {
        headers: { Cookie: admin },
      }),
      "settings:read",
    );
  } catch (error) {
    mfaBlocked = error.status === 403;
  }
  check(
    mfaBlocked,
    "Missing required MFA blocks privileged records on the server",
  );
  const previousNodeEnv = process.env.NODE_ENV,
    previousOrigin = process.env.APP_ORIGIN;
  process.env.NODE_ENV = "production";
  process.env.APP_ORIGIN = "https://deployment.test.invalid";
  delete process.env.REQUIRE_PRIVILEGED_2FA;
  check(authentication.privileged2FARequired("SUPER_ADMIN"), "Live deployment requires MFA by default");
  process.env.REQUIRE_PRIVILEGED_2FA = "false";
  check(
    !(await authentication.getUserFromToken(rootToken)).mustEnable2FA &&
      !authentication.privileged2FARequired("SUPER_ADMIN"),
    "Explicit testing preference disables mandatory enrollment on a live domain",
  );
  const testingAdmin = await administration.authorize(
    new (require("next/server").NextRequest)(base + "/api/admin/settings", {
      headers: { Cookie: admin },
    }),
    "settings:read",
  );
  check(testingAdmin.role === "SUPER_ADMIN", "Testing administrator can open records without enrollment");
  process.env.REQUIRE_PRIVILEGED_2FA = "invalid";
  check(authentication.privileged2FARequired("SUPER_ADMIN"), "Invalid testing preference does not bypass production MFA");
  process.env.REQUIRE_PRIVILEGED_2FA = "true";
  process.env.APP_ORIGIN = "http://localhost:3101";
  check(authentication.privileged2FARequired("SUPER_ADMIN"), "Explicit requirement still applies to local testing");
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  if (previousOrigin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = previousOrigin;
  delete process.env.REQUIRE_PRIVILEGED_2FA;
  await require("../src/lib/prisma.ts").prisma.$disconnect();
  fs.writeFileSync(
    ".data/security-test-results.json",
    JSON.stringify({ passed, checks: results }, null, 2),
  );
  console.log("Completed " + passed + " security assertions");
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
