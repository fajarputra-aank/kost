import JSZip from "jszip";
import { buildExportManifest, buildStoryboardText, StoryboardScene } from "./content";

type ExportAsset = { id: number; title: string; prompt: string; createdAt: Date | string; blob?: Blob | Uint8Array };
type ExportInput = { project: string; brandKit: unknown; assets: ExportAsset[]; storyboard?: { title: string; brief: string; scenes: StoryboardScene[] } };

export function createBatchArchive(input: ExportInput) {
  const zip = new JSZip();
  zip.file("manifest-konten.json", JSON.stringify(buildExportManifest(input.project, input.brandKit, input.assets), null, 2));
  if (input.storyboard) {
    zip.file("storyboard.json", JSON.stringify(input.storyboard, null, 2));
    zip.file("storyboard.txt", buildStoryboardText(input.storyboard.title, input.storyboard.brief, input.storyboard.scenes));
  }
  input.assets.forEach((asset, index) => { if (asset.blob) zip.file(`aset-${index + 1}.png`, asset.blob); });
  return zip;
}
