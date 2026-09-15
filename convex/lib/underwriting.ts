import { buildEvidencePassport } from "./evidencePassport";
import { evaluateLaunchEvidence } from "./evidenceScore";
import { fetchHolderConcentration, fetchMarketSnapshot, findMintCreatedInTx } from "./market";

export type EvidenceSource = {
  source: "solana-pump-transaction" | "jupiter-price-v3" | "solana-owner-concentration";
  status: "OBSERVED" | "UNKNOWN";
  observedAt: number;
  reference?: string;
  blockTime?: number | null;
  slot?: number | null;
  blockId?: number | null;
};

export type PumpUnderwritingResult = {
  artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION";
  tokenMint: string;
  launchSignature: string;
  createdAt: number;
  policyState: "QUALIFIED" | "REFUSED";
  valueMovement: false;
  nextBoundary: "LAST_MILE_PROVIDER_AND_RISK_PREFLIGHT_REQUIRED" | "NONE";
  score?: number;
  observations: Record<string, unknown>;
  unknowns: string[];
  reasons: string[];
  blockers: string[];
  sourceLedger: EvidenceSource[];
  passport: ReturnType<typeof buildEvidencePassport>;
};

export async function underwritePumpLaunch(input: {
  tokenMint: string;
  launchSignature: string;
  now?: number;
}): Promise<PumpUnderwritingResult> {
  const now = input.now ?? Date.now();
  const provenance = await findMintCreatedInTx(input.launchSignature);

  if (!provenance || provenance.mint !== input.tokenMint || provenance.blockTime === undefined) {
    const reasons = [
      !provenance
        ? "launch signature does not verify as an official Pump create/create_v2 instruction"
        : provenance.mint !== input.tokenMint
          ? "verified Pump launch mint does not match requested token"
          : "verified Pump launch timestamp is unavailable",
    ];
    const unknowns = ["verified Pump launch provenance"];
    const sourceLedger: EvidenceSource[] = [{
      source: "solana-pump-transaction",
      status: "UNKNOWN",
      observedAt: now,
      reference: input.launchSignature,
      blockTime: provenance?.blockTime ?? null,
      slot: provenance?.slot ?? null,
    }];
    const observations = {
      launchSignature: input.launchSignature,
      launchVerified: false,
      verifiedMint: provenance?.mint ?? null,
      blockTime: provenance?.blockTime ?? null,
      sourceLedger,
    };
    const passport = buildEvidencePassport({
      tokenMint: input.tokenMint,
      decision: "reject",
      executionMode: "paper",
      observations,
      unknowns,
      reasons,
      createdAt: now,
    });
    return {
      artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION",
      tokenMint: input.tokenMint,
      launchSignature: input.launchSignature,
      createdAt: now,
      policyState: "REFUSED",
      valueMovement: false,
      nextBoundary: "NONE",
      observations,
      unknowns,
      reasons,
      blockers: reasons,
      sourceLedger,
      passport,
    };
  }

  const [snapshots, holder] = await Promise.all([
    fetchMarketSnapshot([input.tokenMint]),
    fetchHolderConcentration(input.tokenMint),
  ]);
  const market = snapshots[input.tokenMint];
  const sourceLedger: EvidenceSource[] = [
    { source: "solana-pump-transaction", status: "OBSERVED", observedAt: now, reference: input.launchSignature, blockTime: provenance.blockTime, slot: provenance.slot ?? null },
    { source: "jupiter-price-v3", status: market ? "OBSERVED" : "UNKNOWN", observedAt: market?.observedAt ?? now, blockId: market?.blockId ?? null },
    { source: "solana-owner-concentration", status: holder ? "OBSERVED" : "UNKNOWN", observedAt: holder?.observedAt ?? now, slot: holder?.observationSlot ?? null },
  ];

  const verdict = evaluateLaunchEvidence({
    processedAt: provenance.blockTime,
    now,
    priceUsd: market?.priceUsd,
    liquidityUsd: market?.liquidityUsd,
    priceChange24h: market?.priceChange24h,
    largestHolderPct: holder?.largestHolderPct ?? null,
  });
  const decision = verdict.eligible ? "execute" as const : "reject" as const;
  const observations = {
    ...verdict.observations,
    launchSignature: input.launchSignature,
    launchVerified: true,
    launchBlockTime: provenance.blockTime,
    launchSlot: provenance.slot ?? null,
    jupiterBlockId: market?.blockId ?? null,
    sampledOwnerCount: holder?.sampledOwnerCount ?? null,
    ownerObservationSlot: holder?.observationSlot ?? null,
    programControlledPct: holder?.programControlledPct ?? null,
    sourceLedger,
  };
  const passport = buildEvidencePassport({
    tokenMint: input.tokenMint,
    decision,
    executionMode: "paper",
    score: verdict.score,
    observations,
    unknowns: verdict.unknowns,
    reasons: verdict.reasons,
    createdAt: now,
  });

  return {
    artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION",
    tokenMint: input.tokenMint,
    launchSignature: input.launchSignature,
    createdAt: now,
    policyState: passport.policyState === "QUALIFIED" ? "QUALIFIED" : "REFUSED",
    valueMovement: false,
    nextBoundary: verdict.eligible ? "LAST_MILE_PROVIDER_AND_RISK_PREFLIGHT_REQUIRED" : "NONE",
    score: verdict.score,
    observations,
    unknowns: verdict.unknowns,
    reasons: verdict.reasons,
    blockers: verdict.blockers,
    sourceLedger,
    passport,
  };
}

export function compareUnderwritingDecisions(
  previous: { policyVersion: string; policyState: string; score?: number; unknowns: string[]; blockers: string[]; replayKey: string },
  current: PumpUnderwritingResult,
) {
  return {
    previousReplayKey: previous.replayKey,
    currentReplayKey: current.passport.replayKey,
    policyChanged: previous.policyVersion !== current.passport.policyVersion,
    stateChanged: previous.policyState !== current.policyState,
    scoreDelta: previous.score === undefined || current.score === undefined ? null : current.score - previous.score,
    unknownsResolved: previous.unknowns.filter((item) => !current.unknowns.includes(item)),
    unknownsAdded: current.unknowns.filter((item) => !previous.unknowns.includes(item)),
    blockersResolved: previous.blockers.filter((item) => !current.blockers.includes(item)),
    blockersAdded: current.blockers.filter((item) => !previous.blockers.includes(item)),
  };
}
