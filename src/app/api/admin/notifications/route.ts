import { NextRequest, NextResponse } from "next/server";
import { authorize, ApiError } from "@/lib/admin";
import { audit } from "@/lib/auth";
import { processReminders } from "@/lib/notifications";
export async function POST(req: NextRequest) {
  try {
    const user = await authorize(req, "calendar:write");
    if (user.role !== "SUPER_ADMIN")
      throw new ApiError(
        "Only the super administrator can send external reminders",
        403,
      );
    const result = await processReminders();
    await audit(user.id, "PROCESS_REMINDERS", "Reminder");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 503 },
    );
  }
}
