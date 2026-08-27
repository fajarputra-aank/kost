import { describe, expect, it } from "vitest";
import { parseDirectionHistory } from "../shared/history";

describe("riwayat arahan aset", () => {
  it("mempertahankan beberapa versi dengan sumber, label, dan waktu", () => {
    const entries = parseDirectionHistory(JSON.stringify([{ source: "Copilot", label: "Brief disempurnakan", prompt: "Versi pertama", createdAt: "2026-08-27T14:00:00.000Z" }, { source: "Preset", label: "Preset diterapkan", prompt: "Versi kedua", createdAt: "2026-08-27T14:01:00.000Z" }]), "Fallback", "2026-08-27T14:02:00.000Z");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ source: "Copilot", label: "Brief disempurnakan" });
    expect(entries[1]?.prompt).toBe("Versi kedua");
  });

  it("menggunakan fallback aman untuk metadata kosong atau rusak", () => {
    expect(parseDirectionHistory(undefined, "Prompt lama", "2026-08-27T14:02:00.000Z")[0]).toMatchObject({ source: "Generate", label: "Prompt tersimpan", prompt: "Prompt lama" });
    expect(parseDirectionHistory("not-json", "Prompt lama", "2026-08-27T14:02:00.000Z")[0]?.prompt).toBe("Prompt lama");
  });
});
