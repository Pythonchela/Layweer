import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorize, ApiError, delegate } from "@/lib/admin";
import { audit } from "@/lib/auth";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { gzipSync } from "zlib";
import { encryptBackup } from "@/lib/storage";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const user = await authorize(req, "settings:read");
    if (user.role !== "SUPER_ADMIN")
      throw new ApiError(
        "Only the super administrator can export a backup",
        403,
      );
    const records = await prisma.$transaction(async (tx) => {
      const result: any = {};
      for (const model of Prisma.dmmf.datamodel.models) {
        if (["Session", "AuthThrottle"].includes(model.name)) continue;
        result[model.name] = await delegate(model.name, tx).findMany();
      }
      return result;
    });
    const dir =
        process.env.DOCUMENT_STORAGE_DIR ||
        path.join(process.cwd(), ".data", "documents"),
      files: any = {};
    try {
      for (const name of await readdir(dir)) {
        if (/^[a-f0-9]{48}$/.test(name))
          files[name] = (await readFile(path.join(dir, name))).toString(
            "base64",
          );
      }
    } catch (e) {
      if ((e as any).code !== "ENOENT") throw e;
    }
    await audit(user.id, "BACKUP", "Database");
    const bytes = encryptBackup(
      gzipSync(
        JSON.stringify({ version: 1, createdAt: new Date(), records, files }),
      ),
    );
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=lexfirm-backup.lfbackup",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 500 },
    );
  }
}
