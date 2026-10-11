// Restore to a NEW directory and an empty database only.
const fs = require("node:fs");
const path = require("node:path");
const { gunzipSync } = require("node:zlib");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
require("@next/env").loadEnvConfig(process.cwd());
require("./hostinger-runtime.cjs")();
const { PrismaClient, Prisma } = require("@prisma/client");
async function main() {
  const input = process.argv[2],
    output = process.argv[3],
    mysql = process.argv.includes("--mysql");
  if (!input || !output)
    throw new Error(
      "Usage: node scripts/restore-backup.cjs <backup.lfbackup> <new-output-directory> [--mysql] (MySQL uses DATABASE_URL and must be empty)",
    );
  const target = path.resolve(output);
  if (fs.existsSync(target))
    throw new Error(
      "Output directory already exists. Choose a new directory to preserve existing data.",
    );
  let bytes = fs.readFileSync(path.resolve(input));
  if (bytes.subarray(0, 6).equals(Buffer.from("LFBK1\0"))) {
    const key = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!/^[a-f0-9]{64}$/i.test(key || ""))
      throw new Error(
        "The original DOCUMENT_ENCRYPTION_KEY is required to restore this encrypted backup",
      );
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      bytes.subarray(6, 18),
    );
    decipher.setAuthTag(bytes.subarray(18, 34));
    bytes = Buffer.concat([
      decipher.update(bytes.subarray(34)),
      decipher.final(),
    ]);
  }
  const backup = JSON.parse(gunzipSync(bytes).toString());
  if (backup.version !== 1 || !backup.records || !backup.files)
    throw new Error("Unsupported backup");
  const databaseUrl = mysql ? process.env.DATABASE_URL :
    "file:" + path.join(target, "restored.db").replaceAll("\\", "/");
  require("./database-schema.cjs").schemaForUrl(databaseUrl);
  if (mysql && !databaseUrl?.startsWith("mysql://")) throw new Error("--mysql requires a MySQL DATABASE_URL");
  const generatedSchema = fs.readFileSync(require.resolve(".prisma/client/schema.prisma"), "utf8");
  if (!generatedSchema.includes(`provider = "${mysql ? "mysql" : "sqlite"}"`))
    throw new Error("Generate Prisma for the restore target in an isolated checkout before restoring");
  for (const name of Object.keys(backup.files))
    if (!/^[a-f0-9]{48}$/.test(name)) throw new Error("Invalid stored file name");
  if (!mysql) {
    fs.mkdirSync(target, { recursive: true, mode: 0o700 });
    await require("./create-database.cjs")(databaseUrl);
  }
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    if (mysql) {
      const tables = await db.$queryRawUnsafe("SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE()");
      const allowed = new Set(Prisma.dmmf.datamodel.models.map(model => model.name).concat("_prisma_migrations"));
      if (tables.some(table => !allowed.has(table.name))) throw new Error("Restore database contains unrelated tables; choose an empty database");
      if (tables.some(table => table.name !== "_prisma_migrations")) {
        for (const model of Prisma.dmmf.datamodel.models) {
          if (await db[model.name[0].toLowerCase() + model.name.slice(1)].count())
            throw new Error("Restore database contains records; existing data will not be overwritten");
        }
      } else {
        const result = spawnSync(process.execPath, ["scripts/database.cjs", "deploy"], {
          stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl },
        });
        if (result.status !== 0) throw new Error("Unable to initialize the empty restore database");
      }
      fs.mkdirSync(target, { recursive: true, mode: 0o700 });
    }
    const ordered = [
      "User",
      "Employee",
      "Client",
      "Lead",
      "Case",
      "CriminalCase",
      "CivilCase",
      "CaseHistory",
      "Hearing",
      "Reminder",
      "EmployeeDocument",
      "Attendance",
      "Leave",
      "SalarySlip",
      "Document",
      "DocumentVersion",
      "Invoice",
      "PaymentOrder",
      "InvoiceItem",
      "Payment",
      "Task",
      "Communication",
      "Appointment",
      "Notification",
      "CourtHoliday",
      "NewsUpdate",
      "Testimonial",
      "FirmSetting",
      "Expense",
      "AuditLog",
    ];
    await db.$transaction(
      async (tx) => {
        for (const name of ordered) {
          const model = Prisma.dmmf.datamodel.models.find(
            (m) => m.name === name,
          );
          if (!model) continue;
          const dateKeys = model.fields
            .filter((f) => f.type === "DateTime" && f.kind !== "object")
            .map((f) => f.name);
          for (const row of backup.records[name] || []) {
            const data = { ...row };
            for (const key of dateKeys)
              if (data[key]) data[key] = new Date(data[key]);
            await tx[name[0].toLowerCase() + name.slice(1)].create({ data });
          }
        }
      },
      { timeout: 120000 },
    );
    const folder = path.join(target, "documents");
    fs.mkdirSync(folder, { mode: 0o700 });
    for (const [name, bytes] of Object.entries(backup.files)) {
      if (!/^[a-f0-9]{48}$/.test(name))
        throw new Error("Invalid stored file name");
      fs.writeFileSync(path.join(folder, name), Buffer.from(bytes, "base64"), { mode: 0o600 });
    }
    console.log("Restored database and encrypted documents to:", target);
    console.log(
      "Keep the original DOCUMENT_ENCRYPTION_KEY. Set DOCUMENT_STORAGE_DIR to the restored documents directory when switching to the restored database.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
