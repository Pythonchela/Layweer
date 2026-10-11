# Role and application structure review

Reviewed 10 October 2026 against the supplied 16-part requirements list. This document preserves the review after the admin/login changes, before the subsequent security hardening. The three reproduced defects below are now fixed; see [SECURITY-HARDENING.md](SECURITY-HARDENING.md) for current security behavior and verification.

## Verdict

**Security follow-up:** employee login/role administration is restricted to Super Admin; portal responses explicitly select shared fields; Advocate appointments are scoped to their employee record. Role-suitable assignments, confidential HR/client-field filtering, database-backed throttles, encrypted authenticator secrets/backups and deployment MFA requirements have also been added. The historical findings below explain why these changes were necessary. Remaining public-feature, flexible-team, provider and scale gaps still apply.

The main roles exist and normal access checks are enforced on the server. The overall application foundation is suitable for continued development. It is not yet fully aligned with the requirements or ready to be treated as a finished production system: three defects were reproduced, including an account-permission bypass and exposure of internal notes to clients.

The earlier admin-completion statement was too broad. The previous 67-check suite established that core workflows worked; it did not cover every role-transition and field-disclosure scenario.

## Verification performed

- Created a separate review database and temporary loopback server on port 3102. Existing firm accounts and records were not changed.
- Tested all 14 configured roles against 12 principal admin endpoints: 168 access checks matched the current permission configuration.
- Checked junior assigned-case isolation, client own-case isolation and denial of junior report access: three additional checks passed.
- Ran separate probes that reproduced the three defects below. Matching the current configuration does not mean that configuration satisfies every security requirement.
- TypeScript validation passed. The production build and earlier 67 integration checks were already verified in the preceding implementation work; they were not rerun for this read-only review.
- Machine-readable evidence: `.data/role-review-results.json`. The temporary review server was stopped after testing.

## Main role mapping

| Required role | Current access | Assessment |
| --- | --- | --- |
| Super Admin | All modules, account creation, deletion and backups | Main mapping present; remaining defects still affect the system |
| Senior Advocate | Cases, clients, team records, hearings, documents, tasks, leads, appointments, reports and billing | Present; employee records are read-only, so team account administration remains with Super Admin/HR |
| Junior Advocate | Assigned cases, related clients/documents/hearings and own tasks; no billing or employee access | Normal assigned-case and billing restrictions verified |
| Clerk | Assigned cases, hearings and documents; own tasks | Main mapping present |
| Accountant | Billing, payments, expenses and finance reports | Main mapping present; receives minimal case/client lookups needed to link invoices |
| HR/Admin | Employees, attendance, leave, payroll, employee documents and employee reports | Mapping present, but account role changes are insufficiently restricted |
| Client | Own cases, hearings, shared files, invoices/payments, notifications and messages | Own-case boundary verified; internal fields are overexposed |

Additional employee roles are configured: Advocate, Associate, Legal Assistant, Typist, Receptionist, Office Manager and IT Admin. They have separate module permissions. Ordinary Advocate appointment visibility is broken as described below.

Permissions are fixed in code and displayed in Settings. There is no editable permission-policy management screen; that is not explicitly required by the supplied list, but changes to firm policy currently need code changes.

## Confirmed defects

### P1 — HR can grant itself billing access

`src/app/api/admin/[module]/route.ts:149–187` only blocks non-Super-Admin actors from assigning or modifying SUPER_ADMIN, IT_ADMIN and SENIOR_ADVOCATE accounts. HR_ADMIN and OFFICE_MANAGER have `employees:write`, and ACCOUNTANT remains an allowed target role.

Reproduction in the isolated database: HR billing access initially returned 403; HR updated its own employee account to ACCOUNTANT; after signing in again with the same existing password, billing access returned 200. Session revocation correctly invalidates the old session, but does not prevent the privilege change.

Required change: separate staff-profile editing from login-account administration. Restrict role changes and credential resets to an authorized account administrator; block self-promotion and protect accounts outside the actor's permitted administration scope. Add negative tests for every role transition, including HR and Office Manager.

