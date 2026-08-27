import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  listGenerations: vi.fn(),
  deleteGeneration: vi.fn(),
  createGeneration: vi.fn(),
  getBrandKit: vi.fn(),
  upsertBrandKit: vi.fn(),
  createStoryboard: vi.fn(),
  createVideoDraft: vi.fn(),
  listStoryboards: vi.fn(),
  createCalendarItem: vi.fn(),
  listCalendarItems: vi.fn(),
  listVideoDrafts: vi.fn(),
  updateCalendarItem: vi.fn(),
  listPlatformPresets: vi.fn(),
  upsertPlatformPreset: vi.fn(),
  listStudioNotifications: vi.fn(),
  markStudioNotificationRead: vi.fn(),
}));
const imageMocks = vi.hoisted(() => ({ generateImage: vi.fn() }));
const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/imageGeneration", () => imageMocks);
vi.mock("./_core/llm", () => llmMocks);
vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

function context(userId = 42): TrpcContext {
  return { user: { id: userId, openId: `user-${userId}`, name: "Creator", email: "creator@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const controls = { persona: "Founder-led creator", appearance: "Warm olive skin", expression: "Warm smile", outfit: "Cream knitwear", setting: "Sunlit kitchen", shotType: "Vertical close-up", useCase: "Product testimonial" };

describe("studio ownership and generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the authenticated user id to gallery listing and deletion", async () => {
    dbMocks.listGenerations.mockResolvedValue([]);
    dbMocks.deleteGeneration.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context(77));
    await caller.studio.list();
    await caller.studio.remove({ id: 9 });
    expect(dbMocks.listGenerations).toHaveBeenCalledWith(77, { projectId: undefined, useCase: undefined, since: undefined });
    expect(dbMocks.deleteGeneration).toHaveBeenCalledWith(77, 9);
  });

  it("forwards project, use case, and date filters to the scoped gallery query", async () => {
    dbMocks.listGenerations.mockResolvedValue([]);
    await appRouter.createCaller(context(77)).studio.list({ projectId: 4, useCase: "Product testimonial", days: 7 });
    expect(dbMocks.listGenerations).toHaveBeenCalledWith(77, { projectId: 4, useCase: "Product testimonial", since: expect.any(Date) });
  });

  it("persists the generated image together with prompt metadata", async () => {
    imageMocks.generateImage.mockResolvedValue({ url: "/manus-storage/character.png" });
    dbMocks.createGeneration.mockImplementation(async input => ({ id: 3, createdAt: new Date(), ...input }));
    const directionHistory = [{ source: "Copilot", label: "Brief disempurnakan", prompt: "Arahan serum yang lebih kuat", createdAt: "2026-08-27T14:00:00.000Z" }];
    const created = await appRouter.createCaller(context(12)).studio.generate({ title: "Sage hook", controls, framing: "Hero produk", batchId: "batch-123", variantIndex: 2, variantCount: 3, directionHistory });
    expect(dbMocks.createGeneration).toHaveBeenCalledWith(expect.objectContaining({ userId: 12, imageUrl: "/manus-storage/character.png", title: "Sage hook", controlsJson: JSON.stringify(controls), framing: "Hero produk", batchId: "batch-123", variantIndex: 2, variantCount: 3, useCase: "Product testimonial", directionHistoryJson: JSON.stringify(directionHistory), brandKitJson: null }));
    expect(created?.imageUrl).toBe("/manus-storage/character.png");
    expect(created?.prompt).toContain("Kebutuhan UGC: Product testimonial.");
  });

  it("scopes brand kit and calendar procedures to the authenticated user", async () => {
    dbMocks.getBrandKit.mockResolvedValue(undefined); dbMocks.upsertBrandKit.mockResolvedValue({ id: 4, userId: 77, name: "Kit", logoUrl: null, primaryColor: "#17211e", secondaryColor: "#edf4d6", accentColor: "#d6f37b", voiceTone: "Hangat", createdAt: new Date(), updatedAt: new Date() }); dbMocks.createCalendarItem.mockResolvedValue({ id: 8 }); dbMocks.listCalendarItems.mockResolvedValue([]);
    const caller = appRouter.createCaller(context(77));
    await caller.studio.brandKit(); await caller.studio.saveBrandKit({ name: "Kit", logoUrl: "", primaryColor: "#17211e", secondaryColor: "#edf4d6", accentColor: "#d6f37b", voiceTone: "Hangat" });
    await caller.studio.scheduleContent({ storyboardId: 3, scheduledFor: new Date("2026-09-01"), channel: "TikTok", caption: "Hook", status: "scheduled" }); await caller.studio.calendar();
    expect(dbMocks.getBrandKit).toHaveBeenCalledWith(77); expect(dbMocks.upsertBrandKit).toHaveBeenCalledWith(77, expect.objectContaining({ name: "Kit" })); expect(dbMocks.createCalendarItem).toHaveBeenCalledWith(expect.objectContaining({ userId: 77, storyboardId: 3 })); expect(dbMocks.listCalendarItems).toHaveBeenCalledWith(77, { monthStart: undefined, monthEnd: undefined, channel: undefined, status: undefined });
  });

  it("passes calendar month and filters to the user-scoped helper", async () => {
    dbMocks.listCalendarItems.mockResolvedValue([]);
    await appRouter.createCaller(context(77)).studio.calendar({ month: "2026-09", channel: "TikTok", status: "scheduled" });
    expect(dbMocks.listCalendarItems).toHaveBeenCalledWith(77, expect.objectContaining({ channel: "TikTok", status: "scheduled", monthStart: expect.any(Date), monthEnd: expect.any(Date) }));
  });

  it("scopes platform preset and notification procedures to the authenticated user", async () => {
    dbMocks.listPlatformPresets.mockResolvedValue([]); dbMocks.upsertPlatformPreset.mockResolvedValue({ id: 3 }); dbMocks.listStudioNotifications.mockResolvedValue([]); dbMocks.markStudioNotificationRead.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context(77));
    await caller.studio.platformPresets(); await caller.studio.savePlatformPreset({ platform: "TikTok", aspectRatio: "9:16", durationSeconds: 6, captionTemplate: "{brief} #ugc" }); await caller.studio.notifications({ unreadOnly: true }); await caller.studio.markNotificationRead({ id: 9 });
    expect(dbMocks.listPlatformPresets).toHaveBeenCalledWith(77); expect(dbMocks.upsertPlatformPreset).toHaveBeenCalledWith(77, expect.objectContaining({ platform: "TikTok", durationSeconds: 6 })); expect(dbMocks.listStudioNotifications).toHaveBeenCalledWith(77, true); expect(dbMocks.markStudioNotificationRead).toHaveBeenCalledWith(77, 9);
  });

  it("moves a calendar item with the authenticated user scope", async () => {
    dbMocks.updateCalendarItem.mockResolvedValue({ id: 8, userId: 77, scheduledFor: new Date("2026-09-03"), channel: "TikTok", status: "published" });
    await appRouter.createCaller(context(77)).studio.moveCalendarItem({ id: 8, scheduledFor: new Date("2026-09-03"), channel: "TikTok", status: "published" });
    expect(dbMocks.updateCalendarItem).toHaveBeenCalledWith(77, 8, { scheduledFor: new Date("2026-09-03"), channel: "TikTok", status: "published" });
  });

  it("uploads a sanitized brand logo through storage", async () => {
    storageMocks.storagePut.mockResolvedValue({ key: "brand-kits/77/logo.png", url: "/manus-storage/brand-kits/77/logo.png" });
    const result = await appRouter.createCaller(context(77)).studio.uploadBrandLogo({ fileName: "my logo.png", mimeType: "image/png", base64: Buffer.from("a-valid-logo-payload").toString("base64") });
    expect(storageMocks.storagePut).toHaveBeenCalledWith("brand-kits/77/my-logo.png", expect.any(Buffer), "image/png");
    expect(result.url).toBe("/manus-storage/brand-kits/77/logo.png");
  });

  it("creates a structured storyboard and explicit video draft", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ scenes: [{ sceneNumber: 1, duration: 5, visual: "Close-up creator", dialogue: "Hai", onScreenText: "Baru", shot: "Close-up" }, { sceneNumber: 2, duration: 4, visual: "Product reveal", dialogue: "Coba ini", onScreenText: "Lihat hasilnya", shot: "Medium" }, { sceneNumber: 3, duration: 3, visual: "CTA", dialogue: "Simpan video ini", onScreenText: "Coba sekarang", shot: "Hero" }] }) } }] });
    dbMocks.createStoryboard.mockResolvedValue({ id: 11, title: "Draf serum", brief: "Brief", scenesJson: "[]" }); dbMocks.createVideoDraft.mockResolvedValue({ id: 12, status: "draft" });
    const result = await appRouter.createCaller(context(91)).studio.generateStoryboard({ title: "Draf serum", brief: "Buat video serum yang natural" });
    expect(dbMocks.createStoryboard).toHaveBeenCalledWith(expect.objectContaining({ userId: 91, title: "Draf serum" })); expect(dbMocks.createVideoDraft).toHaveBeenCalledWith(expect.objectContaining({ userId: 91, storyboardId: 11, status: "draft", totalDuration: 12 })); expect(result.id).toBe(11);
  });

  it("returns structured assistant controls and suggestions", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ prompt: "A warm serum recommendation", suggestions: ["Add a clear hook"], controls }) } }] });
    const result = await appRouter.createCaller(context()).studio.improveBrief({ brief: "A creator recommends my serum in a sunny bathroom" });
    expect(result.controls.setting).toBe("Sunlit kitchen");
    expect(result.suggestions).toEqual(["Add a clear hook"]);
    expect(result.prompt).toContain("serum");
  });
});
