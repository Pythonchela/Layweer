import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, ApiError, scope } from "@/lib/admin";
export async function GET(req: NextRequest) {
  try {
    const user = await authorize(req, "calendar:read");
    const from = new Date(req.nextUrl.searchParams.get("from") || ""),
      to = new Date(req.nextUrl.searchParams.get("to") || "");
    if (
      !Number.isFinite(from.getTime()) ||
      !Number.isFinite(to.getTime()) ||
      to <= from ||
      to.getTime() - from.getTime() > 35 * 86400000
    )
      throw new ApiError("Invalid calendar range");
    const records = await prisma.hearing.findMany({
      where: {
        AND: [scope("calendar", user), { hearingDate: { gte: from, lt: to } }],
      },
      include: {
        case: {
          select: {
            caseId: true,
            title: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { hearingDate: "asc" },
    });
    return NextResponse.json({ records });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 500 },
    );
  }
}
