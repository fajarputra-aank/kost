export type DirectionEntry = { source: string; label: string; prompt: string; createdAt: string };

export function parseDirectionHistory(value: string | null | undefined, fallbackPrompt: string, fallbackCreatedAt: string): DirectionEntry[] {
  try {
    const parsed = value ? JSON.parse(value) as DirectionEntry[] : [];
    if (!Array.isArray(parsed) || parsed.length === 0) return [{ source: "Generate", label: "Prompt tersimpan", prompt: fallbackPrompt, createdAt: fallbackCreatedAt }];
    return parsed.filter(entry => entry && typeof entry.prompt === "string" && typeof entry.createdAt === "string");
  } catch {
    return [{ source: "Generate", label: "Prompt tersimpan", prompt: fallbackPrompt, createdAt: fallbackCreatedAt }];
  }
}
