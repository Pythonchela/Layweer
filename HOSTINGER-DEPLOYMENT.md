# Hostinger deployment plan

Prepared 10 October 2026; updated 11 October 2026 for Hostinger Business or Cloud hosting. This guide describes deployment and verification requirements; a source upload or build alone does not establish a working production system.

## Hosting route

Hostinger's managed Node.js Web Apps supports Next.js on Business and Cloud plans. Use **Websites → Add Website → Node.js web app**, with a new staging domain/subdomain initially. Source can be supplied by GitHub or ZIP. Node.js 22 is a supported choice. [Hostinger deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

The chosen production domain is **divinewall.in**. Use one domain for the application:

- `/`: public law firm website
- `/login`: staff/client sign-in
- `/admin`: staff workspace, protected by authentication and roles
- `/portal`: authenticated client workspace
- `/account`: password and authenticator setup

A separate admin domain is optional and is not needed for the current app. The production admin URL will be `https://divinewall.in/admin`, and the client portal will be `https://divinewall.in/portal`. Do not replace an unrelated existing website. On 11 October, SSH access confirmed the owner-created deployment under hosting user `u931810717`; this is different from the account exposed by the current hosting connector. Only the app's domain is within the deployment scope.

## What works locally

The app is a Next.js server application with real API routes, Prisma database queries, authenticated sessions and encrypted document downloads. It needs its server running. Uploading a static export into `public_html` cannot provide its login/admin/database functionality.

The production build, 70 core integration assertions and 387 security assertions passed locally. These results use SQLite and do not establish that a future MySQL deployment works.

## Changes required for managed hosting

1. **Database compatibility and migration.** The canonical `prisma/schema.prisma` retains SQLite for local development. `scripts/database-schema.cjs` generates a MySQL schema with long-text columns and indexed/relation keys under `prisma/mysql/`. The build selects its Prisma client using `DATABASE_URL`, applies committed MySQL migrations and then builds Next.js. The owner-created database is `u931810717_lawyer`, with user `u931810717_lawuser`; a read-only SSH check confirmed access to an empty MariaDB database on 11 October. Real records must still be deliberately imported or initialized, with counts, relationships, authentication, billing transactions and document links verified. [Hostinger MySQL connection guide](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).

