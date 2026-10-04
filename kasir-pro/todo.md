# KASIR PRO — Full Upgrade Checklist

## Reusable skill

- [x] Initialize a reusable KASIR PRO workflow skill with `/home/ubuntu/skills/skill-creator/scripts/init_skill.py`.
- [x] Write concise reusable instructions covering offline-first POS, barcode camera, thermal printing, member promotions, backend sync, visual verification, and delivery.
- [x] Validate the skill with `quick_validate.py` and prepare `SKILL.md` for delivery.

## Full-stack synchronization

- [x] Upgrade the web project to backend/database/user support.
- [x] Define shared data contracts for products, customers, members, promos, transactions, and usage limits.
- [x] Add backend CRUD and sync endpoints with safe fallback/error states.
- [x] Migrate local data to the backend and preserve offline-first behavior with a pending-sync queue.
- [x] Surface sync status and conflict handling in the UI.

## Thermal printing

- [x] Add a print adapter with browser print fallback and Web Serial/WebUSB capability detection.
- [x] Print thermal receipts and barcode labels from checkout/product tools.
- [x] Add printer setup, connection, paper width, and test-print controls.

## Advanced promotions

- [x] Extend promo rules with BOGO and bundle definitions.
- [x] Add per-member, per-promo usage limits and transaction history checks.
- [x] Apply the best eligible promotion without double-discounting.
- [x] Display applied benefit, remaining usage, and validation messages at checkout.

## Delivery

- [x] Run type checks, production build, runtime checks, and responsive screenshots.
- [x] Save one completed checkpoint after all requested features are stable.
- [x] Clone the selected GitHub repository, copy the complete application, commit, and push.

## Gap resolution before final checkpoint

- [x] Create shared domain contracts outside `Home.tsx` and import them from client/server.
- [x] Add typed backend CRUD procedures for products, customers, promos, and transactions in addition to snapshot sync.
- [x] Implement a retryable pending-sync queue with replay semantics for failed cloud pushes.
- [x] Add WebUSB capability detection and configurable printer paper width.
- [x] Reconcile promo usage from recorded transaction history, not only mutable counters.
- [x] Evaluate all eligible promotions and choose the best eligible benefit without stacking conflicts.
- [x] Commit and push the copied KASIR PRO source to the selected GitHub repository.
- [x] Make checkout compare manual and automatic eligible promos and always apply the highest valid discount.
- [x] Add a regression test covering weaker manual promo versus stronger eligible promo selection.

## Receipt template and logo upgrade

- [x] Add persistent receipt-template settings for alignment, visibility toggles, header/footer text, and paper width.
- [x] Add local logo upload with image validation, resize/compression, preview, and restore/remove controls.
- [x] Build a live receipt preview using the same data model as thermal and browser printing.
- [x] Apply the customized template and logo to ESC/POS thermal output and browser print output.
- [x] Update the reusable KASIR PRO skill with receipt customization and logo workflows.
- [x] Validate the skill, run type checks/tests/build, and verify responsive settings and preview screens.
- [x] Add an explicit reset-to-default-logo control in receipt settings.
- [x] Make logo processing compression-aware, preserve a suitable image format, and enforce a bounded persisted result size.

## Final delivery for receipt customization

- [x] Refresh the selected GitHub copy with the receipt-template and logo changes.
- [x] Save the final receipt customization checkpoint for delivery.

## Data management and demo cleanup

- [x] Add a central data-management menu for store identity, logo, products, categories, customers/members, suppliers, promos, transactions, expenses, and settings.
- [x] Add edit, save, delete, bulk-delete, and clear-all controls with visible counts and confirmations.
- [x] Add a safe delete-all-example-data flow that preserves app structure, store settings, and the active session.
- [x] Ensure reset/restore normalizes receipt-template settings and does not silently recreate demo records.
- [x] Verify persistence, destructive-action guards, responsive layout, type checks, tests, and build.
- [x] Save and publish the final data-management checkpoint.
- [x] Add explicit central entries for store identity, logo/template settings, and member levels.
- [x] Add guarded reset controls for store settings and receipt-template/logo data while preserving app structure and session.
- [x] Re-run verification after every listed management domain is represented in the center.

## Admin-only access control

- [x] Restrict Pengaturan navigation and direct route access to Admin sessions.
- [x] Restrict all per-domain reset/delete actions and delete-all-example-data to Admin sessions.
- [x] Keep Kasir checkout and permitted operational menus usable while showing clear access-denied feedback.
- [x] Add regression coverage for Admin versus Kasir permissions and verify type checks, tests, build, and responsive UI.
- [x] Save and publish the access-control checkpoint.

## Access-control gap resolution

- [x] Audit every destructive action across customer, member, product, promo, transaction, settings reset, demo wipe, and backend mutations; enforce Admin-only guards consistently.
- [x] Add regression coverage for the audited destructive paths and confirm the current runtime logs are healthy.
- [x] Capture fresh desktop and mobile verification for Admin-restricted and Kasir-allowed states.

## Final access-control evidence

- [x] Add explicit session guards to any customer/member destructive handlers if present, and document the backend mutation audit.
- [x] Add route-level regression tests for Admin settings access, Kasir denial, and permitted Kasir POS access.
- [x] Capture or exercise a Kasir session that reaches the access-denied state for Pengaturan while preserving normal Kasir checkout access.

## Final access-control audit evidence

- [x] Add a documented audit matrix covering product, customer, member, promo, transaction void, settings reset, demo wipe, and backend sync mutation paths.
- [x] Refactor the app shell to use a shared route-access resolver and test the actual Admin/Kasir page decisions through that resolver.
- [x] Re-run checks and screenshots after the evidence changes.
- [x] Save the access-control checkpoint.
- [x] Capture fresh desktop and mobile screenshots after the final route-resolver and audit-document changes.
- [x] Capture a fresh mobile screenshot pass after the final route-resolver and audit-document changes, including Kasir-denied Pengaturan and Kasir-allowed Kasir views.
- [x] Guard the backend entity-removal mutation with `adminProcedure` and add a non-Admin regression test.

## User management

- [x] Add persistent Admin/Kasir account records with active status and backward-compatible local-data normalization.
- [x] Add Admin-only user directory with create, edit, activate, and deactivate actions.
- [x] Connect local login to managed accounts and invalidate a Kasir session after deactivation.
