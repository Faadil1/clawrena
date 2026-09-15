import { EVIDENCE_POLICY } from "./evidencePolicy";

export type LaunchEvidenceInput = {
  processedAt: number;
  now: number;
  priceUsd?: number;
  liquidityUsd?: number;
  priceChange24h?: number;
  largestHolderPct?: number | null;
};

export type LaunchEvidenceVerdict = {
  eligible: boolean;
  score: number;
  observations: Record<string, unknown>;
  unknowns: string[];
  reasons: string[];
  blockers: string[];
};

/**
 * Deterministic evidence gate. This is not a promise of alpha or an ML model.
 * It scores only currently verifiable observations and fails closed on critical
 * unknowns so unverifiable risk never silently becomes an entry signal.
 */
export function evaluateLaunchEvidence(input: LaunchEvidenceInput): LaunchEvidenceVerdict {
  const unknowns: string[] = [];
  const reasons: string[] = [];
  const blockers: string[] = [];
  const ageMs = Math.max(0, input.now - input.processedAt);
  const observations: Record<string, unknown> = {
    priceUsd: input.priceUsd,
    liquidityUsd: input.liquidityUsd,
    priceChange24h: input.priceChange24h,
    largestHolderPct: input.largestHolderPct,
    signalAgeMs: ageMs,
  };

  let score = 0;
  const w = EVIDENCE_POLICY.scoreWeights;

  if (input.priceUsd === undefined || !Number.isFinite(input.priceUsd) || input.priceUsd <= 0) {
    unknowns.push("verifiable market price");
    blockers.push("price unavailable");
  } else {
    score += w.verifiedPrice;
    reasons.push("live price verified");
  }

  if (input.liquidityUsd === undefined || !Number.isFinite(input.liquidityUsd)) {
    unknowns.push("liquidity");
    blockers.push("liquidity unknown");
  } else if (input.liquidityUsd < EVIDENCE_POLICY.minLiquidityUsd) {
    blockers.push(`liquidity $${Math.round(input.liquidityUsd)} below $${EVIDENCE_POLICY.minLiquidityUsd} floor`);
  } else if (input.liquidityUsd >= EVIDENCE_POLICY.liquidityBandsUsd.strong) {
    score += w.liquidityStrong;
    reasons.push("liquidity >= $100k");
  } else if (input.liquidityUsd >= EVIDENCE_POLICY.liquidityBandsUsd.medium) {
    score += w.liquidityMedium;
    reasons.push("liquidity >= $25k");
  } else if (input.liquidityUsd >= EVIDENCE_POLICY.liquidityBandsUsd.base) {
    score += w.liquidityBase;
    reasons.push("liquidity >= $5k");
  } else {
    score += w.liquidityFloor;
    reasons.push("liquidity above minimum floor");
  }

  if (input.largestHolderPct === undefined || input.largestHolderPct === null) {
    unknowns.push("largest-holder concentration");
    blockers.push("holder concentration unknown");
  } else if (!Number.isFinite(input.largestHolderPct)) {
    unknowns.push("largest-holder concentration");
    blockers.push("holder concentration invalid");
  } else if (input.largestHolderPct >= EVIDENCE_POLICY.maxLargestHolderPct) {
    blockers.push(`largest holder ${input.largestHolderPct.toFixed(1)}% exceeds ${EVIDENCE_POLICY.maxLargestHolderPct}% cap`);
  } else if (input.largestHolderPct <= EVIDENCE_POLICY.holderBandsPct.strong) {
    score += w.holderStrong;
    reasons.push("largest holder <= 10%");
  } else if (input.largestHolderPct <= EVIDENCE_POLICY.holderBandsPct.medium) {
    score += w.holderMedium;
    reasons.push("largest holder <= 20%");
  } else if (input.largestHolderPct <= EVIDENCE_POLICY.holderBandsPct.base) {
    score += w.holderBase;
    reasons.push("largest holder <= 35%");
  } else {
    score += w.holderBelowCap;
    reasons.push("largest holder below hard cap");
  }

  if (ageMs > EVIDENCE_POLICY.maxSignalAgeMs) {
    blockers.push("launch signal older than six hours");
  } else if (ageMs <= EVIDENCE_POLICY.freshnessBandsMs.launch5m) {
    score += w.launch5m;
    reasons.push("fresh launch <= 5m");
  } else if (ageMs <= EVIDENCE_POLICY.freshnessBandsMs.launch30m) {
    score += w.launch30m;
    reasons.push("fresh launch <= 30m");
  } else if (ageMs <= EVIDENCE_POLICY.freshnessBandsMs.launch2h) {
    score += w.launch2h;
    reasons.push("launch <= 2h old");
  } else {
    score += w.launch6h;
    reasons.push("launch <= 6h old");
  }

  if (input.priceChange24h === undefined || !Number.isFinite(input.priceChange24h)) {
    unknowns.push("24h price change");
  } else if (input.priceChange24h > EVIDENCE_POLICY.boundedMomentum.extremePct) {
    reasons.push("extreme 24h move observed; no momentum bonus");
  } else if (
    input.priceChange24h >= EVIDENCE_POLICY.boundedMomentum.minPct &&
    input.priceChange24h <= EVIDENCE_POLICY.boundedMomentum.maxPct
  ) {
    score += w.boundedMomentum;
    reasons.push("24h move inside bounded momentum window");
  }

  score = Math.max(0, Math.min(100, score));
  if (blockers.length === 0 && score < EVIDENCE_POLICY.minEvidenceScore) {
    blockers.push(`evidence score ${score} below ${EVIDENCE_POLICY.minEvidenceScore} threshold`);
  }

  return {
    eligible: blockers.length === 0 && score >= EVIDENCE_POLICY.minEvidenceScore,
    score,
    observations,
    unknowns,
    reasons,
    blockers,
  };
}
