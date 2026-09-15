export const EVIDENCE_POLICY_VERSION = "AS-AUTHORITY-V1";
export const EVIDENCE_PASSPORT_FRESHNESS_MS = 2 * 60 * 1000;

export type EvidenceDecision = "execute" | "reject" | "skip" | "prepare";
export type EvidenceAuthorityState = "AUTHORIZED" | "REFUSED" | "ABSTAINED" | "PREPARED";

export type EvidencePassportInput = {
  tokenMint: string;
  decision: EvidenceDecision;
  executionMode: "paper" | "onchain";
  score?: number;
  observations: unknown;
  unknowns: string[];
  reasons: string[];
  riskBudgetSol?: number;
  requestId?: string;
  createdAt: number;
};

export type EvidencePassport = {
  policyVersion: string;
  replayKey: string;
  authorityState: EvidenceAuthorityState;
  freshnessExpiresAt: number;
  counterfactuals: string[];
};

/** Stable JSON used to make a receipt replayable across UI, API and judge tooling. */
export function stableEvidenceString(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/**
 * Deterministic 64-bit FNV-1a replay key. This is an audit/replay identifier,
 * not a cryptographic signature and never authorizes value movement by itself.
 */
export function evidenceReplayKey(value: unknown): string {
  const bytes = new TextEncoder().encode(stableEvidenceString(value));
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return `AS1-${hash.toString(16).padStart(16, "0")}`;
}

export function buildEvidencePassport(input: EvidencePassportInput): EvidencePassport {
  const envelope = {
    policyVersion: EVIDENCE_POLICY_VERSION,
    tokenMint: input.tokenMint,
    decision: input.decision,
    executionMode: input.executionMode,
    score: input.score ?? null,
    observations: input.observations ?? null,
    unknowns: [...input.unknowns].sort(),
    reasons: [...input.reasons],
    riskBudgetSol: input.riskBudgetSol ?? null,
    requestId: input.requestId ?? null,
    createdAt: input.createdAt,
  };

  return {
    policyVersion: EVIDENCE_POLICY_VERSION,
    replayKey: evidenceReplayKey(envelope),
    authorityState: authorityStateFor(input.decision),
    freshnessExpiresAt: input.createdAt + EVIDENCE_PASSPORT_FRESHNESS_MS,
    counterfactuals: buildCounterfactuals(input),
  };
}

function authorityStateFor(decision: EvidenceDecision): EvidenceAuthorityState {
  if (decision === "execute") return "AUTHORIZED";
  if (decision === "reject") return "REFUSED";
  if (decision === "prepare") return "PREPARED";
  return "ABSTAINED";
}

function buildCounterfactuals(input: EvidencePassportInput): string[] {
  if (input.decision === "execute") return [];
  const items = [
    ...input.unknowns.map((unknown) => `Resolve critical unknown: ${unknown}`),
    ...input.reasons.map((reason) => `Re-evaluate gate: ${reason}`),
  ];
  return [...new Set(items)].slice(0, 8);
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      const item = record[key];
      if (item !== undefined) output[key] = canonicalize(item);
    }
    return output;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return value.toString();
  return value;
}
