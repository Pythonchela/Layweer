import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE,
  createSession,
  verifyPassword,
  audit,
  ROLE_PERMISSIONS,
  privileged2FARequired,
} from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import bcrypt from "bcryptjs";
import {
  validOrigin,
  clientAddress,
  consumeLimit,
  throttleKey,
  revealSecret,
} from "@/lib/security";
export const runtime = "nodejs";
const dummyHash = bcrypt.hashSync("NonAccountTimingPlaceholder@12345", 12);
export async function POST(req: NextRequest) {
  try {
    if (!validOrigin(req))
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length") || 0) > 8192)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const body = await readJson(req, 8192);
    if (
      typeof body.email !== "string" ||
      body.email.length > 254 ||
      typeof body.password !== "string" ||
      Buffer.byteLength(body.password, "utf8") > 72
    )
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    const email = body.email.trim().toLowerCase();
    const key = throttleKey("login-account", email);
    if (
      !(await consumeLimit(
        throttleKey("login-address", clientAddress(req)),
        100,
      )) ||
      !(await consumeLimit(key, 8))
    )
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: true, employee: true },
    });
    const passwordValid = await verifyPassword(
      body.password,
      user?.password || dummyHash,
    );
    const unsafeRemoteDemo =
      user?.mustChangePassword &&
      ["Admin@123", "Advocate@123", "Client@123"].includes(body.password) &&
      !["localhost", "127.0.0.1", "[::1]"].includes(
        process.env.APP_ORIGIN
          ? new URL(process.env.APP_ORIGIN).hostname
          : req.nextUrl.hostname,
      );
    const valid =
      user &&
      !unsafeRemoteDemo &&
      Object.hasOwn(ROLE_PERMISSIONS, user.role) &&
      user.isActive &&
      user.client?.isActive !== false &&
      user.employee?.isActive !== false &&
      passwordValid;
    if (
      !valid ||
      (user.twoFAEnabled &&
        !verifyTotp(revealSecret(user.twoFASecret), String(body.code || "")))
    ) {
      if (user) await audit(user.id, "LOGIN_FAILED", "User", user.id);
      return NextResponse.json(
        {
          error:
            valid && user.twoFAEnabled
              ? "Enter a valid authenticator code"
              : "Invalid email or password",
        },
        { status: 401 },
      );
    }
    await prisma.authThrottle.deleteMany({ where: { key } });
    const token = await createSession(user.id, req);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await audit(user.id, "LOGIN", "User", user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        mustEnable2FA: privileged2FARequired(user.role) && !user.twoFAEnabled,
      },
    });
    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 28800,
    });
    return response;
  } catch (e) {
    console.error("Login failed", e);
    return NextResponse.json(
      { error: "Login unavailable. Check the database setup." },
      { status: 503 },
    );
  }
}
