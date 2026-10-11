import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  authorize,
  checkRelations,
  cleanData,
  scope,
} from "@/lib/admin";
import { storeFile } from "@/lib/storage";
import { queueClientMessage } from "@/lib/notifications";
import { currentUser } from "@/lib/auth";
import {
  validOrigin,
  consumeLimit,
  throttleKey,
  boundedBody,
} from "@/lib/security";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const actor = await currentUser(req);
    if (!actor) throw new ApiError("Please sign in", 401);
    if (actor.mustChangePassword || actor.mustEnable2FA || !validOrigin(req))
      throw new ApiError(
        "Change your temporary password or check request origin",
        403,
      );
    if (!(await consumeLimit(throttleKey("file-upload", actor.id), 30, 60000)))
      throw new ApiError("Too many uploads. Try again shortly.", 429);
    const bytes = await boundedBody(req, 21 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const module =
      form.get("module") === "employeeDocuments"
        ? "employeeDocuments"
        : "documents";
    const user = await authorize(
      req,
      module === "documents" ? "documents:write" : "employees:write",
    );
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024)
      throw new ApiError("Choose a file between 1 byte and 20 MB");
    const permitted = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!permitted.includes(file.type))
      throw new ApiError(
        "Unsupported file type. Use PDF, an image, a Word document, text, MP3/WAV or MP4.",
      );
    const body: any = Object.fromEntries(form.entries());
    body.isPublic = form.get("isPublic") === "true";
    const data = cleanData(module, body);
    data.name = data.name || file.name;
    await checkRelations(module, data, user);
    if (module === "documents" && !data.caseId && !data.clientId)
      throw new ApiError("Link the document to a case or client");
    const previous = body.id
      ? await prisma.document.findFirst({
          where: { AND: [{ id: String(body.id) }, scope("documents", user)] },
        })
      : null;
    if (body.id && !previous) throw new ApiError("Document not found", 404);
    if (
      module === "documents" &&
      (data.isPublic || previous?.isPublic) &&
      !["SUPER_ADMIN", "SENIOR_ADVOCATE"].includes(user.role)
    )
      throw new ApiError(
        "Only a supervising advocate or super administrator can publish client-shared documents",
        403,
      );
    const storageName = await storeFile(Buffer.from(await file.arrayBuffer()));
    const record = await prisma.$transaction(async (tx) => {
      let saved;
      if (module === "employeeDocuments")
        saved = await tx.employeeDocument.create({
          data: { ...data, url: storageName },
        });
      else if (previous) {
        if (
          data.caseId !== previous.caseId ||
          data.clientId !== previous.clientId
        )
          throw new ApiError(
            "A new version must retain the original case/client links",
          );
        await tx.documentVersion.create({
          data: {
            documentId: previous.id,
            version: previous.version,
            fileUrl: previous.fileUrl,
            uploadedBy: previous.uploadedBy,
          },
        });
        saved = await tx.document.update({
          where: { id: previous.id },
          data: {
            ...data,
            fileName: file.name,
            fileUrl: storageName,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: user.id,
            version: { increment: 1 },
          },
        });
      } else
        saved = await tx.document.create({
          data: {
            ...data,
            fileName: file.name,
            fileUrl: storageName,
            fileSize: file.size,
            mimeType: file.type,
            uploadedBy: user.id,
          },
        });
      if (module === "documents" && data.isPublic) {
        const client = data.clientId
          ? await tx.client.findUnique({ where: { id: data.clientId } })
          : await tx.client.findFirst({
              where: { cases: { some: { id: data.caseId || "__none__" } } },
            });
        if (client?.userId)
          await tx.notification.create({
            data: {
              userId: client.userId,
              title: "Document uploaded",
              message: data.name,
              link: "/portal",
            },
          });
        await queueClientMessage(
          tx,
          client,
          `New document uploaded: ${data.name}`,
          data.caseId,
        );
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: previous ? "NEW_VERSION" : "UPLOAD",
          entity: module,
          entityId: saved.id,
        },
      });
      return saved;
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: e instanceof ApiError ? e.status : 400 },
    );
  }
}
