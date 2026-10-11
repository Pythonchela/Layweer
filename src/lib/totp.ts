import { createHmac, randomBytes, timingSafeEqual } from "crypto";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function totpSecret() {
  let bits = "";
  for (const b of randomBytes(20)) bits += b.toString(2).padStart(8, "0");
  return bits
    .match(/.{5}/g)!
    .map((b) => alphabet[parseInt(b, 2)])
    .join("");
}
export function totpCode(
  secret: string,
  counter = Math.floor(Date.now() / 30000),
) {
  const bits = secret
    .split("")
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(
    (bits.match(/.{8}/g) || []).map((b) => parseInt(b, 2)),
  );
  const time = Buffer.alloc(8);
  time.writeBigUInt64BE(BigInt(counter));
  const hash = createHmac("sha1", key).update(time).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export function verifyTotp(secret: string, code: string) {
  return (
    !!secret &&
    /^\d{6}$/.test(code) &&
    [-1, 0, 1].some((o) =>
      timingSafeEqual(
        Buffer.from(totpCode(secret, Math.floor(Date.now() / 30000) + o)),
        Buffer.from(code),
      ),
    )
  );
}
