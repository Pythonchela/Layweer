const crypto = require("node:crypto");
require("@next/env").loadEnvConfig(process.cwd());
require("./hostinger-runtime.cjs")();
const { PrismaClient, Prisma } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  await db.$queryRawUnsafe("SELECT 1 AS connectionCheck");
  const counts = {};
  for (const model of Prisma.dmmf.datamodel.models) {
    const delegate = model.name[0].toLowerCase() + model.name.slice(1);
    counts[model.name] = await db[delegate].count();
  }
  console.log("Database connection and all model tables are available.");
  console.log(JSON.stringify({ counts }));
  if (process.argv.includes("--write-probe")) {
    const rollback = new Error("Rollback database verification records");
    try {
      await db.$transaction(async (tx) => {
        const suffix = crypto.randomBytes(12).toString("hex");
        const user = await tx.user.create({ data: {
          name: "Database verification", email: `database-check-${suffix}@invalid.example`,
          password: crypto.randomBytes(32).toString("hex"), role: "CLIENT", isActive: false,
        }});
        const client = await tx.client.create({ data: {
          name: "Database verification", mobile: "0000000000", clientId: `check-${suffix}`,
          userId: user.id, notes: "परीक्षण".repeat(1000),
        }});
        const invoice = await tx.invoice.create({ data: {
          clientId: client.id, invoiceNumber: `check-${suffix}`, totalAmount: 123.45, pendingAmount: 123.45,
          items: { create: { feeType: "CONSULTATION", description: "Verification".repeat(500), quantity: 1, rate: 123.45, amount: 123.45 } },
        }, include: { items: true, client: { include: { user: true } } } });
        if (invoice.client.user?.id !== user.id || invoice.items.length !== 1 || invoice.pendingAmount !== 123.45)
          throw new Error("Database relation or billing verification failed");
        await tx.client.update({ where: { id: client.id }, data: { notes: "Updated database verification" } });
        const updated = await tx.client.findUnique({ where: { id: client.id } });
        if (updated?.notes !== "Updated database verification") throw new Error("Database update verification failed");
        throw rollback;
      }, { timeout: 20000 });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    console.log("Create, read, update, relations, long Unicode text and billing verified; all verification records rolled back.");
  }
}

main().catch((error) => {
  // Do not print connection strings, credentials or record contents on failures.
  console.error("Database verification failed:", error.code || error.name || "Unknown error");
  process.exitCode = 1;
}).finally(() => db.$disconnect());
