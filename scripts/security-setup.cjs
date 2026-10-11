const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
loadEnvConfig(process.cwd());
async function main() {
  const db = new PrismaClient();
  try {
    const key =
      process.env.AUTH_ENCRYPTION_KEY || process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!/^[a-f0-9]{64}$/i.test(key || ""))
      throw new Error("Configure a valid encryption key first");
    let protectedSecrets = 0,
      temporaryAccounts = 0;
    for (const user of await db.user.findMany()) {
      const data = {};
      if (user.twoFASecret && !user.twoFASecret.startsWith("enc1:")) {
        const iv = crypto.randomBytes(12),
          cipher = crypto.createCipheriv(
            "aes-256-gcm",
            Buffer.from(key, "hex"),
            iv,
          );
        const bytes = Buffer.concat([
          cipher.update(user.twoFASecret, "utf8"),
          cipher.final(),
        ]);
        data.twoFASecret =
          "enc1:" +
          Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64");
        protectedSecrets++;
      }
      for (const password of ["Admin@123", "Advocate@123", "Client@123"]) {
        if (await bcrypt.compare(password, user.password)) {
          data.mustChangePassword = true;
          temporaryAccounts++;
          break;
        }
      }
      if (Object.keys(data).length) {
        await db.user.update({ where: { id: user.id }, data });
        await db.session.deleteMany({ where: { userId: user.id } });
      }
    }
    console.log(
      `Encrypted ${protectedSecrets} authenticator secrets; marked ${temporaryAccounts} demo-password accounts for password replacement. Passwords were preserved.`,
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
