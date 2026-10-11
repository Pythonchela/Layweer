# LexFirm Pro

Law firm website with a database-backed admin workspace and client portal. The admin includes clients, cases, hearings, staff, documents, billing, tasks, reports and account security.

See [ADMIN-IMPLEMENTATION.md](ADMIN-IMPLEMENTATION.md) for implemented features, provider configuration, backup recovery and verification boundaries. [REQUIREMENTS-AUDIT.md](REQUIREMENTS-AUDIT.md) records the original project audit, before these changes.

See [SECURITY-HARDENING.md](SECURITY-HARDENING.md) for the security fixes, verification and production configuration. [ROLE-STRUCTURE-REVIEW.md](ROLE-STRUCTURE-REVIEW.md) preserves the earlier findings and remaining application structure gaps.

For Hostinger Business/Cloud hosting, see [HOSTINGER-DEPLOYMENT.md](HOSTINGER-DEPLOYMENT.md). Local development uses SQLite; deployment supports MySQL with a private persistent document directory.

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

## MySQL deployment

Set `DATABASE_URL` in the hosting environment to `mysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/DATABASE`. On Hostinger, use the local database host `127.0.0.1`. Keep credentials out of this repository. Set `APP_ORIGIN` to the actual HTTPS origin and configure `DOCUMENT_STORAGE_DIR` outside managed deployment/public folders, with a private `DOCUMENT_ENCRYPTION_KEY`.

`npm run build` selects and generates the Prisma client for the configured provider. For MySQL, it first applies committed migrations with `prisma migrate deploy`, then builds Next.js. It never seeds demo users or resets the live database. Keep the database variable available during both installation/build and runtime. Existing accounts must be imported or securely provisioned separately before real sign-in can work.

The generated MySQL schema is in `prisma/mysql/schema.prisma`; change models in the canonical `prisma/schema.prisma`, regenerate with `node -e "require('./scripts/database-schema.cjs').writeMysqlSchema()"`, and commit a corresponding MySQL migration. Never edit an already applied migration. Local SQLite schema changes still use `npm run db:push`.

Run `npm run db:check` to check all tables, or `node scripts/check-database.cjs --write-probe` to verify transactional create/read/update, relations, Unicode text and billing without leaving test records. These checks require a client generated for the selected provider.

Restore an encrypted backup to an empty MySQL database in an isolated checkout configured for that database:

```text
npm run db:generate
node scripts/restore-backup.cjs backup.lfbackup new-recovery-directory --mysql
```

The restore refuses databases with existing records or unrelated tables. Keep the original encryption key and set `DOCUMENT_STORAGE_DIR` to the restored documents directory. Without `--mysql`, restoration creates a new SQLite file and requires a SQLite-generated client. Do not regenerate the client's provider inside a running application's checkout.
