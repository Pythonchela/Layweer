const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");
module.exports = async function createDatabase(url) {
  const result = spawnSync(
    process.execPath,
    [
      require.resolve("prisma/build/index.js"),
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script",
    ],
    { encoding: "utf8", env: { ...process.env, DATABASE_URL: url } },
  );
  if (result.status)
    throw new Error(result.stderr || "Unable to generate database schema");
  const db = new PrismaClient({ datasources: { db: { url } } });
  try {
    for (const statement of result.stdout
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await db.$executeRawUnsafe(statement);
  } finally {
    await db.$disconnect();
  }
};
