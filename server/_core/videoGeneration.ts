import { ENV } from "./env";
import { storagePut } from "../storage";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VIDEO_MODEL = "veo-3.1-generate-preview";

type GeminiOperation = { name?: string; done?: boolean; error?: { message?: string }; response?: { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } } };

function headers() { return { "Content-Type": "application/json", "x-goog-api-key": ENV.geminiApiKey }; }
function ensureKey() { if (!ENV.geminiApiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi"); }

export async function startVeoRender(prompt: string, aspectRatio = "9:16", durationSeconds: 4 | 6 | 8 = 8) {
  ensureKey();
  const response = await fetch(`${GEMINI_BASE_URL}/models/${VIDEO_MODEL}:predictLongRunning`, { method: "POST", headers: headers(), body: JSON.stringify({ instances: [{ prompt }], parameters: { aspectRatio, durationSeconds: String(durationSeconds), resolution: "720p" } }) });
  if (!response.ok) throw new Error(`Gemini gagal memulai render (${response.status})`);
  const operation = await response.json() as GeminiOperation;
  if (!operation.name) throw new Error("Gemini tidak mengembalikan nama operasi");
  return operation;
}

export async function pollVeoRender(operationName: string, userId: number) {
  ensureKey();
  const response = await fetch(`${GEMINI_BASE_URL}/${operationName}`, { headers: { "x-goog-api-key": ENV.geminiApiKey } });
  if (!response.ok) throw new Error(`Gemini gagal memeriksa render (${response.status})`);
  const operation = await response.json() as GeminiOperation;
  if (!operation.done) return { status: "rendering" as const, operation };
  if (operation.error?.message) return { status: "failed" as const, operation, errorMessage: operation.error.message };
  const uri = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) return { status: "failed" as const, operation, errorMessage: "Gemini selesai tanpa URL video" };
  const videoResponse = await fetch(uri, { headers: { "x-goog-api-key": ENV.geminiApiKey } });
  if (!videoResponse.ok) throw new Error(`Gemini gagal mengunduh MP4 (${videoResponse.status})`);
  const bytes = Buffer.from(await videoResponse.arrayBuffer());
  const stored = await storagePut(`videos/${userId}/${Date.now()}.mp4`, bytes, "video/mp4");
  return { status: "completed" as const, operation, videoUrl: stored.url };
}
