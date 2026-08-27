import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(), openId: varchar("openId", { length: 64 }).notNull().unique(), name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }), role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), name: varchar("name", { length: 160 }).notNull(), campaignNote: text("campaignNote").notNull(), progress: int("progress").default(0).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const presets = mysqlTable("presets", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), name: varchar("name", { length: 120 }).notNull(), description: varchar("description", { length: 240 }).notNull(), controlsJson: text("controlsJson").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const brandKits = mysqlTable("brandKits", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), name: varchar("name", { length: 120 }).notNull(), logoUrl: text("logoUrl"), primaryColor: varchar("primaryColor", { length: 20 }).notNull(), secondaryColor: varchar("secondaryColor", { length: 20 }).notNull(), accentColor: varchar("accentColor", { length: 20 }).notNull(), voiceTone: varchar("voiceTone", { length: 240 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const storyboards = mysqlTable("storyboards", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), projectId: int("projectId"), title: varchar("title", { length: 160 }).notNull(), brief: text("brief").notNull(), scenesJson: text("scenesJson").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoDrafts = mysqlTable("videoDrafts", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), storyboardId: int("storyboardId").notNull(), title: varchar("title", { length: 160 }).notNull(), status: mysqlEnum("status", ["draft", "rendering", "ready"]).default("draft").notNull(), scenesJson: text("scenesJson").notNull(), totalDuration: int("totalDuration").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const calendarItems = mysqlTable("calendarItems", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), generationId: int("generationId"), storyboardId: int("storyboardId"), scheduledFor: timestamp("scheduledFor").notNull(), channel: varchar("channel", { length: 40 }).notNull(), status: mysqlEnum("status", ["draft", "scheduled", "published"]).default("draft").notNull(), caption: text("caption").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), projectId: int("projectId"), imageUrl: text("imageUrl").notNull(), prompt: text("prompt").notNull(), controlsJson: text("controlsJson").notNull(), title: varchar("title", { length: 160 }).notNull(), framing: varchar("framing", { length: 120 }), useCase: varchar("useCase", { length: 160 }), batchId: varchar("batchId", { length: 64 }), variantIndex: int("variantIndex"), variantCount: int("variantCount"), directionHistoryJson: text("directionHistoryJson"), brandKitJson: text("brandKitJson"), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect; export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect; export type InsertProject = typeof projects.$inferInsert;
export type Preset = typeof presets.$inferSelect; export type InsertPreset = typeof presets.$inferInsert;
export type Generation = typeof generations.$inferSelect; export type InsertGeneration = typeof generations.$inferInsert;
export type BrandKit = typeof brandKits.$inferSelect; export type InsertBrandKit = typeof brandKits.$inferInsert;
export type Storyboard = typeof storyboards.$inferSelect; export type InsertStoryboard = typeof storyboards.$inferInsert;
export type CalendarItem = typeof calendarItems.$inferSelect; export type InsertCalendarItem = typeof calendarItems.$inferInsert;
export type VideoDraft = typeof videoDrafts.$inferSelect; export type InsertVideoDraft = typeof videoDrafts.$inferInsert;

export const videoRenders = mysqlTable("videoRenders", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), videoDraftId: int("videoDraftId"), operationName: varchar("operationName", { length: 255 }).notNull(), prompt: text("prompt").notNull(), platform: varchar("platform", { length: 40 }).notNull().default("Instagram Reels"), aspectRatio: varchar("aspectRatio", { length: 10 }).notNull().default("9:16"), durationSeconds: int("durationSeconds").notNull().default(8), status: mysqlEnum("status", ["queued", "rendering", "completed", "failed"]).default("queued").notNull(), queuePosition: int("queuePosition").notNull().default(0), scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), notificationSentAt: timestamp("notificationSentAt"), videoUrl: text("videoUrl"), errorMessage: text("errorMessage"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studioNotifications = mysqlTable("studioNotifications", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), renderId: int("renderId"), kind: mysqlEnum("kind", ["render_completed", "render_failed", "system"]).default("system").notNull(), title: varchar("title", { length: 160 }).notNull(), message: text("message").notNull(), readAt: timestamp("readAt"), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const platformPresets = mysqlTable("platformPresets", {
  id: int("id").autoincrement().primaryKey(), userId: int("userId").notNull(), platform: varchar("platform", { length: 40 }).notNull(), aspectRatio: varchar("aspectRatio", { length: 10 }).notNull(), durationSeconds: int("durationSeconds").notNull(), captionTemplate: text("captionTemplate").notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userPlatformUnique: uniqueIndex("platform_presets_user_platform_unique").on(table.userId, table.platform) }));

export type VideoRender = typeof videoRenders.$inferSelect; export type InsertVideoRender = typeof videoRenders.$inferInsert;
export type StudioNotification = typeof studioNotifications.$inferSelect; export type InsertStudioNotification = typeof studioNotifications.$inferInsert;
export type PlatformPreset = typeof platformPresets.$inferSelect; export type InsertPlatformPreset = typeof platformPresets.$inferInsert;
