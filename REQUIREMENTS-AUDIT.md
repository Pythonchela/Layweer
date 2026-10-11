# Requirements audit — 10 October 2026

This audit records the original project before the admin/login implementation. For the subsequent changes and their verification, see [ADMIN-IMPLEMENTATION.md](ADMIN-IMPLEMENTATION.md).

## Verdict

The submitted project is a substantial interface prototype and database design, with a small set of authentication and database APIs. It does **not** fulfill the complete law-firm software requirements. No management module is complete end to end. The public informational website is the closest to completion.

An interface, schema field, installed library, or success message does not establish a working feature. Most pages use hardcoded arrays; almost all business forms simulate saving with a delay. Only login/logout/current-user requests are wired into the interface. Do not use this version for confidential client records until authorization and persistence are implemented and verified.

## Scope and interpretation

Reviewed the supplied requirements, every application route, public/admin components, business forms, authentication utilities, Prisma schema and seed/setup configuration. This is a source-based functional and security review plus local compiler/build checks. Browser appearance, external provider delivery, production configuration, load capacity and restore procedures have not been verified. No production vulnerability-version assessment or legal-content accuracy assessment was performed. Application source and database records were not changed.

Statuses: **Present** = concrete static informational content exists; **Partial** = actual backend implementation exists but does not satisfy the full workflow; **Prototype** = screen/sample data/simulated actions; **Schema only** = modeled but no functioning workflow; **Missing** = no implementation found. None of these labels other than a complete verified workflow should be treated as acceptance of a management feature.

## Priority findings

| Priority | Finding and impact | Evidence |
|---|---|---|
| Critical | Any valid logged-in user, including a client, can request clients, cases, hearings and billing records without role or ownership restrictions. Client IDs supplied in query parameters are optional filters, not access controls. POST endpoints also accept any authenticated user. | `src/app/api/{clients,cases,hearings,billing}/route.ts`; `src/lib/auth.ts:57` defines permissions but routes never call `hasPermission`. |
| High | Admin and portal pages have no authentication guard. Anyone can open their sample screens directly; the portal displays the same hardcoded client profile. Current static screens do not establish real-client data isolation. | `src/app/admin/layout.tsx:8`; `src/app/portal/page.tsx:17`. No middleware or server-side route guards found. |
| High | Logout does not revoke a JWT. The logout API deletes Session rows, but token authentication checks signature and user lookup only. A copied token remains usable until its seven-day expiration. Deactivated users are rejected at login but are not rejected by subsequent token validation. | `src/lib/auth.ts:32-54`; `src/app/api/auth/logout/route.ts:11`. |
| High | Nearly every create/edit/upload/payment/export action reports success without doing the operation. Users could believe appointments, documents or payments were recorded when nothing was saved. | `ClientForm.tsx:41`, `CaseForm.tsx:44`, consultation `page.tsx:64`, portal `page.tsx:62,267,311,314`, reports `page.tsx:81`. |
| High | Clients/cases/hearings POST bodies spread unvalidated `rest` directly into Prisma create data. Callers can set unintended fields or nested relations supported by Prisma. No field allowlist, ownership/assignment verification or enum/date validation. | clients route `:48-60`; cases route `:57-77`; hearings route `:43-52`. |
| High | Type checking fails in the supplied workspace. Prisma client generation is incomplete/unavailable and a Lucide icon receives an unsupported `title` prop. | `src/lib/prisma.ts:1`, `prisma/seed.ts:1`, documents `page.tsx:109`; compiler output below. |
| High | 2FA, encrypted document storage, backups, audit trails and effective session termination are absent. UI controls and model fields do not implement them. | settings page; auth helper; schema `AuditLog`, `Document`, `Session`. |
| Medium | JWT secret silently falls back to a publicly readable constant when the environment variable is absent. Login has no implemented rate limit or lockout. Tokens are stored in localStorage. | `src/lib/auth.ts:5`; login route; login page `:47`. |
| Medium | Hearing creation and reminder creation are separate writes; reminder failure can leave a hearing saved despite a failing request. Recipients are not populated, dispatch is absent, and Case.nextHearingDate is not synchronized. | hearings route `:50-64`. |
| Medium | Invoice totals trust client-provided amounts, have no negative/finite-number checks, and use an ambiguous amount × quantity calculation. No payment reconciliation, GST calculation or transaction handling. Invoice numbers use only a random four-digit suffix and can collide. | billing route `:51`; `src/lib/utils.ts:56`. |
| Medium | Pagination is unbounded and unvalidated. Invalid/negative page/limit inputs can cause errors; large limits can expose large datasets. API error handling and duplicate/date/FK validation are inconsistent. | clients/cases GET handlers; business POST handlers. |

