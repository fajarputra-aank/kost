export type StoryboardScene = { sceneNumber: number; duration: number; visual: string; dialogue: string; onScreenText: string; shot: string; status?: "draft" | "needs-review" | "ready" };

export function normalizeStoryboardScenes(value: unknown): StoryboardScene[] {
  if (!Array.isArray(value)) return [];
  return value.filter((scene): scene is StoryboardScene => Boolean(scene && typeof scene === "object" && typeof (scene as StoryboardScene).sceneNumber === "number" && typeof (scene as StoryboardScene).duration === "number" && typeof (scene as StoryboardScene).visual === "string" && typeof (scene as StoryboardScene).dialogue === "string" && typeof (scene as StoryboardScene).onScreenText === "string" && typeof (scene as StoryboardScene).shot === "string"));
}

export function buildStoryboardText(title: string, brief: string, scenes: StoryboardScene[]) {
  return [`JUDUL: ${title}`, `BRIEF: ${brief}`, ...scenes.map(scene => `SCENE ${scene.sceneNumber} · ${scene.duration} detik · ${scene.status ?? "draft"}\nVisual: ${scene.visual}\nDialog: ${scene.dialogue}\nTeks layar: ${scene.onScreenText}\nShot: ${scene.shot}`)].join("\n\n");
}

export function buildExportManifest(project: string, brandKit: unknown, assets: Array<{ id: number; title: string; prompt: string; createdAt: Date | string }>) {
  return { project, brandKit, assets: assets.map(item => ({ id: item.id, title: item.title, prompt: item.prompt, createdAt: item.createdAt })) };
}
