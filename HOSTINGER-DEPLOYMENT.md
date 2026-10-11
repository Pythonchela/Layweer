# Hostinger deployment plan

Prepared 10 October 2026 for Hostinger Business or Cloud hosting. This is a deployment-readiness plan, not evidence that the app has already been deployed. No existing Hostinger website, domain, database or DNS record was changed.

## Hosting route

Hostinger's managed Node.js Web Apps supports Next.js on Business and Cloud plans. Use **Websites → Add Website → Node.js web app**, with a new staging domain/subdomain initially. Source can be supplied by GitHub or ZIP. Node.js 22 is a supported choice. [Hostinger deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

The chosen production domain is **divinewall.in**. Use one domain for the application:

- `/`: public law firm website
- `/login`: staff/client sign-in
- `/admin`: staff workspace, protected by authentication and roles
- `/portal`: authenticated client workspace
- `/account`: password and authenticator setup

A separate admin domain is optional and is not needed for the current app. The production admin URL will be `https://divinewall.in/admin`, and the client portal will be `https://divinewall.in/portal`. Do not replace an existing website to create this app; use a staging domain/subdomain and review the target first. The connected Hostinger website listing currently contains no site for `divinewall.in`; this does not prove domain registration or DNS ownership.

## What works locally

The app is a Next.js server application with real API routes, Prisma database queries, authenticated sessions and encrypted document downloads. It needs its server running. Uploading a static export into `public_html` cannot provide its login/admin/database functionality.

The production build, 70 core integration assertions and 387 security assertions passed locally. These results use SQLite and do not establish that a future MySQL deployment works.

## Changes required for managed hosting

1. **Database compatibility and migration.** `prisma/schema.prisma` currently declares SQLite, and `.env.local` points to a Windows-local file. Managed Hostinger hosting offers MySQL/MariaDB. Adapt the Prisma schema, schema-generation/setup commands, field lengths/types and recovery tooling for MySQL. Migrate the records deliberately and verify counts, relationships, authentication, billing transactions and document links. Simply replacing `DATABASE_URL` with a MySQL URL is insufficient. [Hostinger MySQL connection guide](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).

2. **Persistent private document storage.** The storage code already accepts `DOCUMENT_STORAGE_DIR`. On Hostinger it needs a verified writable private directory outside `public_html` and outside deployment/build folders, or an implementation using private object storage. Hostinger replaces managed deployment folders during redeployment; files written inside them must not be relied upon for persistence. Confirm allowed paths with the hosting account and prove that uploads survive a redeployment before accepting real documents. [Deployment file layout](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

3. **Managed runtime configuration.** Use Hostinger's Next.js framework handling and the platform-provided port/startup settings. The current `npm start` binds to loopback for the local preview; verify the managed platform's routing/startup mechanism rather than assuming the local preview command is sufficient. Generate Prisma for Linux during installation/build; do not upload Windows `node_modules` or a Windows-generated database engine.

4. **Production initialization.** Create tables and migrate/import records in a controlled preparation step; do not reseed known demo accounts during every deployment. Preserve the existing document/authenticator keys when transferring existing encrypted data. Arrange backups and restore to the chosen production database/storage before launch.

5. **Notifications, if enabled.** The existing reminder sender is a separate long-running process, disabled in the current workspace. Verify a supported worker/scheduler arrangement on the selected plan before advertising automated reminders. Gateway and messaging providers need their own credentials and staging verification.

## Production settings

Configure private values through Hostinger's environment variables, not source files or public JavaScript. The values below are examples; actual credentials, domain and private storage path must be selected for the target deployment:

```env
NODE_ENV="production"
DATABASE_URL="mysql://DATABASE_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/DATABASE_NAME"
APP_ORIGIN="https://divinewall.in"
DOCUMENT_STORAGE_DIR="ABSOLUTE_VERIFIED_PRIVATE_PERSISTENT_PATH"
DOCUMENT_ENCRYPTION_KEY="EXISTING_64_HEX_CHARACTER_KEY_WHEN_MIGRATING_DATA"
REQUIRE_PRIVILEGED_2FA="true"
TRUST_PROXY="false"
NOTIFICATIONS_ENABLED="false"
```

If a separate `AUTH_ENCRYPTION_KEY` is in use, preserve it as well. Keep the exact HTTPS origin without a trailing slash. Enable `TRUST_PROXY=true` only after confirming the platform replaces untrusted forwarding headers. Payment/notification credentials remain optional until the corresponding services are enabled and verified.

The MySQL URL is applicable only after the schema/runtime migration is implemented and tested. From the deployed Node app, use the local Hostinger database host `127.0.0.1:3306`, not the externally exposed database hostname. URL-encode special characters in the database password.

## Source upload contents

Include application source, public assets, Prisma schemas/migrations, required scripts, `package.json`, `package-lock.json` and build configuration. Use a dedicated source archive or private repository.

Exclude `.env.local` and other secret files, `node_modules`, `.next`, `.next-test`, `.data`, SQLite databases/journals, database backups, local previews/screenshots and attachments. Transfer production records and encrypted documents separately using the agreed secure migration/recovery process. Keep keys separately backed up.

## Launch sequence

1. Confirm the destination domain and available Node.js app slot.
2. Implement and verify MySQL compatibility and private persistent storage locally/staging.
3. Replace known demo passwords and enroll privileged accounts in an authenticator before transferring their accounts. The app rejects known demo passwords on a configured remote origin.
4. Create a separate staging Node.js site, configure the database/storage/environment, initialize/import records, and build on Hostinger.
5. Verify HTTPS sign-in, password replacement, MFA, all role boundaries, client privacy, file upload/download, financial calculations and exports.
6. Redeploy staging once and confirm records, document versions and encryption keys remain usable. Check logs and platform resource limits.
7. Test production-format backup and restore to an isolated destination. Arrange scheduled backups and an operator recovery procedure.
8. Review the concrete staging result, then approve public cutover and DNS changes for the chosen domain.

The eight remaining high-severity build-tool dependency findings and other limits are documented in [SECURITY-HARDENING.md](SECURITY-HARDENING.md). Existing product gaps remain in [ROLE-STRUCTURE-REVIEW.md](ROLE-STRUCTURE-REVIEW.md). Neither a successful source upload nor a green build alone means deployment is complete.

## Alternative using the current database

A Hostinger VPS can retain SQLite and private local document storage on persistent disk, with a supervised Node service and an HTTPS reverse proxy. It requires server administration, updates and backup management. This is an alternative if you prefer to preserve the current architecture; the selected Business/Cloud route requires the changes above. [Hostinger database support](https://www.hostinger.com/support/1583226-which-database-management-system-is-used-at-hostinger/).