## All 16 requirement groups

### 1. Professional law-firm website and consultation — present content; prototype workflows

- Home, firm introduction, senior advocate profile, criminal/civil litigation descriptions, court representation, achievements and testimonials have static components rendered from `src/app/page.tsx`.
- All twelve subject practice areas have detailed sections on `/practice-areas`: criminal, civil, family/matrimonial, property, cheque bounce/NI Act, bail, corporate/commercial, consumer, labour/employment, banking/financial, cyber and constitutional.
- High Court, Supreme Court and District Court representation is mentioned in content and all fifteen choices exist in `PRACTICE_AREAS`; there are no separate detailed sections for those last three court-specific areas.
- News cards are static. `/news` is linked but absent; Read More has no action. No publishing or article-detail workflow.
- Contact details and a contact form appear on the home page. Submission waits and shows a toast; it does not send or save an enquiry. `/about` and `/contact` are linked and documented but absent. `/privacy`, `/terms`, `/disclaimer` are also linked but absent.
- Consultation offers advocate selection, date/time, online/offline/phone types and displayed fees. Advocates and slots are static; no availability/conflict checking. Submit merely sets `confirmed=true`. No Appointment write, payment gateway, meeting-link creation, receipt, SMS/WhatsApp/email confirmation or appointment-management API.

### 2. Client management — partial API; prototype interface

`Client` has ID/name/mobile/email/address/type/occupation/company/ID/reference details, advocate/clerk strings and notes. Schema relationships support multiple cases, documents, invoices, payments, communications and appointments per client. Opposite party and hearing/limitation dates are attached to cases.

GET/POST clients APIs support basic list/search/type filter/pagination/create. The clients page and full-profile form use sample data and simulated saves. No functioning edit/delete/detail API, linked case history, communication timeline, document/payment history or important-date workflow. Advocate/clerk assignments are unconstrained strings; selectors use hardcoded IDs. The required client → cases → documents → payments chain exists as a model design, not a usable connected workflow.

### 3. Case management — partial API; prototype interface

The schema and general form represent case ID/number/CNR/type/court/bench/judge, filing/registration dates, stage/status/priority, client, opposing party/advocate, acts/sections, senior/junior/clerk assignments, notes/description, limitation date and next hearing date.

GET/POST case APIs provide basic list/search/create. No functioning update/delete or complete detail workflow. The form does not require the client and has no rendered client selector despite `clientId` state; assignment choices contain dummy employee IDs. Connecting it directly to the API would therefore still be insufficient.

`CaseHistory` models event/description/date but no read/write workflow exists. The same four sample filing/hearing/adjournment/note entries appear for each viewed case. Arguments, evidence, orders, judgment and next-date history are not maintained. Hearing/document/billing/task tabs explicitly say they will load from the database. CNR is a stored/searchable number, with no external court-status tracking or synchronization.

### 4. Criminal management — prototype and schema only

The CriminalCase model has FIR/date/station/sections, accused and complainant details, arrested/date/custody, bail status/type/date, remand date, charge-sheet flag/date, trial stage, witnesses, evidence details, verdict/date/sentence and appeal/court/notes.

The screen displays only a small sample subset. The form covers FIR/date/station/sections, accused/complainant names, bail type, trial stage, arrested and charge-sheet flags; submit never persists. No actual bail application lifecycle, remand workflow, charge-sheet/evidence upload, witness records or statements, appeal/revision workflow, custody tracking or verdict entry. Revision and statements have no dedicated schema fields. Criminal detail is not created together with a general case. View sets `selected` but no detail dialog renders it; edit has no handler.

### 5. Civil management — prototype and schema only

CivilCase models plaint/written statement/replication/issues, plaintiff/defendant details, property/agreement details, interim application, injunction, execution, decree/date, appeal and notes. Evidence/notices/orders/judgments could be represented through generic documents/history but there is no working connection. Revision is not explicitly modeled.

The form only captures suit type, plaintiff/defendant names, property and agreement details. No pleading filing/versioning, evidence, interim/injunction applications, notices/orders/judgments, execution/appeal/revision management. No civil API or persisted registration. View/edit buttons lack working detail/edit flows.

### 6. Employee and advocate management — prototype and schema only

Role strings cover senior advocate, advocate, junior, associate, clerk, typist, accountant, receptionist, office manager and IT/admin. Legal Assistant and HR/Admin are not explicit roles. Employee/User models cover profile/department/joining/salary/login; Attendance, Leave, SalarySlip and EmployeeDocument models exist, and cases/tasks have assignment relationships.

