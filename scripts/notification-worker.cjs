const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const ts = require("typescript"),
  fs = require("fs"),
  path = require("path");
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
const { processReminders } = require(path.resolve("src/lib/notifications.ts"));
if (process.env.NOTIFICATIONS_ENABLED !== "true")
  throw new Error(
    "Notifications are disabled. Configure provider credentials and set NOTIFICATIONS_ENABLED=true before starting this worker.",
  );
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    const result = await processReminders();
    if (result.submitted || result.skipped)
      console.log(new Date().toISOString(), result);
  } catch (e) {
    console.error(e.message);
  } finally {
    running = false;
  }
}
void tick();
setInterval(tick, 60000);
