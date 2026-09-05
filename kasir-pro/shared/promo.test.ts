import { describe, expect, it } from "vitest";
import { selectBestPromotion } from "./promo";

describe("selectBestPromotion", () => {
  it("chooses the highest valid discount regardless of entry order", () => {
    const selected = selectBestPromotion([
      { promo: { id: "manual", code: "HEMAT5" }, eligible: true, discount: 5_000 },
      { promo: { id: "automatic", code: "GOLD10" }, eligible: true, discount: 10_000 },
    ]);
    expect(selected?.promo.code).toBe("GOLD10");
    expect(selected?.discount).toBe(10_000);
  });

  it("ignores ineligible promotions", () => {
    const selected = selectBestPromotion([
      { promo: { id: "blocked", code: "BLOCKED" }, eligible: false, discount: 100_000 },
      { promo: { id: "valid", code: "VALID" }, eligible: true, discount: 1_000 },
    ]);
    expect(selected?.promo.code).toBe("VALID");
  });
});