Employee lists and salary amounts are sample data. Add does not create an employee or login. Attendance, leave, salary slips and assigned-case tabs are explicit placeholders. No incentive management, performance calculations, document workflow or activity history. Existing seeded accounts can authenticate, but employee credential lifecycle is missing. Junior/team case restrictions and confidential financial restrictions are not enforced.

### 7. Court and hearing calendar — partial API; prototype calendar

Month/list navigation and sample hearing views show date/time/court/case/client/advocate/courtroom/purpose. Real GET/POST hearing APIs exist but the calendar never calls them; scheduling only displays success.

POST creates reminder rows for 7/3/1/0 days before the hearing. No recipient selection, scheduler, provider integration or delivery means none of those reminders is sent. Adjournment reason/outcome/next date exist as schema fields, without update/history flows. Case limitation dates and CourtHoliday are modeled, without deadline/holiday calendar functionality. Important deadlines are not centrally maintained. Date GET uses exact timestamp equality, which would omit same-day hearings with different time components.

### 8. Document vault — prototype and schema only

Category choices include FIR, charge sheet, plaint, written statement, vakalatnama, affidavit, evidence, court order, judgment, notice, agreement, identity/property documents, photo and other. File URL/MIME/size and version models exist, but there is no storage implementation or document API.

Local sample search/category filters work on arrays. Upload selection/drop only displays a toast; file bytes are not transmitted or stored. Preview/download/delete controls have no actions. Sharing is an unsaved checkbox. No folder model/navigation, version-history workflow, granular access permission, document audit log, encryption or secure delivery. Scans/PDF/audio/video are not supported by a functioning evidence pipeline, regardless of generic MIME fields.

### 9. Client portal — prototype; secure isolation missing

Dashboard/cases/status/next and previous hearings/court/advocate/documents/invoices/payment amounts/notifications all use the same static client's arrays. No authentication guard, client lookup or ownership filter. Document upload/download/preview, messages, invoice download and Pay buttons only show toasts. Appointment links lead to the simulated consultation form. No real hearing updates, payment history/online payment, notifications or messaging backend. Client-to-User association is modeled but not used to isolate API records.

### 10. WhatsApp and SMS — missing delivery implementation

No provider API call, queue, scheduler, retries, delivery status, recipient resolution or message-template implementation exists. Hearing reminders are database rows only. Case status updates, payment reminders, document requests, appointment confirmations, invoices and new-order notifications are not sent. Environment-variable suggestions in README do not implement integrations.

### 11. Fees and billing — partial invoice API; prototype interface

Fee choices include consultation, case, appearance, drafting, filing, documentation, court/travel/miscellaneous expenses. Invoice/InvoiceItem/Payment models cover totals/received/pending, due dates, partial status, receipt/transaction numbers and cash/UPI/bank/cheque/online methods. GST amount is modeled.

GET/POST invoice APIs exist; UI does not call them. No payment recording endpoint, receipt/invoice generation/download, actual payment history, automatic balances/status reconciliation, due-date reminders, gateway checkout/webhook or GST-ready calculation. The payment-recording action only closes the invoice dialog and displays a message. Expense categories are invoice line labels, with no separate expense ledger/report source.

### 12. Leads — prototype and schema only

Lead models enquiry/contact/source/practice area/consultation/follow-up/estimated fee/status/assigned employee/conversion/client link. Sample filtering and pipeline cards exist. Add and Convert show success without saving or creating a client. View sets a state value but no detail dialog uses it. No persisted Lead → Consultation → Registration → Case → Advocate Assignment process, or conversion transaction to prevent duplicates.

### 13. Tasks — prototype and schema only

Task model and UI cover title/description/case/assignee/creator/deadline/priority, pending/in-progress/completed/overdue. Assignment simulates success. `changeStatus` only toasts; it does not even update the displayed task array. Overdue text is calculated from dates, while status cards/filtering still use the static status values, so overdue classification is inconsistent. No persisted assignment, completion timestamp, notifications or senior-advocate permission enforcement.

### 14. Admin and security — partial login; core requirements missing

Bcrypt password verification, signed expiring JWTs, login inactive-account check, lastLoginAt update and attempted Session insert exist. No password-reset/change implementation, 2FA enrollment/challenge, enforced role permissions, audit-log writes/viewer, complete login history, functional session revocation, backup/restore or document encryption.

Super Admin, senior/junior, clerk, accountant and client roles are declared, with HR/Admin missing. The Settings permission table is hardcoded and differs from the helper permissions (for example senior billing-write and IT settings permissions). Neither enforces access. Session storage is nonblocking on login, and sessions are never consulted to authenticate requests. Settings saves, 2FA, termination and backup/import controls show success without executing the operation.

### 15. Management dashboard — prototype

