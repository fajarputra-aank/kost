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
- [ ] Save one completed checkpoint after all requested features are stable.
- [x] Clone the selected GitHub repository, copy the complete application, commit, and push.

## Gap resolution before final checkpoint

- [x] Create shared domain contracts outside `Home.tsx` and import them from client/server.
- [x] Add typed backend CRUD procedures for products, customers, promos, and transactions in addition to snapshot sync.
- [x] Implement a retryable pending-sync queue with replay semantics for failed cloud pushes.
- [x] Add WebUSB capability detection and configurable printer paper width.
- [x] Reconcile promo usage from recorded transaction history, not only mutable counters.
- [x] Evaluate all eligible promotions and choose the best eligible benefit without stacking conflicts.
- [ ] Commit and push the copied KASIR PRO source to the selected GitHub repository.
- [x] Make checkout compare manual and automatic eligible promos and always apply the highest valid discount.
- [x] Add a regression test covering weaker manual promo versus stronger eligible promo selection.
