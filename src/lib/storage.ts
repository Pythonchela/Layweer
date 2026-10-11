import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
const root =
  process.env.DOCUMENT_STORAGE_DIR ||
  path.join(process.cwd(), ".data", "documents");
function key() {
  const k = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!k || !/^[a-f0-9]{64}$/i.test(k))
    throw new Error("Document encryption key is not configured");
  return Buffer.from(k, "hex");
}
export async function storeFile(bytes: Buffer) {
  const name = randomBytes(24).toString("hex");
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, name),
    Buffer.concat([iv, cipher.getAuthTag(), encrypted]),
  );
  return name;
}
export async function readFileBytes(name: string) {
  if (!/^[a-f0-9]{48}$/.test(name)) throw new Error("Invalid stored file");
  const data = await readFile(path.join(root, name));
  const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}
export function encryptBackup(bytes: Buffer) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([
    Buffer.from("LFBK1\0"),
    iv,
    cipher.getAuthTag(),
    encrypted,
  ]);
}
