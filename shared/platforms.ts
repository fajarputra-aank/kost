export const SOCIAL_PLATFORMS = ["Instagram Reels", "TikTok", "YouTube Shorts", "LinkedIn"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const VIDEO_DURATIONS = [4, 6, 8] as const;
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];
export type PlatformPreset = { platform: SocialPlatform; aspectRatio: "9:16" | "16:9"; durationSeconds: VideoDuration; captionTemplate: string };

export const DEFAULT_PLATFORM_PRESETS: PlatformPreset[] = [
  { platform: "Instagram Reels", aspectRatio: "9:16", durationSeconds: 8, captionTemplate: "{brief} ✦ Simpan untuk referensi dan bagikan ke teman yang membutuhkannya. #reels #ugc" },
  { platform: "TikTok", aspectRatio: "9:16", durationSeconds: 8, captionTemplate: "POV: {brief} — kamu perlu coba ini. Tulis pendapatmu di komentar! #fyp #tiktokugc" },
  { platform: "YouTube Shorts", aspectRatio: "9:16", durationSeconds: 8, captionTemplate: "{brief} | Lihat sampai akhir untuk detailnya. #shorts #creator" },
  { platform: "LinkedIn", aspectRatio: "16:9", durationSeconds: 8, captionTemplate: "{brief} Berikut pelajaran praktis yang bisa langsung diterapkan tim Anda. #creator #brandstory" },
];

export function captionFromTemplate(template: string, brief: string) { return template.replaceAll("{brief}", brief.trim()).trim(); }
