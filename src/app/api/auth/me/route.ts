import { NextRequest, NextResponse } from "next/server";
import { currentUser, ROLE_PERMISSIONS } from "@/lib/auth";
export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFAEnabled: user.twoFAEnabled,
      mustChangePassword: user.mustChangePassword,
      mustEnable2FA: user.mustEnable2FA,
    },
    permissions: ROLE_PERMISSIONS[user.role] || [],
  });
}
