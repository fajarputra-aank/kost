---
name: kasir-pro-pos-workflow
description: Build and extend Indonesian offline-first POS applications with camera barcode checkout, thermal printing, member promotions, BOGO/bundling rules, backend synchronization, responsive ledger-style UI, and GitHub delivery. Use when implementing or upgrading a KASIR PRO-like cashier application.
---

# KASIR PRO POS Workflow

Use this skill to extend a browser POS without losing checkout speed, data safety, or the operational visual system. Keep the interface in Indonesian unless the user requests another language.

## Execution order

1. Inspect the existing project, data model, routes, local persistence, and delivery repository. Preserve working flows before changing schemas or navigation.
2. Write a short design and domain decision record. Keep the Paper Ledger Modernism vocabulary when working on KASIR PRO: warm paper workspace, ink-dark rail, tangerine action color, ruled tables, paper tabs, receipt labels, and asymmetric operational sheets.
3. Define shared types first. At minimum model `Product`, `Customer`, `MemberLevel`, `Promo`, `PromoUsage`, `CartItem`, `Transaction`, and `SyncRecord`. Make promo types explicit: percentage, fixed amount, BOGO, and bundle.
4. Preserve offline-first behavior. Read from the local cache immediately, write optimistic local changes, enqueue mutations with idempotency keys, and show a visible `Local`, `Pending sync`, or `Synced` state. Never delete local data merely because the network is unavailable.
5. Implement barcode checkout with a camera adapter. Prefer the browser `BarcodeDetector` API when available, request camera access only after a user action, stop media tracks on close/unmount, and provide a manual barcode input fallback for unsupported browsers, denied permission, or desktop devices without a camera. On a match, add or increment the product in the cart and reject inactive or out-of-stock products.
6. Implement thermal printing through a capability-detected adapter. Offer browser print as the universal fallback. For direct thermal output, support Web Serial or WebUSB only after explicit user connection, keep printer width configurable (58mm/80mm), generate receipt and label payloads separately, and include a test-print action. Do not claim direct printing is available when the browser or device does not expose it.
7. Implement promotion evaluation as a pure function. Filter by active status, date range, minimum subtotal, member level, and remaining per-member usage. Evaluate BOGO and bundle requirements before calculating the benefit. Choose the highest-value eligible promotion according to an explicit tie-break rule, and prevent stacking unless a rule explicitly allows it. Store the applied promotion and usage reservation with the transaction.
8. Enforce usage limits on the backend when synchronization is enabled. Treat frontend eligibility as a preview only. Use an atomic server-side usage increment or idempotent transaction command so repeated clicks, retries, and multiple devices cannot exceed a member's limit.
9. Add administration screens for member discount rates, promo definitions, usage limits, active state, and audit history. Show the exact reason when a promo is rejected and display remaining usage after a successful checkout.
10. Verify success and failure paths: camera permission denied, unsupported BarcodeDetector, unknown barcode, out-of-stock item, member-only promo with non-member, minimum subtotal failure, exhausted usage limit, BOGO shortage, incomplete bundle, duplicate retry, offline mutation, sync conflict, printer unavailable, and browser print fallback.
11. Run the project type check, production build, responsive screenshots for POS/promo/barcode, and inspect browser console/network logs. Save one complete checkpoint only after the feature set is coherent.
12. Deliver the checkpoint and, when requested, copy the complete application into the user's selected GitHub repository. Inspect the repository first, preserve unrelated work, commit with a descriptive message, and push the requested branch. Report the exact repository and commit.

## Promotion rules

Use a stable shape similar to:

```ts
type Promo = {
  id: string;
  code: string;
  name: string;
  kind: "percentage" | "fixed" | "bogo" | "bundle";
  value: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  minSubtotal: number;
  memberOnly: boolean;
  memberLevels: string[];
  usageLimitPerMember?: number;
  bogo?: { buyProductId: string; buyQty: number; getProductId: string; getQty: number };
  bundle?: { productIds: string[]; requiredQty: number; bundlePrice: number };
};
```

Represent usage separately by `promoId`, `customerId`, `usedCount`, and transaction references. Keep all money calculations in integer minor units where possible, round once at the final discount boundary, and show the calculation line-by-line in checkout.

## Hardware and browser constraints

Camera access requires a secure context and user permission. Thermal direct printing is not portable across browsers; keep browser print and downloadable receipt/label output as reliable fallback paths. Avoid background polling in a static frontend. Use the backend sync service only after the full-stack feature is enabled and provide a recoverable offline queue.

## Quality bar

Prefer small adapters and pure evaluators over browser-specific logic scattered through page components. Preserve keyboard shortcuts, mobile checkout usability, visible focus states, reduced-motion support, and the established stationery/ledger motif. Never fabricate reviews, ratings, or testimonials. Do not place large media inside the project; use the project asset workflow for visual assets.

## Delivery checklist

- Type check passes.
- Production build passes.
- Camera scanner has a manual fallback and cleans up media tracks.
- Receipt and label printing expose capability and fallback states.
- Promo math is deterministic and does not double-discount.
- Per-member usage is enforced server-side when multi-device sync is active.
- Local cache survives offline reload and queued writes are visible.
- Desktop and mobile POS/promo/barcode screens are visually verified.
- Checkpoint is saved.
- Requested GitHub repository and commit are reported.
