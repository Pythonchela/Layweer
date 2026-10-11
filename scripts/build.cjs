const { spawnSync } = require("node:child_process");
require("@next/env").loadEnvConfig(process.cwd());
require("./hostinger-runtime.cjs")();

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

// Generate for the configured provider on the build server, including Linux engines.
run(["scripts/database.cjs", "generate"]);
// Apply reviewed, committed migrations; never reset or seed live demo accounts.
if (process.env.DATABASE_URL?.startsWith("mysql://")) run(["scripts/database.cjs", "deploy"]);
run([require.resolve("next/dist/bin/next"), "build"]);
