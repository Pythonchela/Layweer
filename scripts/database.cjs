const { loadEnvConfig } = require("@next/env");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const action = process.argv[2] || "setup";
async function main() {
  if (!fs.existsSync(".env.local") && action === "setup") {
    let env = fs
      .readFileSync(".env.example", "utf8")
      .replace(
        "generate-a-64-character-random-hex-key",
        crypto.randomBytes(32).toString("hex"),
      );
    fs.writeFileSync(".env.local", env);
  }
  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (["setup", "push"].includes(action) && url?.startsWith("file:")) {
    const name = url.slice(5),
      file = path.isAbsolute(name) ? name : path.resolve("prisma", name);
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await require("./create-database.cjs")(
        "file:" + file.replaceAll("\\", "/"),
      );
    }
  }
  function run(args) {
    const result = spawnSync(
      process.execPath,
      [require.resolve("prisma/build/index.js"), ...args],
      { stdio: "inherit", env: process.env },
    );
    if (result.status) throw new Error("Database command failed");
  }
  function seed() {
    const result = spawnSync(process.execPath, ["prisma/seed.js"], {
      stdio: "inherit",
      env: process.env,
    });
    if (result.status) throw new Error("Seed failed");
  }
  if (action === "setup") {
    run(["db", "push"]);
    seed();
    const security = spawnSync(process.execPath, ["scripts/security-setup.cjs"], { stdio: "inherit", env: process.env });
    if (security.status) throw new Error("Security setup failed");
  } else if (action === "seed") seed();
  else if (action === "generate") run(["generate"]);
  else if (action === "push") run(["db", "push"]);
  else if (action === "studio") run(["studio"]);
  else if (action === "migrate") run(["migrate", "dev"]);
  else if (action === "reset") {
    if (!process.argv.includes("--confirm-delete-all-data"))
      throw new Error("Reset requires --confirm-delete-all-data");
    run(["db", "push", "--force-reset"]);
  } else throw new Error("Unknown database command");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
