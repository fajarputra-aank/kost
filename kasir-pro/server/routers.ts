import { COOKIE_NAME } from "@shared/const";
import type { PosCustomer, PosProduct, PosPromotion, PosSnapshot, PosTransaction } from "@shared/pos";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { getPosSnapshotForUser, savePosSnapshotForUser, SnapshotConflictError } from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const productSchema = z.object({ id: z.string(), code: z.string(), name: z.string(), category: z.string(), unit: z.string(), cost: z.number(), price: z.number(), stock: z.number(), min: z.number(), supplier: z.string(), status: z.boolean(), accent: z.string() });
const customerSchema = z.object({ id: z.string(), name: z.string(), phone: z.string(), segment: z.string(), purchases: z.number(), balance: z.number() });
const promoSchema = z.object({ id: z.string(), name: z.string(), code: z.string(), type: z.enum(["percentage", "nominal", "bogo", "bundle"]), value: z.number(), memberOnly: z.boolean(), memberLevels: z.array(z.string()), minPurchase: z.number(), active: z.boolean(), startDate: z.string(), endDate: z.string(), buyProductId: z.string().optional(), getProductId: z.string().optional(), buyQuantity: z.number().optional(), getQuantity: z.number().optional(), bundleProductIds: z.array(z.string()).optional(), bundleQuantity: z.number().optional(), bundlePrice: z.number().optional(), usageLimitPerMember: z.number().optional(), usageByMember: z.record(z.string(), z.number()).optional() });
const transactionSchema = z.object({ id: z.string(), invoice: z.string(), date: z.string(), customer: z.string(), cashier: z.string(), total: z.number(), subtotal: z.number(), discount: z.number(), payment: z.string(), status: z.string(), items: z.array(z.object({ name: z.string(), qty: z.number(), price: z.number() })), promoId: z.string().optional(), promoCode: z.string().optional(), promoMemberId: z.string().optional(), promoUsage: z.number().optional() });
const posSnapshotSchema = z.object({ products: z.array(productSchema), customers: z.array(customerSchema), promos: z.array(promoSchema), transactions: z.array(transactionSchema) }).passthrough();
const posPayload = z.string().min(2).max(4_000_000).superRefine((value, ctx) => { try { const result = posSnapshotSchema.safeParse(JSON.parse(value)); if (!result.success) ctx.addIssue({ code: "custom", message: "POS snapshot tidak sesuai kontrak domain." }); } catch { ctx.addIssue({ code: "custom", message: "POS snapshot bukan JSON yang valid." }); } });
const entitySchema = z.enum(["products", "customers", "promos", "transactions"]);
const upsertEntityInput = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("products"), baseVersion: z.number().int().min(0), record: productSchema }),
  z.object({ entity: z.literal("customers"), baseVersion: z.number().int().min(0), record: customerSchema }),
  z.object({ entity: z.literal("promos"), baseVersion: z.number().int().min(0), record: promoSchema }),
  z.object({ entity: z.literal("transactions"), baseVersion: z.number().int().min(0), record: transactionSchema }),
]);
const removeEntityInput = z.object({ entity: entitySchema, baseVersion: z.number().int().min(0), id: z.string().min(1) });

type EntityKey = "products" | "customers" | "promos" | "transactions";

function emptySnapshot(): PosSnapshot { return { products: [], customers: [], promos: [], transactions: [] }; }
function decodeSnapshot(payload: string): PosSnapshot {
  const parsed = posSnapshotSchema.parse(JSON.parse(payload));
  return parsed as PosSnapshot;
}
async function saveEntity(userId: number, entity: EntityKey, baseVersion: number, record: { id: string } | null, remove = false) {
  const current = await getPosSnapshotForUser(userId);
  const snapshot = current ? decodeSnapshot(current.payload) : emptySnapshot();
  const records = snapshot[entity] as Array<{ id: string }>;
  const nextRecords = remove ? records.filter((item) => item.id !== record?.id) : [...records.filter((item) => item.id !== record?.id), record as { id: string }];
  snapshot[entity] = nextRecords as never;
  return savePosSnapshotForUser(userId, baseVersion, JSON.stringify(snapshot));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  sync: router({
    pull: protectedProcedure.query(async ({ ctx }) => { const snapshot = await getPosSnapshotForUser(ctx.user.id); return snapshot ? { status: "synced" as const, ...snapshot } : { status: "empty" as const, version: 0, payload: null }; }),
    push: protectedProcedure.input(z.object({ baseVersion: z.number().int().min(0), payload: posPayload })).mutation(async ({ ctx, input }) => { try { return { status: "synced" as const, ...(await savePosSnapshotForUser(ctx.user.id, input.baseVersion, input.payload)) }; } catch (error) { if (error instanceof SnapshotConflictError) throw new TRPCError({ code: "CONFLICT", message: error.message, cause: { currentVersion: error.currentVersion, currentPayload: error.currentPayload } }); throw error; } }),
  }),
  data: router({
    list: protectedProcedure.input(z.object({ entity: entitySchema })).query(async ({ ctx, input }) => { const snapshot = await getPosSnapshotForUser(ctx.user.id); if (!snapshot) return []; const decoded = decodeSnapshot(snapshot.payload); return decoded[input.entity]; }),
    upsert: protectedProcedure.input(upsertEntityInput).mutation(async ({ ctx, input }) => { try { const result = await saveEntity(ctx.user.id, input.entity, input.baseVersion, input.record as { id: string }); return { status: "synced" as const, entity: input.entity, ...result }; } catch (error) { if (error instanceof SnapshotConflictError) throw new TRPCError({ code: "CONFLICT", message: error.message, cause: { currentVersion: error.currentVersion, currentPayload: error.currentPayload } }); throw error; } }),
    remove: protectedProcedure.input(removeEntityInput).mutation(async ({ ctx, input }) => { try { const result = await saveEntity(ctx.user.id, input.entity, input.baseVersion, { id: input.id }, true); return { status: "synced" as const, entity: input.entity, ...result }; } catch (error) { if (error instanceof SnapshotConflictError) throw new TRPCError({ code: "CONFLICT", message: error.message, cause: { currentVersion: error.currentVersion, currentPayload: error.currentPayload } }); throw error; } }),
  }),
});

export type AppRouter = typeof appRouter;