Total clients, active/criminal/civil cases, today's hearings, pending fees and other displayed counts are literals. Upcoming hearings, pending tasks and employees are not supplied as a complete live KPI set. Revenue and case-type charts, hearings/tasks/recent cases are sample arrays. No live queries/aggregation, court/practice-area/advocate/status breakdown, pending-fee chart or employee-workload calculation. Court and advocate charts elsewhere on Reports are also static, so they do not satisfy dashboard analytics.

### 16. Reports — prototype; all real reports and exports missing

Twelve report cards exist: client, case, criminal, civil, hearing, advocate performance, employee, fee collection, outstanding payments, revenue, document and task. All show success for PDF/Excel without generating files. Report date inputs do not filter chart arrays. Court-wise sample chart exists but no corresponding report/export; expense and case-stage reports have no implementation. Installed jsPDF libraries do not establish export functionality. All fifteen requested report types require real data selection, authorized aggregation, generation and export.

## Verification results

- `npx tsc --noEmit`: failed with 11 diagnostics. Two missing PrismaClient export diagnostics (`prisma/seed.ts:1`, `src/lib/prisma.ts:1`); unsupported icon title prop (`documents/page.tsx:109`); two implicit-any login error handlers and six implicit-any invoice reduction parameters. Prisma generation may resolve several dependent diagnostics; this was not treated as proof the source is otherwise buildable.
- `npm run build`: JavaScript compilation succeeded, but the production build failed during type validation at `prisma/seed.ts:1` because `@prisma/client` does not export `PrismaClient` in the supplied installation. A successful deployable build was not produced.
- Seven API route files exist: login, logout, me, clients, cases, hearings, billing. Business routes implement GET/POST only. No other business APIs, server actions, storage adapters, payment webhooks, notification workers or report generators found.
- No dedicated test suite found. No database reset, seed, migration, payment, notification send or confidential-record mutation was performed. Build/type checking can create generated/cache output.

## Recommended implementation order and acceptance gates

1. Fix generation/compiler/build setup. Use explicit schema migrations and verify an isolated test database. Acceptance: clean type check and production build.
2. Implement server-side authentication, role permissions and case/client ownership scopes before connecting real records. Reject revoked/expired/inactive sessions. Add validation/field allowlists and transactional writes. Acceptance: clients cannot read/write other clients' records; junior users cannot read finances or unassigned cases; logout invalidates copied tokens.
3. Connect client/case CRUD and employee selectors to real IDs; implement full case details/history and criminal/civil extensions. Acceptance: create/edit/reload preserves data and cross-links correctly.
4. Implement hearing/calendar updates, next-date synchronization, holidays/deadlines and recipient-aware reminders. Acceptance: hearing changes update case/history and reminders without duplicates.
5. Implement authorized document storage/upload/preview/download/sharing/versioning/activity and encryption. Acceptance: actual files survive reload and unauthorized downloads fail.
6. Implement invoice/payment/receipt/expense ledgers with validated amounts and reconciled balances. Add payment gateway/webhook verification and repeat-safe reconciliation. Acceptance: partial payments and refunds/duplicate callbacks cannot corrupt balances.
7. Connect portal, leads, tasks, HR attendance/leave/payroll/performance and communications to persisted data with permissions. Acceptance: user actions change real records and survive reload.
8. Add notification delivery/retries, complete live dashboard/report queries, all fifteen reports and genuine PDF/Excel exports. Implement backup restoration and 2FA. Acceptance: exported records match authorized filters, messages have delivery evidence, and restoration/2FA have been exercised.

Do not infer a completion percentage from the number of screens or schema fields. They substantially overstate operational coverage. The item checklist below preserves every supplied line and identifies whether it is delivered as a functioning requirement; module sections explain the distinction between interface, model and partial API support.

## Supplied item-by-item checklist

Each original nonempty line is retained, including subheadings, illustrative amounts and contextual statements. Context lines are not additional acceptance criteria. “Not complete” means the operational requirement is unfulfilled; it can still have a prototype or schema representation described above.

### 1. 🌐 Professional Law Firm Website

