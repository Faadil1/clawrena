export type EquityRisk = {
  peakSol: number;
  equitySol: number;
  drawdownPct: number;
};

/** Pure high-water calculation used by the persisted portfolio risk guard. */
export function nextEquityRisk(previousPeakSol: number | null | undefined, equitySol: number): EquityRisk {
  if (!Number.isFinite(equitySol) || equitySol < 0) throw new Error("Invalid portfolio equity");
  const safePrevious = Number.isFinite(previousPeakSol) && (previousPeakSol ?? 0) >= 0
    ? Number(previousPeakSol)
    : equitySol;
  const peakSol = Math.max(safePrevious, equitySol);
  const drawdownPct = peakSol > 0 ? ((peakSol - equitySol) / peakSol) * 100 : 0;
  return { peakSol, equitySol, drawdownPct };
}
