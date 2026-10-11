# Security hardening — 10 October 2026

The reproduced role-promotion, client-note disclosure and Advocate appointment defects have been fixed. This change strengthens authentication, data boundaries, file sharing and recovery. It does not certify the app against every attack or complete the separate product/scale gaps recorded in `ROLE-STRUCTURE-REVIEW.md`.

## Access and privacy

- Only Super Admin can create employee login accounts or change employee roles, login emails and passwords. HR and Office Manager can manage staff profiles and HR records without promoting themselves or taking over another login. The last active Super Admin cannot be demoted or deactivated.
- Role/credential changes and deactivation revoke the affected account's sessions. Every protected request also checks current account status, role and session expiry. Unknown roles fail closed.
- Case-team access can only be granted by Super Admin or Senior Advocate. Assignment slots require active employees with suitable roles. An Advocate sees their own assigned appointments; other advocates' appointments remain inaccessible.
- Senior Advocate's staff directory omits salary, bank details, government identifiers and employee files. Payroll and employee-document APIs/downloads require separate sensitive-HR permission. Hidden fields cannot be inferred through directory search.
- Restricted case staff do not receive client-wide private notes, identifiers or communications. Junior case responses omit finances and enforce assigned-case access.
- Portal responses explicitly select client-visible fields. Internal case/hearing notes, staff identifiers, internal invoice metadata and unrelated office communications are excluded. Only communications typed `PORTAL_MESSAGE` or `PORTAL_REPLY` are displayed to the client. Office users should use `PORTAL_REPLY` deliberately for a client-visible response.

## Authentication and browser protections

- New/reset accounts must replace their temporary password before accessing records. Known seeded passwords are refused on configured remote origins. The existing three seeded local accounts have been marked for replacement, without changing their passwords or deleting records.
- Password replacement requires the current password, a different new password of at least 8 characters (maximum 72 UTF-8 bytes), and an authenticator code when already enabled. The eight-character minimum follows the owner's requested policy. Known demo/common values are rejected. New hashes use bcrypt cost 12.
- Login throttles persist in the database: eight attempts per account and 100 per address in a 15-minute window. Authenticator/account-security actions, uploads, messages, payment orders and public appointments have additional persistent limits. A default shared address bucket is used unless a trusted proxy is explicitly configured.
- Sessions use random opaque tokens, hashed in the database, with eight-hour expiry and HttpOnly/SameSite cookies. Production cookies are Secure. Password changes and authenticator enablement revoke other sessions; users can terminate their own other sessions.
- Authenticator secrets are encrypted with AES-256-GCM. The setup migration encrypts legacy plaintext secrets. Privileged roles must enable an authenticator on configured remote production deployments by default, or whenever `REQUIRE_PRIVILEGED_2FA=true`. An explicit `false` honors the owner's current testing preference on local and hosted apps. When MFA is required, the server blocks record access until enrollment is complete and prevents disabling it. Existing enrolled accounts continue to require their code at sign-in.
- Browser mutation requests must match the configured origin, and cross-site fetch requests are rejected. Nonbrowser clients without an Origin still require the same authenticated session and permissions.
- Production pages have a per-request nonce Content Security Policy. Inline scripts without the nonce and eval are disallowed; framing and plugins are blocked. Additional headers prevent MIME sniffing and restrict browser device permissions. Authenticated pages and APIs use private/no-store caching. HTTPS deployments receive HSTS.
- Request bodies are bounded before parsing, including streamed bodies: login 8 KB, most JSON 256 KB, public appointments 32 KB and multipart uploads 21 MB. This prevents unrestricted body buffering.

## Documents and backups