### P1 — Client API returns internal case and hearing notes

`src/app/api/portal/route.ts:14–24` filters records to the current client's cases, but fetches all scalar fields. The isolated client received both a case `notes` field containing INTERNAL-STRATEGY-NOTE and a hearing `notes` field containing INTERNAL-HEARING-NOTE. These fields are not shown in the portal interface, but are present in its response and therefore accessible to the client.

The portal also returns broad invoice/payment records and all client communications without a separate public/internal visibility policy.

Required change: explicitly select client-visible fields and define which communication types or records are shared with clients. Keep internal notes, staff identifiers and administrative metadata out of portal responses. Add response-field tests, not only ownership tests.

### P2 — Advocates cannot see their assigned appointments

ADVOCATE has `appointments:read` in `src/lib/auth.ts:34–47`, but `scope()` in `src/lib/admin.ts:133–160` has no appointment branch and falls back to an impossible record ID for restricted roles.

An appointment assigned to the isolated Advocate existed in the database; their authenticated appointment list returned 200 with zero records.

Required change: scope Advocate appointments to `advocateId` matching their employee record and test both their own and another advocate's appointments.

## Application foundation and remaining structure gaps

| Area | Current foundation | Remaining work |
| --- | --- | --- |
| Routes and authentication | Separate public, login, admin and client portal areas; server session checks; role-filtered navigation | Correct the permission-transition and response-field issues above |
| Data relationships | User-to-employee/client links; client-to-many-cases; case-to-hearings/documents/tasks; invoices-to-payments | Full team membership is limited to one senior, one junior and one clerk per case; no flexible case-team relationship |
| Staff assignments | Active employee existence is checked for assignment IDs | Assignment slots do not enforce role suitability; client/hearing/appointment assignment IDs are plain strings rather than full database relations |
| Admin persistence | Shared APIs and forms save real records, validate key fields, paginate and search; financial calculations use transactions | Shared employee permissions expose payroll and sensitive employee fields together; finer field/module permissions would better support a large firm |
| Public website | Informational sections and real consultation request persistence | Contact form still simulates sending; news and testimonials on the public site remain hardcoded and disconnected from admin records |
| Consultation workflow | Advocate selection and appointment requests save to the database | Requests remain pending office confirmation; automatic confirmation and an integrated consultation-payment workflow are incomplete |
| Client portal | Own-case lists, hearings, shared downloads, billing, messages and payment integration | Client document upload is missing; internal fields need explicit filtering |
| Documents | Private encrypted storage, secure downloads, versions and named folder paths | Folder paths are basic metadata rather than a full folder tree; no complete client-upload workflow |
| Reporting and dashboard | Database-backed counts, charts and 15 report categories; PDF/XLSX exports | Advocate performance means assigned-case counts, not a complete performance metric; employee workload is not a full task/attendance performance system |
| Notifications and payments | Gateway verification/webhooks and notification outbox/worker implemented | Provider credentials and live operation are unverified; complete payment-reminder/document-request delivery flows remain unfinished |
| Security and recovery | Password hashes, opaque hashed sessions, expiry, logout/revocation, optional 2FA, audit logs, encrypted files and backup/restore tools | Fix the confirmed access defects; login throttling is process-local; deployment and remaining dependency advisories need review |
| Scale | SQLite local database; ordinary list pagination | Large-firm concurrency/load is untested. Lookups load all eligible records; several dashboard/report queries load whole datasets. Database indexes, query pagination and deployment database selection need a measured scale review |
| Court integrations | CNR is stored and hearing history is managed locally | No external CNR/court synchronization implementation |

## Recommended completion order

1. Fix HR/Office Manager role administration and portal field disclosure.
2. Fix Advocate appointment scoping and validate role-appropriate team assignment.
3. Add tests for every role's read/write/delete/account-administration actions, cross-team records and portal response fields.
4. Connect public enquiries and published content; finish client uploads and consultation payment/confirmation.
5. Configure and verify providers, then perform deployment/security and representative load checks.
