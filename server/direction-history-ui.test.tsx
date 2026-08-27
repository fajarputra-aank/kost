import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DirectionHistoryList from "../client/src/components/DirectionHistoryList";
import { parseDirectionHistory } from "../shared/history";

describe("render riwayat arahan", () => {
  it("merender source, label, prompt, dan timestamp untuk beberapa entry", () => {
    const entries = parseDirectionHistory(JSON.stringify([{ source: "Copilot", label: "Brief disempurnakan", prompt: "Versi prompt kreatif", createdAt: "2026-08-27T14:00:00.000Z" }, { source: "Preset", label: "Preset diterapkan", prompt: "Versi prompt karakter", createdAt: "2026-08-27T14:01:00.000Z" }]), "Fallback", "2026-08-27T14:02:00.000Z");
    const html = renderToStaticMarkup(<DirectionHistoryList entries={entries} />);
    expect(html).toContain("Copilot");
    expect(html).toContain("Brief disempurnakan");
    expect(html).toContain("Versi prompt kreatif");
    expect(html).toContain("Preset diterapkan");
    expect(html).toContain("Versi prompt karakter");
    expect(html).toContain("27/08/2026");
  });

  it("merender fallback prompt saat metadata riwayat kosong atau rusak", () => {
    const entries = parseDirectionHistory("not-json", "Prompt tersimpan aman", "2026-08-27T14:02:00.000Z");
    const html = renderToStaticMarkup(<DirectionHistoryList entries={entries} />);
    expect(html).toContain("Generate");
    expect(html).toContain("Prompt tersimpan");
    expect(html).toContain("Prompt tersimpan aman");
  });
});
