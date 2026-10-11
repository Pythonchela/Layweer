# Admin panel and login implementation

The subsequent [role and structure review](ROLE-STRUCTURE-REVIEW.md) identified account-role administration, client portal field-disclosure and Advocate appointment-scoping defects. These defects have now been fixed and covered by the security suite. [SECURITY-HARDENING.md](SECURITY-HARDENING.md) describes the hardened behavior and deployment conditions; the app still has the feature and scale gaps recorded in the review.

The original sample admin screens have been replaced with database-backed management pages. Login uses a random, eight-hour, HttpOnly session cookie. The database stores a hash of the session token. Every protected request checks the session, expiry, current role and account status. Logout and session termination revoke access immediately.

## Working local features

- Clients: full profiles, search, pagination, editing, assignments and client portal account provisioning.
- Cases: full general fields, criminal/civil details, case history, assigned-team access and related hearings/documents/tasks. Financial details are omitted for unauthorized roles.
- Hearings: month calendar, list, scheduling, adjournments, next-date updates, reminder outbox and court holidays.
- Employees: actual login accounts, departments, profile details, attendance, leave, salary slips, incentives and employee files. Super Admin alone provisions employee logins or changes their role/credentials; HR and Office Manager retain staff-profile and HR access.
- Documents: real uploads, private encrypted storage, authorized downloads/previews, folders as named paths, client sharing and version downloads.
- Billing: validated invoice items, optional GST, PDF invoices/receipts, partial payments, balance reconciliation, cancellation and expense records. Financial records are not silently deleted or edited.
- Leads: saved enquiries and repeat-safe conversion to clients. Appointments from the public consultation form appear in the admin panel for review.
- Tasks: saved assignments, status changes, completion timestamps and overdue labels.
- Dashboard: real counts, hearing/task lists and charts from saved records.
- Reports: all fifteen requested report categories, date filtering, real PDF and XLSX downloads. Advocate report currently measures workload (assigned case counts), rather than making unsupported claims about case success.
- Security: required temporary-password replacement, authenticator-based 2FA, persistent login throttling, session termination, role/field checks, browser security headers and activity logs. Privileged 2FA is required on configured remote production deployments.
- Backups: encrypted downloads containing database records and encrypted documents; restoration to a new directory without overwriting the live database. Active sessions and throttles are excluded.
- Client portal: actual client-specific cases, hearings, shared files, bills, payment history, notifications and messages.

## Run locally

The live database remains `prisma/prisma/dev.db`. A pre-change copy was saved as `prisma/prisma/before-admin-update.db`. Existing accounts and client records were preserved. Test records are stored separately under `.data`.

```powershell
npm install
npm run db:setup
npm run dev
```

Database scripts now load `.env.local`. Setup creates an environment file and document encryption key when they do not exist. Existing keys and passwords are preserved. `db:reset` requires an explicit deletion flag and is not part of setup.

Existing demo accounts, if seeded:

| Role            | Email                | Password     |
| --------------- | -------------------- | ------------ |
| Super Admin     | admin@lexfirm.com    | Admin@123    |
| Senior Advocate | rajendra@lexfirm.com | Advocate@123 |
| Client          | client@demo.com      | Client@123   |

Seeded passwords must be replaced on the local account screen before deployment. The local server binds to `127.0.0.1`. Production needs HTTPS and `APP_ORIGIN` set to the exact public origin. See the security guide for proxy and mandatory authenticator configuration.

## Payment provider

The Razorpay order, checkout, verification and signed-webhook routes are implemented. Keys are not embedded in client source. Captured payments reconcile invoice balances transactionally, and replayed callbacks do not record the same payment twice. Configure these in `.env.local`:

```env
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
```

Configure `payment.captured` delivery to `/api/payments/webhook` and automatic capture in the provider account. Use the provider's test mode before enabling live payments. The current workspace has no provider keys; no real charge was made. [Razorpay integration documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

## External notifications

Hearing reminders are queued at 7/3/1/0 days, and updates can be queued for opted-in clients. Configure Twilio, explicit client SMS/WhatsApp consent and international-format mobile numbers. WhatsApp uses an approved Content Template with variable `1` containing the update text.

```env
NOTIFICATIONS_ENABLED="true"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_SMS_FROM=""
TWILIO_WHATSAPP_FROM=""
TWILIO_WHATSAPP_CONTENT_SID=""
```

Run `npm run notifications:worker` in a separate supervised process to check the queue each minute. Provider acceptance is recorded as SUBMITTED, not as proof of delivery. Ambiguous failures require review and are not automatically resent. Current credentials are empty and notifications remain disabled; no client message was sent. [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource), [WhatsApp quickstart](https://www.twilio.com/docs/whatsapp/quickstart).

## Backup restoration

Download an encrypted backup from Settings as Super Admin. Keep `DOCUMENT_ENCRYPTION_KEY` separately: the original key is needed to decrypt the backup and document files. If `AUTH_ENCRYPTION_KEY` is configured separately, retain that original key as well to recover authenticator access.

```powershell
node scripts/restore-backup.cjs <backup.lfbackup> <new-output-directory>
```

The command rejects an existing destination, restores records and encrypted files, and excludes active sessions. Verify the restored database before switching `DATABASE_URL` and copying the restored files into `.data/documents`. Restore checks use an isolated destination, not the live database.

## Validation and boundaries

Verified locally on 10 October 2026: 387 security assertions and 70 core integration assertions passed. The production build passed compilation and type validation, and production browser sign-in with the existing administrator reached the required password-replacement screen without browser errors. Encrypted backup restoration was checked in an isolated destination with matching counts across 30 tables. The local preview is running at `http://localhost:3100`.

`npm run lint` checks TypeScript; `npm run build` produces the production build. `npm run test:admin` creates an isolated database, starts a loopback-only test server and exercises login, persistence, assignment/role restrictions, financial validation, encryption, document versions, exports, 2FA, session revocation and gateway signature/replay logic. It refuses to run if the test port is already occupied. Provider calls remain disabled in these tests.

The earlier `REQUIREMENTS-AUDIT.md` describes the pre-change project. This document describes the subsequent implementation. Live provider delivery, live gateway settlement, deployment, high-load testing, external CNR/court synchronization and multilingual PDF fonts are not verified by the local test suite. News/testimonial publishing on the public website remains outside this admin/login implementation. Existing public marketing statistics and legal copy still need the firm's review.

The latest dependency audit has eight high-severity findings and no moderate or critical findings. The eight remaining entries arise from the unpatched `braces` dependency in source-build tooling. Details and the deployment boundary are recorded in the security guide.
