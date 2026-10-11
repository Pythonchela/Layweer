import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
let configuredUrl = databaseUrl;
if (databaseUrl?.startsWith("mysql://")) {
  const url = new URL(databaseUrl);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  configuredUrl = url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(configuredUrl ? { datasources: { db: { url: configuredUrl } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