| Supplied requirement or context | Assessment |
|---|---|
| Home | Present as static informational content |
| Law firm introduction | Present as static informational content |
| Senior Advocate profile | Present as static informational content |
| Practice areas | Present as static informational content |
| Criminal & Civil litigation | Present as static informational content |
| Court representation | Present as static informational content |
| Achievements | Present as static informational content |
| Client testimonials | Present as static informational content |
| News & legal updates | Not complete — see module 1 |
| Contact/appointment | Not complete — see module 1 |
| Practice Areas | Present as static informational content |
| Criminal Law | Present as static informational content |
| Civil Law | Present as static informational content |
| Family & Matrimonial Law | Present as static informational content |
| Property Disputes | Present as static informational content |
| Cheque Bounce / NI Act | Present as static informational content |
| Bail & Anticipatory Bail | Present as static informational content |
| Corporate & Commercial Disputes | Present as static informational content |
| Consumer Cases | Present as static informational content |
| Labour & Employment | Present as static informational content |
| Banking & Financial Disputes | Present as static informational content |
| Cyber Crime | Present as static informational content |
| Constitutional Matters | Present as static informational content |
| High Court Matters | Partial content: mentioned; no dedicated detailed section |
| Supreme Court Matters | Partial content: mentioned; no dedicated detailed section |
| District Court Matters | Partial content: mentioned; no dedicated detailed section |
| Online Consultation | Not complete — see module 1 |
| Appointment booking | Not complete — see module 1 |
| Advocate selection | Not complete — see module 1 |
| Date & time slot | Not complete — see module 1 |
| Online/Offline consultation | Not complete — see module 1 |
| Payment | Not complete — see module 1 |
| Automatic confirmation | Not complete — see module 1 |

### 2. 👥 Client Management

| Supplied requirement or context | Assessment |
|---|---|
| For a large client base, maintain a complete digital client profile: | Not complete — see module 2; example/context where applicable |
| Client ID | Not complete — see module 2 |
| Client name | Not complete — see module 2 |
| Mobile number | Not complete — see module 2 |
| Email | Not complete — see module 2 |
| Address | Not complete — see module 2 |
| Client type | Not complete — see module 2 |
| Occupation/business | Not complete — see module 2 |
| ID/reference details | Not complete — see module 2 |
| Multiple cases under one client | Not complete — see module 2; example/context where applicable |
| Opposite party details | Not complete — see module 2 |
| Previous case history | Not complete — see module 2 |
| Documents | Not complete — see module 2 |
| Communication history | Not complete — see module 2 |
| Payment history | Not complete — see module 2 |
| Assigned advocate | Not complete — see module 2 |
| Assigned clerk | Not complete — see module 2 |
| Notes | Not complete — see module 2 |
| Important dates | Not complete — see module 2 |
| One client → multiple cases → multiple documents → multiple payments. | Not complete — see module 2; example/context where applicable |

### 3. ⚖️ Case Management

| Supplied requirement or context | Assessment |
|---|---|
| Every case gets its own complete digital case file. | Not complete — see module 3; example/context where applicable |
| Case Details | Not complete — see module 3 |
| Case ID | Not complete — see module 3 |
| Case number | Not complete — see module 3 |
| CNR number | Not complete — see module 3 |
| Case type | Not complete — see module 3 |
| Criminal/Civil | Not complete — see module 3 |
| Court | Not complete — see module 3 |
| Bench | Not complete — see module 3 |
| Judge | Not complete — see module 3 |
| Filing date | Not complete — see module 3 |
| Registration date | Not complete — see module 3 |
| Case stage | Not complete — see module 3 |
| Case status | Not complete — see module 3 |
| Next hearing date | Not complete — see module 3 |
| Opposite party | Not complete — see module 3 |
| Opposite advocate | Not complete — see module 3 |
| Acts & sections | Not complete — see module 3 |
| Assigned senior advocate | Not complete — see module 3 |
| Assigned junior advocate | Not complete — see module 3 |
| Clerk | Not complete — see module 3 |
| Case priority | Not complete — see module 3 |
| Case History | Not complete — see module 3 |
| Filing | Not complete — see module 3 |
| Hearing | Not complete — see module 3 |
| Adjournment | Not complete — see module 3 |
| Arguments | Not complete — see module 3 |
| Evidence | Not complete — see module 3 |
| Orders | Not complete — see module 3 |
| Judgement | Not complete — see module 3 |
| Next date | Not complete — see module 3 |
| Case notes | Not complete — see module 3 |
| CNR-based case tracking and court/hearing management are now common features in Indian legal-practice platforms. | Not complete — see module 3; example/context where applicable |

### 4. 🔴 Criminal Case Management

| Supplied requirement or context | Assessment |
|---|---|
| Special module for criminal matters: | Not complete — see module 4 |
| FIR details | Not complete — see module 4 |
| Police station | Not complete — see module 4 |
| FIR number | Not complete — see module 4 |
| Sections/Acts | Not complete — see module 4 |
| Accused details | Not complete — see module 4 |
| Complainant details | Not complete — see module 4 |
| Arrest details | Not complete — see module 4 |
| Bail application | Not complete — see module 4 |
| Anticipatory bail | Not complete — see module 4 |
| Regular bail | Not complete — see module 4 |
| Remand | Not complete — see module 4 |
| Charge sheet | Not complete — see module 4 |
| Evidence | Not complete — see module 4 |
| Witnesses | Not complete — see module 4 |
| Statements | Not complete — see module 4 |
| Trial stages | Not complete — see module 4 |
| Criminal appeal | Not complete — see module 4 |
| Revision | Not complete — see module 4 |
| Acquittal/conviction | Not complete — see module 4 |
| Custody information | Not complete — see module 4 |
| Next hearing | Not complete — see module 4 |

