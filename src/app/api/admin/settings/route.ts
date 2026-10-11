import { readJson } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, ApiError } from "@/lib/admin";
import { audit, ROLE_PERMISSIONS } from "@/lib/auth";
const allowed = [
  "firmName",
  "firmEmail",
  "firmPhone",
  "firmAddress",
  "gstNumber",
  "notificationEmail",
  "whatsappEnabled",
  "smsEnabled",
];
export async function GET(req: NextRequest) {
  try {
    await authorize(req, "settings:read");
    const settings = await prisma.firmSetting.findMany();
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      logs,
      roles: ROLE_PERMISSIONS,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 500 },
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await authorize(req, "settings:write"),
      body = await readJson(req);
    await prisma.$transaction(
      allowed
        .filter((k) => k in body)
        .map((key) =>
          prisma.firmSetting.upsert({
            where: { key },
            create: { key, value: String(body[key]).slice(0, 10000) },
            update: { value: String(body[key]).slice(0, 10000) },
          }),
        ),
    );
    await audit(user.id, "UPDATE", "FirmSetting");
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 400 },
    );
  }
}
