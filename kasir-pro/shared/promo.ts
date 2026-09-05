export type PromotionCandidate<T extends { id: string }> = {
  promo: T;
  discount: number;
  eligible: boolean;
};

export function selectBestPromotion<T extends { id: string }, C extends PromotionCandidate<T>>(candidates: C[]): C | null {
  return candidates.filter((candidate) => candidate.eligible && candidate.discount > 0).sort((a, b) => b.discount - a.discount || a.promo.id.localeCompare(b.promo.id))[0] ?? null;
}