### 5. 🔵 Civil Case Management

| Supplied requirement or context | Assessment |
|---|---|
| Plaint | Not complete — see module 5 |
| Written statement | Not complete — see module 5 |
| Replication | Not complete — see module 5 |
| Issues | Not complete — see module 5 |
| Evidence | Not complete — see module 5 |
| Plaintiff details | Not complete — see module 5 |
| Defendant details | Not complete — see module 5 |
| Interim applications | Not complete — see module 5 |
| Injunction | Not complete — see module 5 |
| Property details | Not complete — see module 5 |
| Agreements | Not complete — see module 5 |
| Notices | Not complete — see module 5 |
| Orders | Not complete — see module 5 |
| Judgement | Not complete — see module 5 |
| Execution | Not complete — see module 5 |
| Appeal | Not complete — see module 5 |
| Revision | Not complete — see module 5 |

### 6. 👨‍⚖️ Employee & Advocate Management

| Supplied requirement or context | Assessment |
|---|---|
| Very important for a large law firm. | Not complete — see module 6 |
| Employee Types | Not complete — see module 6 |
| Senior Advocate | Not complete — see module 6 |
| Advocate | Not complete — see module 6 |
| Junior Advocate | Not complete — see module 6 |
| Associate | Not complete — see module 6 |
| Legal Assistant | Not complete — see module 6 |
| Clerk | Not complete — see module 6 |
| Typist | Not complete — see module 6 |
| Accountant | Not complete — see module 6 |
| Receptionist | Not complete — see module 6 |
| Office Manager | Not complete — see module 6 |
| IT/Admin | Not complete — see module 6 |
| Employee Management | Not complete — see module 6 |
| Employee profile | Not complete — see module 6 |
| Department | Not complete — see module 6 |
| Joining date | Not complete — see module 6 |
| Attendance | Not complete — see module 6 |
| Leave | Not complete — see module 6 |
| Salary | Not complete — see module 6 |
| Incentives | Not complete — see module 6 |
| Assigned cases | Not complete — see module 6 |
| Assigned tasks | Not complete — see module 6 |
| Performance | Not complete — see module 6 |
| Documents | Not complete — see module 6 |
| Login credentials | Not complete — see module 6 |
| Activity history | Not complete — see module 6 |
| You can also have role-based access, so a junior advocate cannot see confidential financial information or another team's cases. | Not complete — see module 6; example/context where applicable |

### 7. 📅 Court & Hearing Calendar

| Supplied requirement or context | Assessment |
|---|---|
| A powerful calendar should show: | Not complete — see module 7; example/context where applicable |
| Today | Not complete — see module 7 |
| Court | Not complete — see module 7 |
| Case | Not complete — see module 7 |
| Client | Not complete — see module 7 |
| Advocate | Not complete — see module 7 |
| Courtroom | Not complete — see module 7 |
| Hearing time | Not complete — see module 7 |
| Purpose of hearing | Not complete — see module 7 |
| Automatic Reminders | Not complete — see module 7 |
| 7 days before | Not complete — see module 7 |
| 3 days before | Not complete — see module 7 |
| 1 day before | Not complete — see module 7 |
| Same-day reminder | Not complete — see module 7 |
| Also maintain: | Not complete — see module 7 |
| Adjournment history | Not complete — see module 7 |
| Previous dates | Not complete — see module 7 |
| Next dates | Not complete — see module 7 |
| Limitation dates | Not complete — see module 7 |
| Important deadlines | Not complete — see module 7 |
| Court holidays | Not complete — see module 7 |

### 8. 📁 Document Management / Digital File

| Supplied requirement or context | Assessment |
|---|---|
| Every case should have its own secure document vault. | Not complete — see module 8; example/context where applicable |
| Documents | Not complete — see module 8 |
| FIR | Not complete — see module 8 |
| Charge sheet | Not complete — see module 8 |
| Plaint | Not complete — see module 8 |
| Written statement | Not complete — see module 8 |
| Vakalatnama | Not complete — see module 8 |
| Affidavit | Not complete — see module 8 |
| Evidence | Not complete — see module 8 |
| Court orders | Not complete — see module 8 |
| Judgements | Not complete — see module 8 |
| Notices | Not complete — see module 8 |
| Agreements | Not complete — see module 8 |
| Identity documents | Not complete — see module 8 |
| Property documents | Not complete — see module 8 |
| Photos | Not complete — see module 8 |
| Scanned documents | Not complete — see module 8 |
| PDFs | Not complete — see module 8 |
| Audio/video evidence | Not complete — see module 8 |
| Advanced Features | Not complete — see module 8 |
| Folder system | Not complete — see module 8 |
| Search | Not complete — see module 8 |
| Document preview | Not complete — see module 8 |
| Version history | Not complete — see module 8 |
| Download | Not complete — see module 8 |
| Upload | Not complete — see module 8 |
| Document sharing | Not complete — see module 8 |
| Access permission | Not complete — see module 8 |
| Activity log | Not complete — see module 8 |
| Secure document storage and client portals are already standard directions in modern legal-practice software. | Not complete — see module 8; example/context where applicable |

