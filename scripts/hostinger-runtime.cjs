const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

module.exports = function configureHostingerRuntime() {
  if (process.platform !== "linux") return;
  const managed = Boolean(process.env.LSNODE_SOCKET) || /\/domains\/[^/]+\/hbuilds\//.test(process.cwd());
  if (!managed && !process.env.HOSTINGER_CPU_LIMIT) return;
  // Managed workers can retain hPanel's previous environment after a restart.
  // Migrated encryption keys and document paths must survive that and rebuilds.
  const deployment = process.cwd().match(/^(.*\/domains\/([^/]+)\/hbuilds)\//);
  const domain = deployment?.[2];
  if (domain) {
    // Refresh public site origins from the managed configuration: restarting a
    // worker can otherwise retain the platform's older environment values.
    const siteConfig = path.join(deployment[1], "config", ".env");
    if (fs.existsSync(siteConfig)) {
      const stat = fs.lstatSync(siteConfig);
      if (!stat.isFile() || stat.uid !== process.getuid() || (stat.mode & 0o077))
        throw new Error("Managed site settings must be an owner-only private file");
      for (const key of ["APP_ORIGIN", "APP_ALLOWED_ORIGINS", "REQUIRE_PRIVILEGED_2FA"]) {
        const match = fs.readFileSync(siteConfig, "utf8").match(new RegExp("^" + key + "=(.*)$", "m"));
        if (match) process.env[key] = match[1].trim().replace(/^(['"])(.*)\1$/, "$2");
      }
    }
    const privateRoot = path.join(os.homedir(), ".config", "layweer", domain);
    const settingsFile = path.join(privateRoot, "data.json");
    if (fs.existsSync(settingsFile)) {
      const stat = fs.lstatSync(settingsFile);
      if (!stat.isFile() || stat.uid !== process.getuid() || (stat.mode & 0o077))
        throw new Error("Migrated data settings must be an owner-only private file");
      const settings = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
      if (!/^[a-f0-9]{64}$/i.test(settings.DOCUMENT_ENCRYPTION_KEY || "") ||
          (settings.AUTH_ENCRYPTION_KEY && !/^[a-f0-9]{64}$/i.test(settings.AUTH_ENCRYPTION_KEY)))
        throw new Error("Migrated encryption settings are invalid");
      const storage = settings.DOCUMENT_STORAGE_DIR;
      if (typeof storage !== "string" || !path.isAbsolute(storage) ||
          !path.resolve(storage).startsWith(privateRoot + path.sep))
        throw new Error("Migrated document storage must be inside the private data directory");
      process.env.DOCUMENT_ENCRYPTION_KEY = settings.DOCUMENT_ENCRYPTION_KEY;
      process.env.AUTH_ENCRYPTION_KEY = settings.AUTH_ENCRYPTION_KEY || "";
      process.env.DOCUMENT_STORAGE_DIR = path.resolve(storage);
    }
  }
  const limit = Number(process.env.HOSTINGER_CPU_LIMIT || 2);
  if (!Number.isInteger(limit) || limit < 1 || limit > 4)
    throw new Error("HOSTINGER_CPU_LIMIT must be an integer from 1 to 4");
  process.env.TOKIO_WORKER_THREADS ||= String(limit);
  process.env.RAYON_NUM_THREADS ||= String(limit);
  try {
    // Prisma's Node-API runtime sizes a native thread pool using CPU affinity.
    // Shared hosting can expose many host CPUs while allowing few user threads.
    const allowed = fs.readFileSync("/proc/self/status", "utf8").match(/^Cpus_allowed_list:\s*(.+)$/m)?.[1];
    if (!allowed) throw new Error("Cannot read the process CPU affinity");
    const cpus = [];
    for (const part of allowed.split(",")) {
      const [start, end = start] = part.split("-").map(Number);
      for (let cpu = start; cpu <= end && cpus.length < limit; cpu++) cpus.push(cpu);
      if (cpus.length === limit) break;
    }
    if (!cpus.length) throw new Error("No CPUs available to the app");
    execFileSync("/usr/bin/taskset", ["-apc", cpus.join(","), String(process.pid)], { stdio: "ignore" });
  } catch {
    console.warn("Hostinger CPU affinity could not be configured; check the platform's thread limits before launch.");
  }
};
