export type StudioControls = {
  persona: string;
  appearance: string;
  expression: string;
  outfit: string;
  setting: string;
  shotType: string;
  useCase: string;
};

export function buildGenerationPrompt(controls: StudioControls) {
  return [
    "Kreator UGC virtual fotorealistis, terasa seperti manusia nyata, tekstur kulit natural, mata dan rambut realistis, fotografi komersial editorial.",
    `Persona: ${controls.persona}.`,
    `Penampilan: ${controls.appearance}.`,
    `Ekspresi: ${controls.expression}.`,
    `Pakaian: ${controls.outfit}.`,
    `Latar: ${controls.setting}.`,
    `Jenis pengambilan: ${controls.shotType}.`,
    `Kebutuhan UGC: ${controls.useCase}.`,
    "Energi kreator yang spontan, pencahayaan meyakinkan, ketidaksempurnaan yang halus, kualitas iklan sosial premium, tanpa teks, tanpa watermark, tanpa fitur yang janggal.",
  ].join(" ");
}

export const studioOptions = {
  persona: ["Kreator yang dipimpin founder", "Reviewer kecantikan", "Pelatih kebugaran", "Penggemar teknologi", "Kreator gaya hidup sehari-hari"],
  appearance: ["Kulit olive hangat, rambut gelap bergelombang", "Kulit cerah berbintik, rambut bob tembaga", "Kulit cokelat gelap, rambut ikal natural", "Kulit keemasan, rambut hitam lurus", "Kulit medium, rambut cokelat lembut bergelombang"],
  expression: ["Senyum hangat ke arah kamera", "Ekspresi penasaran saat berbicara", "Rekomendasi penuh keyakinan", "Ketenangan pagi yang lembut", "Kejutan yang ceria"],
  outfit: ["Rajut krem minimalis", "Overshirt sage lembut", "Blazer hitam elegan", "Denim santai dan kaus putih", "Busana olahraga terracotta"],
  setting: ["Dapur apartemen yang disinari matahari", "Studio kreator minimalis", "Kamar mandi butik", "Sudut kafe yang tenang", "Meja rias kamar tidur yang hangat"],
  shotType: ["Selfie close-up vertikal", "Potret medium menghadap kamera", "Pengambilan bergaya cermin genggam", "Frame gaya hidup tiga perempat", "Frame hero dengan produk di tangan"],
  useCase: ["Testimoni produk TikTok", "Hook skincare Instagram Reels", "Cerita founder untuk Meta Ads", "Unboxing UGC", "Rekomendasi produk gaya hidup"],
} as const;

export type StudioOptionKey = keyof typeof studioOptions;
