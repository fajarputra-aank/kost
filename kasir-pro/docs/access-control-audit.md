# KASIR PRO Access-Control Audit

## Policy

Only the `ADMIN` role may open Admin-only routes or execute destructive data operations. The shared policy lives in `shared/access.ts`; the app shell consumes `getPageAccess()` and destructive handlers consume `canDeleteData()`.

## Audited surfaces

| Surface | Operation | Enforcement |
|---|---|---|
| Pengaturan | Open route, reset store identity, reset receipt/logo/template, clear demo data | Admin-only route plus `canDeleteData()` in the management center |
| Produk | Delete product | `canDeleteData()` before confirmation and mutation |
| Customer | Delete/reset | No destructive handler exists in the current Customer screen; bulk/customer deletion is only exposed through the Admin management center |
| Member | Delete/reset | No destructive handler exists in the current Member screen; member data reset is only exposed through the Admin management center |
| Promo | Delete promo | Admin-only route plus `canDeleteData()` before confirmation and mutation |
| User management | Create, edit, activate/deactivate Kasir accounts | Admin-only `users` route; managed accounts are persisted in the offline-first snapshot and inactive Kasir sessions are invalidated |
| Transaksi | Void transaction | Existing explicit `session.role` Admin check before prompt and mutation |
| Backend sync | Pull/push snapshot | Pull/push require an authenticated context; typed entity removal uses `adminProcedure` and rejects non-Admin callers before storage mutation |
| Kasir operations | Checkout, barcode scan, permitted catalog views | Available to Kasir; checkout does not delete persistent master data |

## Verification

The route resolver is tested for Admin settings access, Kasir settings denial, and Kasir POS access in `shared/access.test.ts`. The destructive-action policy is tested for Admin/Kasir roles, and `server/sync.test.ts` verifies that an authenticated non-Admin cannot call `data.remove`. The UI was visually exercised with development-only Kasir preview sessions on desktop and mobile. The preview switch is guarded by `import.meta.env.DEV` and is not available in production builds.
