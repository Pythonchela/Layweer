import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE, sessionHash } from "@/lib/auth";
import { validOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!validOrigin(req))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const token = req.cookies.get(COOKIE)?.value;
  if (token)
    await prisma.session.deleteMany({ where: { token: sessionHash(token) } });
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  return response;
}
