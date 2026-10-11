import { NextRequest, NextResponse } from "next/server";
export function middleware(req: NextRequest) {
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))),
  );
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com ${dev ? "'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://*.razorpay.com",
    `connect-src 'self' https://*.razorpay.com https://*.rzp.io ${dev ? "ws://localhost:* ws://127.0.0.1:*" : ""}`,
    "frame-src https://*.razorpay.com https://*.rzp.io",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (
    req.nextUrl.pathname.startsWith("/api/") ||
    /^\/(admin|portal|account|login)(\/|$)/.test(req.nextUrl.pathname)
  )
    response.headers.set("Cache-Control", "private, no-store");
  if (process.env.APP_ORIGIN?.startsWith("https://"))
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
