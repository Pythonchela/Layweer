import { NextRequest } from "next/server";
import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { prisma } from "./prisma";
import { allowedRequestOrigin } from "./origins";

export async function boundedBody(req: NextRequest, maxBytes: number) {
  if (Number(req.headers.get("content-length") || 0) > maxBytes)
    throw new Error("Request too large");
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Request too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
export async function readJson(req: NextRequest, maxBytes = 262144) {
  return JSON.parse(new TextDecoder().decode(await boundedBody(req, maxBytes)));
}

export function validOrigin(req: NextRequest) {
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  const origin = req.headers.get("origin");
  return allowedRequestOrigin(
    origin,
    req.nextUrl.origin,
    process.env.APP_ORIGIN,
    process.env.APP_ALLOWED_ORIGINS,
  );
}
export function clientAddress(req: NextRequest) {
  // Trust forwarding headers only when a configured reverse proxy replaces them.
  if (process.env.TRUST_PROXY !== "true") return "local";
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  ).slice(0, 80);
}
export const throttleKey = (purpose: string, identity: string) =>
  `${purpose}:${createHash("sha256").update(identity).digest("hex")}`;
export async function consumeLimit(
  key: string,
  limit: number,
  windowMs = 900000,
) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    await tx.authThrottle.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 86400000) } },
    });
    await tx.authThrottle.upsert({
      where: { key },
      create: { key, count: 0, expiresAt: new Date(now.getTime() + windowMs) },
      update: {},
    });
    await tx.authThrottle.updateMany({
      where: { key, expiresAt: { lte: now } },
      data: { count: 0, expiresAt: new Date(now.getTime() + windowMs) },
    });
    const claimed = await tx.authThrottle.updateMany({
      where: { key, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });
    return claimed.count === 1;
  });
}
export function passwordError(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value, "utf8") > 72
  )
    return "Use a password of at least 8 characters and no more than 72 UTF-8 bytes";
  if (
    [
      "Admin@123",
      "Advocate@123",
      "Client@123",
      "password1234",
      "Password@123",
      "123456789012",
      "password",
      "Password",
      "12345678",
      "qwertyui",
      "Password1",
      "abcd1234",
    ].includes(value)
  )
    return "Choose a unique password rather than a demo or common password";
  return null;
}
function encryptionKey() {
  const key =
    process.env.AUTH_ENCRYPTION_KEY || process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error("Authentication encryption key is not configured");
  return Buffer.from(key, "hex");
}
export function protectSecret(secret: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const bytes = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return (
    "enc1:" + Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64")
  );
}
export function revealSecret(stored: string | null) {
  if (!stored) return "";
  if (!stored.startsWith("enc1:")) return stored; // Existing secrets are migrated by the security setup command.
  const bytes = Buffer.from(stored.slice(5), "base64"),
    decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      bytes.subarray(0, 12),
    );
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([
    decipher.update(bytes.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}
