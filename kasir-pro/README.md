# KASIR PRO

Full-stack offline-first POS workspace with camera barcode scanning, Web Serial thermal printing with browser fallback, WebUSB capability detection, member discounts, BOGO and bundle promotions, per-member limits, automatic best-promo selection, and authenticated cross-device snapshot synchronization.

## Local development

```bash
pnpm install
pnpm dev
```

Validate with `pnpm check`, `pnpm test`, and `pnpm build`. The database migration is in `drizzle/0000_magenta_kid_colt.sql` and should be applied through the managed database workflow.

Camera scanning requires a secure context and camera permission. Direct ESC/POS printing uses Web Serial in Chrome/Edge desktop; browser print fallback remains available when Web Serial is unsupported.
