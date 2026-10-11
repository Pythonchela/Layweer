export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const configureHostingerRuntime = (await import("../scripts/hostinger-runtime.cjs")).default;
    configureHostingerRuntime();
  }
}