### 9. 👤 Client Portal

| Supplied requirement or context | Assessment |
|---|---|
| Give every client a secure login. | Not complete — see module 9; example/context where applicable |
| Client can see: | Not complete — see module 9 |
| Dashboard | Not complete — see module 9 |
| My Cases | Not complete — see module 9 |
| Case Status | Not complete — see module 9 |
| Next Hearing | Not complete — see module 9 |
| Previous Hearing | Not complete — see module 9 |
| Court Details | Not complete — see module 9 |
| Documents | Not complete — see module 9 |
| Bills | Not complete — see module 9 |
| Payments | Not complete — see module 9 |
| Advocate | Not complete — see module 9 |
| Notifications | Not complete — see module 9 |
| Client can also: | Not complete — see module 9 |
| Upload documents | Not complete — see module 9 |
| Download documents | Not complete — see module 9 |
| Request appointment | Not complete — see module 9 |
| Send message | Not complete — see module 9 |
| Receive hearing updates | Not complete — see module 9 |
| View invoices | Not complete — see module 9 |
| Make online payment | Not complete — see module 9 |

### 10. 📱 WhatsApp / SMS Notifications

| Supplied requirement or context | Assessment |
|---|---|
| Very useful when you have hundreds or thousands of clients. | Not complete — see module 10; example/context where applicable |
| Automatic messages: | Not complete — see module 10 |
| Your case ABC vs XYZ is listed for hearing on 15 September 2026 at District Court, Patna. | Not complete — see module 10; example/context where applicable |
| Other notifications: | Not complete — see module 10 |
| Hearing reminder | Not complete — see module 10 |
| Case status update | Not complete — see module 10 |
| Payment reminder | Not complete — see module 10 |
| Document request | Not complete — see module 10 |
| Appointment confirmation | Not complete — see module 10 |
| Invoice | Not complete — see module 10 |
| New order uploaded | Not complete — see module 10 |
| Some current legal platforms specifically provide WhatsApp updates and client-upload portals. | Not complete — see module 10; example/context where applicable |

### 11. 💰 Fees & Billing

| Supplied requirement or context | Assessment |
|---|---|
| Client Billing | Not complete — see module 11 |
| Consultation fee | Not complete — see module 11 |
| Case fee | Not complete — see module 11 |
| Appearance fee | Not complete — see module 11 |
| Drafting fee | Not complete — see module 11 |
| Filing fee | Not complete — see module 11 |
| Documentation fee | Not complete — see module 11 |
| Court expenses | Not complete — see module 11 |
| Travel expenses | Not complete — see module 11 |
| Miscellaneous expenses | Not complete — see module 11 |
| Payment Tracking | Not complete — see module 11 |
| Total Fee: ₹1,00,000 | Not complete — see module 11; example/context where applicable |
| Received: ₹60,000 | Not complete — see module 11; example/context where applicable |
| Pending: ₹40,000 | Not complete — see module 11; example/context where applicable |
| Include: | Not complete — see module 11 |
| Invoice | Not complete — see module 11 |
| Receipt | Not complete — see module 11 |
| Payment history | Not complete — see module 11 |
| Outstanding amount | Not complete — see module 11 |
| Due dates | Not complete — see module 11 |
| Partial payments | Not complete — see module 11 |
| Cash | Not complete — see module 11 |
| UPI | Not complete — see module 11 |
| Bank transfer | Not complete — see module 11 |
| Online payment | Not complete — see module 11 |
| GST-ready billing can also be included if applicable to the firm's requirements. | Not complete — see module 11 |

### 12. 🧑‍💼 Lead / New Client Management

| Supplied requirement or context | Assessment |
|---|---|
| Before someone becomes a client: | Not complete — see module 12 |
| Lead → Consultation → Registration → Case → Advocate Assignment | Not complete — see module 12; example/context where applicable |
| Track: | Not complete — see module 12 |
| Enquiry | Not complete — see module 12 |
| Source | Not complete — see module 12 |
| Practice area | Not complete — see module 12 |
| Consultation | Not complete — see module 12 |
| Follow-up | Not complete — see module 12 |
| Estimated fee | Not complete — see module 12 |
| Conversion | Not complete — see module 12 |
| Assigned employee | Not complete — see module 12 |

