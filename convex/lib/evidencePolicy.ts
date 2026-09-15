export const EVIDENCE_POLICY_VERSION = "AS-AUTHORITY-V1";

export const EVIDENCE_POLICY = Object.freeze({
  minLiquidityUsd: 1_000,
  maxLargestHolderPct: 50,
  minEvidenceScore: 55,
  maxSignalAgeMs: 6 * 60 * 60 * 1000,
  passportFreshnessMs: 2 * 60 * 1000,
  criticalUnknowns: Object.freeze([
    "verifiable market price",
    "liquidity",
    "largest-holder concentration",
    "verified Pump launch provenance",
  ]),
  freshnessBandsMs: Object.freeze({
    launch5m: 5 * 60 * 1000,
    launch30m: 30 * 60 * 1000,
    launch2h: 2 * 60 * 60 * 1000,
  }),
  liquidityBandsUsd: Object.freeze({ strong: 100_000, medium: 25_000, base: 5_000 }),
  holderBandsPct: Object.freeze({ strong: 10, medium: 20, base: 35 }),
  boundedMomentum: Object.freeze({ minPct: -20, maxPct: 100, extremePct: 200 }),
  scoreWeights: Object.freeze({
    verifiedPrice: 10,
    liquidityStrong: 30,
    liquidityMedium: 25,
    liquidityBase: 18,
    liquidityFloor: 10,
    holderStrong: 30,
    holderMedium: 25,
    holderBase: 15,
    holderBelowCap: 8,
    launch5m: 20,
    launch30m: 15,
    launch2h: 10,
    launch6h: 5,
    boundedMomentum: 10,
  }),
});

export function evidencePolicyDescriptor() {
  return {
    version: EVIDENCE_POLICY_VERSION,
    thresholds: {
      minLiquidityUsd: EVIDENCE_POLICY.minLiquidityUsd,
      maxLargestHolderPct: EVIDENCE_POLICY.maxLargestHolderPct,
      minEvidenceScore: EVIDENCE_POLICY.minEvidenceScore,
      maxSignalAgeMs: EVIDENCE_POLICY.maxSignalAgeMs,
      passportFreshnessMs: EVIDENCE_POLICY.passportFreshnessMs,
    },
    criticalUnknowns: [...EVIDENCE_POLICY.criticalUnknowns],
    scoring: {
      liquidityBandsUsd: EVIDENCE_POLICY.liquidityBandsUsd,
      holderBandsPct: EVIDENCE_POLICY.holderBandsPct,
      boundedMomentum: EVIDENCE_POLICY.boundedMomentum,
      freshnessBandsMs: EVIDENCE_POLICY.freshnessBandsMs,
      weights: EVIDENCE_POLICY.scoreWeights,
    },
    principle: "QUALIFIED_IS_NOT_EXECUTION_AUTHORIZATION",
  } as const;
}
