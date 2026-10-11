# LexFirm Pro

Law firm website with a database-backed admin workspace and client portal. The admin includes clients, cases, hearings, staff, documents, billing, tasks, reports and account security.

See [ADMIN-IMPLEMENTATION.md](ADMIN-IMPLEMENTATION.md) for implemented features, provider configuration, backup recovery and verification boundaries. [REQUIREMENTS-AUDIT.md](REQUIREMENTS-AUDIT.md) records the original project audit, before these changes.

See [SECURITY-HARDENING.md](SECURITY-HARDENING.md) for the security fixes, verification and production configuration. [ROLE-STRUCTURE-REVIEW.md](ROLE-STRUCTURE-REVIEW.md) preserves the earlier findings and remaining application structure gaps.

For Hostinger Business/Cloud hosting, see [HOSTINGER-DEPLOYMENT.md](HOSTINGER-DEPLOYMENT.md). The current local SQLite/private-file configuration needs production database and persistent-storage preparation before managed deployment.

## Start locally

From this project folder:

```powershell
npm install
npm run db:setup
npm run dev
```

Open [the login page](http://localhost:3000/login). Existing seeded administrator, before its owner changes the password: `admin@lexfirm.com` / `Admin@123`. The first local sign-in requires a unique password of at least 8 characters before opening firm records. Once saved, this password-replacement requirement clears. Use your saved password for subsequent sign-ins. Authenticator setup is optional in the current local testing configuration and required for privileged accounts on a configured remote production deployment. Known demo passwords are refused on a configured remote deployment.

Setup loads `.env.local` and preserves existing accounts and the document encryption key. The existing database is `prisma/prisma/dev.db`; copies before the admin and security changes are `before-admin-update.db` and `before-security-update.db` in that directory. Protect these copies because they contain firm records. After upgrading an existing installation, run `npm run db:push` and `npm run security:setup` to apply the schema and migrate authenticator secrets/temporary-password flags.

## Verify

```powershell
npm run lint
npm run test:admin
npm run test:security
npm run build
```

The suites use an isolated database and port 3101. Keep this port free while testing, and run the test suites and production build sequentially because Next.js regenerates shared type references. Online payments and external messages need provider credentials; they are disabled in the current local configuration. Production deployment and live provider operation require separate verification.
