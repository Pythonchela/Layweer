import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser, hasPermission, audit } from "@/lib/auth";
import { scope } from "@/lib/admin";
import { readFileBytes } from "@/lib/storage";
export const runtime = "nodejs";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(req);
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (user.mustChangePassword || user.mustEnable2FA)
    return NextResponse.json(
      { error: "Change your temporary password first" },
      { status: 403 },
    );
  const { id } = await params;
  const where =
    user.role === "CLIENT"
      ? {
          AND: [
            { id },
            {
              OR: [
                { clientId: user.client?.id || "__none__" },
                { case: { clientId: user.client?.id || "__none__" } },
              ],
            },
            { isPublic: true },
          ],
        }
      : { AND: [{ id }, scope("documents", user)] };
  let document =
    hasPermission(user.role, "documents:read") || user.role === "CLIENT"
      ? await prisma.document.findFirst({ where })
      : null;
  const employeeFile =
    !document && hasPermission(user.role, "employees:sensitive")
      ? await prisma.employeeDocument.findUnique({ where: { id } })
      : null;
  if (!document && !employeeFile)
    return NextResponse.json(
      { error: "File not found or not accessible" },
      { status: 404 },
    );
  try {
    const version = req.nextUrl.searchParams.get("version");
    let fileUrl = document?.fileUrl || employeeFile!.url;
    if (version && document) {
      if (user.role === "CLIENT")
        return NextResponse.json(
          { error: "Historical versions are restricted to staff" },
          { status: 403 },
        );
      const old = await prisma.documentVersion.findFirst({
        where: { documentId: id, version: Number(version) },
      });
      if (!old)
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 },
        );
      fileUrl = old.fileUrl;
    }
    const bytes = await readFileBytes(fileUrl);
    await audit(user.id, "DOWNLOAD", "Document", id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": version
          ? "application/octet-stream"
          : document?.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document?.fileName || employeeFile!.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Stored file could not be read" },
      { status: 404 },
    );
  }
}
