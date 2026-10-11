import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  currentUser,
  verifyPassword,
  hashPassword,
  sessionHash,
  COOKIE,
  audit,
  privileged2FARequired,
} from "@/lib/auth";
import { totpSecret, verifyTotp } from "@/lib/totp";
import {
  validOrigin,
  consumeLimit,
  throttleKey,
  protectSecret,
  revealSecret,
} from "@/lib/security";
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const token = sessionHash(req.cookies.get(COOKIE)?.value || "");
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
      token: true,
    },
  });
  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    email: user.email,
    workspacePath: user.role === "CLIENT" ? "/portal" : "/admin/dashboard",
    twoFARequired: privileged2FARequired(user.role),
    twoFAEnabled: user.twoFAEnabled,
    mustChangePassword: user.mustChangePassword,
    mustEnable2FA: user.mustEnable2FA,
    sessions: sessions.map(({ token: hash, ...s }) => ({
      ...s,
      current: hash === token,
    })),
    logs,
  });
}
export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!validOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await consumeLimit(throttleKey("security-action", user.id), 20)))
    return NextResponse.json(
      { error: "Too many security attempts. Try again later." },
      { status: 429 },
    );
  try {
    const body = await readJson(req),
      account = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (body.action === "revoke") {
      await prisma.session.deleteMany({
        where: { id: String(body.id), userId: user.id },
      });
      await audit(user.id, "REVOKE_SESSION", "Session", body.id);
      return NextResponse.json({ success: true });
    }
    if (account.mustChangePassword && body.action !== "password")
      return NextResponse.json(
        { error: "Replace your temporary password first" },
        { status: 403 },
      );
    if (!(await verifyPassword(String(body.password || ""), account.password)))
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    if (
      account.twoFAEnabled &&
      !verifyTotp(revealSecret(account.twoFASecret), String(body.code || ""))
    )
      return NextResponse.json(
        { error: "Enter a valid authenticator code" },
        { status: 400 },
      );
    if (body.action === "password") {
      if (typeof body.newPassword !== "string")
        throw new Error("Enter a new password");
      if (await verifyPassword(body.newPassword, account.password))
        throw new Error(
          "Choose a new password different from the temporary/current password",
        );
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashPassword(body.newPassword),
          mustChangePassword: false,
        },
      });
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: sessionHash(req.cookies.get(COOKIE)?.value || "") },
        },
      });
      await audit(user.id, "CHANGE_PASSWORD", "User", user.id);
      await prisma.authThrottle.deleteMany({
        where: { key: throttleKey("login-account", user.email) },
      });
    } else if (body.action === "setup2FA") {
      if (account.twoFAEnabled)
        throw new Error("Two-factor authentication is already enabled");
      const secret = totpSecret();
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFASecret: protectSecret(secret) },
      });
      return NextResponse.json({
        secret,
        uri: `otpauth://totp/LexFirm:${encodeURIComponent(user.email)}?secret=${secret}&issuer=LexFirm`,
      });
    } else if (body.action === "enable2FA") {
      if (
        !verifyTotp(revealSecret(account.twoFASecret), String(body.code || ""))
      )
        throw new Error("Invalid authenticator code");
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFAEnabled: true },
      });
      await audit(user.id, "ENABLE_2FA", "User", user.id);
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
          token: { not: sessionHash(req.cookies.get(COOKIE)?.value || "") },
        },
      });
    } else if (body.action === "disable2FA") {
      if (privileged2FARequired(user.role))
        throw new Error(
          "Two-factor authentication is required for privileged accounts on this deployment",
        );
      if (
        !verifyTotp(revealSecret(account.twoFASecret), String(body.code || ""))
      )
        throw new Error("Invalid authenticator code");
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFAEnabled: false, twoFASecret: null },
      });
      await audit(user.id, "DISABLE_2FA", "User", user.id);
    } else throw new Error("Unknown security action");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
