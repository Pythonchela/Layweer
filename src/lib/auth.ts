import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { passwordError, clientAddress } from "./security";
export type UserRole = string;
export const COOKIE = "lexfirm_session";
export const hashPassword = (password: string) => {
  const error = passwordError(password);
  if (error) throw new Error(error);
  return bcrypt.hash(password, 12);
};
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
export const sessionHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function privileged2FARequired(role: string) {
  const required =
    process.env.REQUIRE_PRIVILEGED_2FA === "true" ||
    (process.env.NODE_ENV === "production" &&
      !!process.env.APP_ORIGIN &&
      !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(
        process.env.APP_ORIGIN,
      ));
  return (
    required &&
    [
      "SUPER_ADMIN",
      "SENIOR_ADVOCATE",
      "ACCOUNTANT",
      "HR_ADMIN",
      "OFFICE_MANAGER",
      "IT_ADMIN",
    ].includes(role)
  );
}
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  SENIOR_ADVOCATE: [
    "dashboard:read",
    "cases:read",
    "cases:write",
    "clients:read",
    "clients:write",
    "employees:read",
    "billing:read",
    "billing:write",
    "reports:read",
    "tasks:read",
    "tasks:write",
    "calendar:read",
    "calendar:write",
    "documents:read",
    "documents:write",
    "leads:read",
    "leads:write",
    "appointments:read",
    "appointments:write",
  ],
  ADVOCATE: [
    "dashboard:read",
    "cases:read",
    "cases:write",
    "clients:read",
    "tasks:read",
    "tasks:write",
    "calendar:read",
    "calendar:write",
    "documents:read",
    "documents:write",
    "appointments:read",
  ],
  JUNIOR_ADVOCATE: [
    "dashboard:read",
    "cases:read",
    "clients:read",
    "tasks:read",
    "tasks:write",
    "calendar:read",
    "documents:read",
    "documents:write",
  ],
  ASSOCIATE: [
    "dashboard:read",
    "cases:read",
    "clients:read",
    "tasks:read",
    "documents:read",
  ],
  LEGAL_ASSISTANT: [
    "dashboard:read",
    "cases:read",
    "tasks:read",
    "documents:read",
    "documents:write",
  ],
  CLERK: [
    "dashboard:read",
    "cases:read",
    "calendar:read",
    "calendar:write",
    "documents:read",
    "documents:write",
    "tasks:read",
  ],
  TYPIST: ["dashboard:read", "documents:read", "documents:write"],
  ACCOUNTANT: [
    "dashboard:read",
    "billing:read",
    "billing:write",
    "reports:read",
  ],
  RECEPTIONIST: [
    "dashboard:read",
    "clients:read",
    "clients:write",
    "leads:read",
    "leads:write",
    "appointments:read",
    "appointments:write",
  ],
  OFFICE_MANAGER: [
    "dashboard:read",
    "employees:read",
    "employees:write",
    "employees:sensitive",
    "reports:read",
    "tasks:read",
    "tasks:write",
  ],
  HR_ADMIN: [
    "dashboard:read",
    "employees:read",
    "employees:write",
    "employees:sensitive",
    "reports:read",
  ],
  IT_ADMIN: ["dashboard:read", "settings:read", "settings:write"],
  CLIENT: ["portal:read"],
};
export const hasPermission = (role: string, permission: string) =>
  Object.hasOwn(ROLE_PERMISSIONS, role) &&
  ROLE_PERMISSIONS[role].some((p) => p === "*" || p === permission);
export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: sessionHash(token) },
    include: { user: { include: { employee: true, client: true } } },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    !Object.hasOwn(ROLE_PERMISSIONS, session.user.role) ||
    session.user.client?.isActive === false ||
    session.user.employee?.isActive === false
  )
    return null;
  const { password, twoFASecret, ...user } = session.user;
  return {
    ...user,
    mustEnable2FA: privileged2FARequired(user.role) && !user.twoFAEnabled,
  };
}
export async function currentUser(req?: NextRequest) {
  const token = req
    ? req.cookies.get(COOKIE)?.value
    : (await cookies()).get(COOKIE)?.value;
  return getUserFromToken(token);
}
export async function createSession(userId: string, req: NextRequest) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      token: sessionHash(token),
      expiresAt: new Date(Date.now() + 28800000),
      ipAddress: clientAddress(req),
      userAgent: req.headers.get("user-agent"),
    },
  });
  return token;
}
export async function audit(
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
) {
  await prisma.auditLog.create({ data: { userId, action, entity, entityId } });
}