2. **Persistent private document storage.** The storage code already accepts `DOCUMENT_STORAGE_DIR`. On Hostinger it needs a verified writable private directory outside `public_html` and outside deployment/build folders, or an implementation using private object storage. Hostinger replaces managed deployment folders during redeployment; files written inside them must not be relied upon for persistence. Confirm allowed paths with the hosting account and prove that uploads survive a redeployment before accepting real documents. [Deployment file layout](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

3. **Managed runtime configuration.** Use Hostinger's Next.js framework handling and the platform-provided port/startup settings. The current `npm start` binds to loopback for the local preview; verify the managed platform's routing/startup mechanism rather than assuming the local preview command is sufficient. Generate Prisma for Linux during installation/build; do not upload Windows `node_modules` or a Windows-generated database engine.

4. **Production initialization.** The build applies reviewed schema migrations, without resetting the database or creating known demo accounts. `db:setup`, demo seeding, reset and development migrations are blocked for MySQL. Import an encrypted backup with `scripts/restore-backup.cjs ... --mysql` to an empty database in an isolated checkout, or provision an initial administrator separately. Preserve existing document/authenticator keys when transferring encrypted data. Arrange backups and test restoration before launch.

5. **Notifications, if enabled.** The existing reminder sender is a separate long-running process, disabled in the current workspace. Verify a supported worker/scheduler arrangement on the selected plan before advertising automated reminders. Gateway and messaging providers need their own credentials and staging verification.

## Production settings

Configure private values through Hostinger's environment variables, not source files or public JavaScript. The values below are examples; actual credentials, domain and private storage path must be selected for the target deployment:

```env
NODE_ENV="production"
DATABASE_URL="mysql://DATABASE_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/DATABASE_NAME"
APP_ORIGIN="https://divinewall.in"
APP_ALLOWED_ORIGINS="https://www.divinewall.in"
DOCUMENT_STORAGE_DIR="ABSOLUTE_VERIFIED_PRIVATE_PERSISTENT_PATH"
DOCUMENT_ENCRYPTION_KEY="EXISTING_64_HEX_CHARACTER_KEY_WHEN_MIGRATING_DATA"
REQUIRE_PRIVILEGED_2FA="true"
TRUST_PROXY="false"
NOTIFICATIONS_ENABLED="false"
HOSTINGER_CPU_LIMIT="2"
```

If a separate `AUTH_ENCRYPTION_KEY` is in use, preserve it as well. Keep the exact HTTPS origin without a trailing slash. Enable `TRUST_PROXY=true` only after confirming the platform replaces untrusted forwarding headers. Payment/notification credentials remain optional until the corresponding services are enabled and verified.

`APP_ORIGIN` is one complete website origin. Put additional complete HTTPS origins in `APP_ALLOWED_ORIGINS`, separated by commas. A value such as `https://divinewall.in, www.divinewall.in` in `APP_ORIGIN` is invalid. The app accepts only the canonical origin and explicitly configured aliases, rejects unrelated sites and HTTP downgrades, and directs public HTTP login visitors to secure login before sending their password. Managed workers refresh these two settings from the private platform configuration on startup.

For the owner's current hosted testing stage, `REQUIRE_PRIVILEGED_2FA=false` explicitly turns off mandatory enrollment, including on a live domain. Existing enrolled accounts still use their authenticator at sign-in. Set it to `true` before normal production use; leaving it unset also requires privileged MFA on a configured live production origin. Managed workers refresh this setting with the site origins.

The MySQL URL must be available during installation/build and runtime; changing it after a SQLite build requires a new MySQL build. From the deployed Node app, use the local Hostinger database host `127.0.0.1:3306`, not the externally exposed database hostname. URL-encode special characters in the password. Verify tables and transactional operations with `node scripts/check-database.cjs --write-probe`; this rolls back all verification records.

`src/instrumentation.ts` applies the shared-hosting CPU limit before loading database routes. Build/database/restore helpers apply the same limit when configured. This prevents the Prisma native engine from spawning threads for every visible host CPU and exceeding the shared account's thread quota. MySQL application pools default to three connections and can be overridden by the URL's `connection_limit` parameter.

## Server verification on 11 October 2026

- SSH key access to the owner-selected server was successful.
- The owner's saved MySQL URL authenticated to MariaDB 11.8.9, using local host `127.0.0.1`.
- The initial migration is recorded as completed; all 32 application tables plus `_prisma_migrations` exist.
- A transactional write check verified create/read/update, related records, long Unicode text and billing, then rolled back all verification records.
- Before import, the live login route changed from database-unavailable HTTP 503 to HTTP 401 for a deliberately nonexistent account, confirming that it could reach the empty MySQL database.
- After the owner authorized migration, all local business records were imported and compared field for field: 3 users, 1 employee, 1 client, 6 holidays, 2 news updates, 4 testimonials and 6 audit entries. Password hashes and account flags were preserved; sessions and login counters were excluded. One encrypted storage file was transferred and its decryption verified. No cases or invoices existed in the local snapshot.
- A private database dump and environment backup were saved before import. Transferred document/authentication settings are retained in owner-only `~/.config/layweer/divinewall.in/data.json`, outside managed deployment folders. The runtime reads only these encryption/storage settings from that file; the database URL and security policies still come from the managed environment. This avoids cached hPanel worker settings reverting the migrated keys. Preserve this file with database/document backups, and update it deliberately if rotating keys.
- `divinewall.in` now resolves to the selected server, but HTTPS still fails during the TLS handshake. The server can be checked locally through SSH with the domain's HTTP Host header; public HTTPS must be established before transmitting real sign-in credentials.

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
