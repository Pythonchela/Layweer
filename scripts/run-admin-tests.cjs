const fs = require("node:fs"),
  path = require("node:path"),
  net = require("node:net");
const { spawn } = require("node:child_process");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
async function main() {
  const occupied = await new Promise((resolve) => {
    const socket = net.connect(3101, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
  if (occupied)
    throw new Error(
      "Port 3101 is in use. Stop the test server before running the test suite.",
    );
  const root = path.resolve(".data"),
    file = path.join(root, "admin-test.db");
  fs.mkdirSync(root, { recursive: true });
  if (fs.existsSync(file))
    fs.renameSync(file, path.join(root, `admin-test-${Date.now()}.db`));
  const databaseUrl = "file:" + file.replaceAll("\\", "/");
  await require("./create-database.cjs")(databaseUrl);
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  await db.user.create({
    data: {
      email: "admin@test.invalid",
      name: "Test administrator",
      role: "SUPER_ADMIN",
      password: await bcrypt.hash("TestOnly@12345", 12),
    },
  });
  await db.$disconnect();
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DOCUMENT_STORAGE_DIR: path.join(root, "test-documents"),
    NEXT_DIST_DIR: ".next-test",
    RAZORPAY_KEY_ID: "",
    RAZORPAY_KEY_SECRET: "",
    RAZORPAY_WEBHOOK_SECRET: "",
    NOTIFICATIONS_ENABLED: "false",
    // Isolate provider/origin policy from the owner's deployment configuration.
    APP_ORIGIN: "http://localhost:3101",
    REQUIRE_PRIVILEGED_2FA: "false",
    TRUST_PROXY: "false",
  };
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "-p", "3101", "-H", "127.0.0.1"],
    { env, stdio: ["ignore", "ignore", "inherit"] },
  );
  try {
    let ready = false;
    for (let n = 0; n < 90; n++) {
      try {
        const r = await fetch("http://localhost:3101/api/auth/me");
        if (r.status === 401) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) throw new Error("Test server did not start");
    const child = spawn(
      process.execPath,
      [
        process.argv.includes("--security")
          ? "scripts/admin-security-test.cjs"
          : "scripts/admin-integration-test.cjs",
      ],
      { env, stdio: "inherit" },
    );
    const code = await new Promise((resolve) => child.once("exit", resolve));
    if (code) process.exitCode = code;
  } finally {
    if (process.platform === "win32")
      require("node:child_process").spawnSync(
        "taskkill",
        ["/PID", String(server.pid), "/T", "/F"],
        { stdio: "ignore" },
      );
    else server.kill();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
