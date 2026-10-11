const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

module.exports = function configureHostingerRuntime() {
  if (process.platform !== "linux") return;
  const managed = Boolean(process.env.LSNODE_SOCKET) || /\/domains\/[^/]+\/hbuilds\//.test(process.cwd());
  if (!managed && !process.env.HOSTINGER_CPU_LIMIT) return;
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