### 13. 📋 Task Management

| Supplied requirement or context | Assessment |
|---|---|
| Senior Advocate can assign: | Not complete — see module 13 |
| Task: Prepare bail application | Not complete — see module 13; example/context where applicable |
| Assigned to: Junior Advocate | Not complete — see module 13; example/context where applicable |
| Deadline: 5 September | Not complete — see module 13; example/context where applicable |
| Priority: High | Not complete — see module 13; example/context where applicable |
| Status: Pending | Not complete — see module 13; example/context where applicable |
| Statuses: | Not complete — see module 13 |
| 🟡 Pending | Not complete — see module 13 |
| 🔵 In Progress | Not complete — see module 13 |
| 🟢 Completed | Not complete — see module 13 |
| 🔴 Overdue | Not complete — see module 13 |

### 14. 🔐 Admin & Security

| Supplied requirement or context | Assessment |
|---|---|
| For a large firm, this is extremely important. | Not complete — see module 14 |
| User Roles | Not complete — see module 14 |
| Super Admin | Not complete — see module 14 |
| Complete access | Not complete — see module 14 |
| Senior Advocate | Not complete — see module 14 |
| Cases + clients + team | Not complete — see module 14 |
| Junior Advocate | Not complete — see module 14 |
| Assigned cases | Not complete — see module 14 |
| Clerk | Not complete — see module 14 |
| Hearings + documents | Not complete — see module 14 |
| Accountant | Not complete — see module 14 |
| Billing + payments | Not complete — see module 14 |
| HR/Admin | Not complete — see module 14 |
| Employees + attendance | Not complete — see module 14 |
| Client | Not complete — see module 14 |
| Own cases only | Not complete — see module 14 |
| Also include: | Not complete — see module 14 |
| Login security | Not complete — see module 14 |
| Role-based permissions | Not complete — see module 14 |
| Audit logs | Not complete — see module 14 |
| Login history | Not complete — see module 14 |
| Data backup | Not complete — see module 14 |
| Encrypted document storage | Not complete — see module 14 |
| Session management | Not complete — see module 14 |
| Two-factor authentication | Not complete — see module 14 |

### 15. 📊 Management Dashboard

| Supplied requirement or context | Assessment |
|---|---|
| The senior advocate should see everything from one dashboard. | Not complete — see module 15 |
| Dashboard | Not complete — see module 15 |
| Total Clients: 2,850 | Not complete — see module 15; example/context where applicable |
| Active Cases: 1,420 | Not complete — see module 15; example/context where applicable |
| Criminal Cases: 680 | Not complete — see module 15; example/context where applicable |
| Civil Cases: 740 | Not complete — see module 15; example/context where applicable |
| Today's Hearings: 28 | Not complete — see module 15; example/context where applicable |
| Upcoming Hearings: 156 | Not complete — see module 15; example/context where applicable |
| Pending Tasks: 87 | Not complete — see module 15; example/context where applicable |
| Pending Fees: ₹18,50,000 | Not complete — see module 15; example/context where applicable |
| Employees: 42 | Not complete — see module 15; example/context where applicable |
| Charts | Not complete — see module 15 |
| Cases by court | Not complete — see module 15 |
| Cases by practice area | Not complete — see module 15 |
| Cases by advocate | Not complete — see module 15 |
| Monthly revenue | Not complete — see module 15 |
| Pending fees | Not complete — see module 15 |
| Case status | Not complete — see module 15 |
| Upcoming hearings | Not complete — see module 15 |
| Employee workload | Not complete — see module 15 |

### 16. 📈 Reports

| Supplied requirement or context | Assessment |
|---|---|
| Generate: | Not complete — see module 16 |
| Client report | Not complete — see module 16 |
| Case report | Not complete — see module 16 |
| Criminal case report | Not complete — see module 16 |
| Civil case report | Not complete — see module 16 |
| Hearing report | Not complete — see module 16 |
| Advocate performance | Not complete — see module 16 |
| Employee report | Not complete — see module 16 |
| Fee collection | Not complete — see module 16 |
| Outstanding payment | Not complete — see module 16 |
| Expense report | Not complete — see module 16 |
| Revenue report | Not complete — see module 16 |
| Court-wise report | Not complete — see module 16 |
| Case-stage report | Not complete — see module 16 |
| Document report | Not complete — see module 16 |
| Task report | Not complete — see module 16 |
| Export to PDF / Excel. | Not complete — see module 16 |
