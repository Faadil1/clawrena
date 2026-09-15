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

const MIN_LIQUIDITY_USD = 1_000;
const MAX_TOP_HOLDER_PCT = 50;
const MIN_SCORE = 55;
const MAX_SIGNAL_AGE_MS = 6 * 60 * 60 * 1000;

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

  if (input.priceUsd === undefined || !Number.isFinite(input.priceUsd) || input.priceUsd <= 0) {
    unknowns.push("verifiable market price");
    blockers.push("price unavailable");
  } else {
    score += 10;
    reasons.push("live price verified");
  }

  if (input.liquidityUsd === undefined || !Number.isFinite(input.liquidityUsd)) {
    unknowns.push("liquidity");
    blockers.push("liquidity unknown");
  } else if (input.liquidityUsd < MIN_LIQUIDITY_USD) {
    blockers.push(`liquidity $${Math.round(input.liquidityUsd)} below $${MIN_LIQUIDITY_USD} floor`);
  } else if (input.liquidityUsd >= 100_000) {
    score += 30;
    reasons.push("liquidity >= $100k");
  } else if (input.liquidityUsd >= 25_000) {
    score += 25;
    reasons.push("liquidity >= $25k");
  } else if (input.liquidityUsd >= 5_000) {
    score += 18;
    reasons.push("liquidity >= $5k");
  } else {
    score += 10;
    reasons.push("liquidity above minimum floor");
  }

  if (input.largestHolderPct === undefined || input.largestHolderPct === null) {
    unknowns.push("largest-holder concentration");
    blockers.push("holder concentration unknown");
  } else if (!Number.isFinite(input.largestHolderPct)) {
    unknowns.push("largest-holder concentration");
    blockers.push("holder concentration invalid");
  } else if (input.largestHolderPct >= MAX_TOP_HOLDER_PCT) {
    blockers.push(`largest holder ${input.largestHolderPct.toFixed(1)}% exceeds ${MAX_TOP_HOLDER_PCT}% cap`);
  } else if (input.largestHolderPct <= 10) {
    score += 30;
    reasons.push("largest holder <= 10%");
  } else if (input.largestHolderPct <= 20) {
    score += 25;
    reasons.push("largest holder <= 20%");
  } else if (input.largestHolderPct <= 35) {
    score += 15;
    reasons.push("largest holder <= 35%");
  } else {
    score += 8;
    reasons.push("largest holder below hard cap");
  }

  if (ageMs > MAX_SIGNAL_AGE_MS) {
    blockers.push("launch signal older than six hours");
  } else if (ageMs <= 5 * 60 * 1000) {
    score += 20;
    reasons.push("fresh launch <= 5m");
  } else if (ageMs <= 30 * 60 * 1000) {
    score += 15;
    reasons.push("fresh launch <= 30m");
  } else if (ageMs <= 2 * 60 * 60 * 1000) {
    score += 10;
    reasons.push("launch <= 2h old");
  } else {
    score += 5;
    reasons.push("launch <= 6h old");
  }

  if (input.priceChange24h === undefined || !Number.isFinite(input.priceChange24h)) {
    unknowns.push("24h price change");
  } else if (input.priceChange24h > 200) {
    reasons.push("extreme 24h move observed; no momentum bonus");
  } else if (input.priceChange24h >= -20 && input.priceChange24h <= 100) {
    score += 10;
    reasons.push("24h move inside bounded momentum window");
  }

  score = Math.max(0, Math.min(100, score));
  if (blockers.length === 0 && score < MIN_SCORE) {
    blockers.push(`evidence score ${score} below ${MIN_SCORE} threshold`);
  }

  return {
    eligible: blockers.length === 0 && score >= MIN_SCORE,
    score,
    observations,
    unknowns,
    reasons,
    blockers,
  };
}