- Documents remain outside public assets, encrypted at rest and downloaded only through authenticated authorization checks. Uploads are limited to supported types and 20 MB per file; HTML/SVG uploads are rejected.
- Only Super Admin or Senior Advocate can publish files to clients or replace already-published files. Junior/clerk uploads to assigned cases remain private. Clients can retrieve only their own shared current version; historical versions remain staff-only so previously private evidence is not exposed by later sharing.
- New Settings backups use an authenticated AES-256-GCM encrypted `.lfbackup` container containing database records and encrypted files. Sessions and throttle records are excluded. Restore accepts the new format and legacy gzip backups, and refuses an existing destination.
- Preserve the original `DOCUMENT_ENCRYPTION_KEY` separately from backups. If a separate `AUTH_ENCRYPTION_KEY` is used, preserve it too. Changing these keys without migrating existing ciphertext makes existing files/authenticator secrets unreadable.
- The live database was copied to `prisma/prisma/before-security-update.db` before the schema update. These database copies contain confidential records and must receive the same storage protections as the live database.

## Production configuration

Before public deployment, replace the seeded passwords locally and enroll privileged accounts in an authenticator. Serve the app behind HTTPS, keep the Node process on loopback/private networking, and set the exact public origin without a trailing slash:

```env
APP_ORIGIN="https://your-firm-domain.example"
REQUIRE_PRIVILEGED_2FA="true"
TRUST_PROXY="false"
```

The remote production origin automatically requires privileged MFA; the explicit setting also makes this requirement apply during local preparation. Set `TRUST_PROXY=true` only when a controlled reverse proxy removes/replaces incoming forwarding headers; otherwise keep it false. Configure proxy request-size limits and restrict direct access to the Node port. Keep `.env.local`, database files, backups and `.data/documents` outside any public web root, with access limited to the service account/authorized operator. Exported reports and downloaded backups contain firm information and need appropriate handling.

For an existing installation, back up the database and keys, then run:

```powershell
npm install
npm run db:push
npm run security:setup
npm run build
npm run start
```

At the owner's request, `REQUIRE_PRIVILEGED_2FA=false` allows both local and hosted testing without mandatory authenticator enrollment; passwords and normal role/session checks remain enforced. A configured remote production origin requires privileged MFA when this override is unset or explicitly true. Set the requirement to true before normal production use. Hostinger deployment, database migration, HTTPS login and admin routes have been checked. Authenticator recovery procedures, independent penetration testing and representative concurrency/load testing have not been performed. Providers remain unconfigured and no client message or real charge was sent.

## Verification

- `npm run test:security`: **387 assertions passed**, using all 14 configured roles in an isolated database. Covers module read/write boundaries, HR/Office Manager role-transition denials, credentials/provisioning restrictions, last-admin protection, cross-team documents, portal response fields, hidden-field search, sharing/version restrictions, origin checks, temporary-password enforcement, the requested eight-character minimum/common-password rejection, persistent throttling, session revocation/expiry and privileged MFA enforcement.
- `npm run test:admin`: **70 integration assertions passed**, using a separate database and disabled providers. Covers real CRUD persistence, billing/reconciliation, encrypted files, exports, encrypted authenticator enrollment, session termination, document versions, hearing updates and payment signature/replay logic.
- Production build: compilation and TypeScript validation passed. Production browser sign-in with the existing administrator reached the required password-replacement screen; no browser error/warning logs were recorded. This step deliberately leaves password selection to the owner.
- Encrypted backup restoration: matching record counts across **30 tables** in a new isolated destination, with encrypted documents restored. The live database was not overwritten.
- Evidence: `.data/security-test-results.json` and `security-preview.jpg`. The repeatable suites use port 3101 and refuse to run if it is occupied.

## Dependency audit boundary

The dependency update fixes the available PostCSS, selector-parser and ExcelJS/uuid transitive advisories. The current audit reports **eight high, zero moderate and zero critical findings**. The remaining entries arise from `braces <=3.0.3` and its dependency chain in trusted-source build tooling; the advisory currently lists no patched version. This app does not accept user-supplied brace patterns for those tools, but the package remains vulnerable and should not process untrusted build inputs. Run production from the verified artifact, restrict build inputs and revisit the dependency chain when a compatible fix is available.

Primary references: [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [PostCSS advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849), [selector-parser advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy).
