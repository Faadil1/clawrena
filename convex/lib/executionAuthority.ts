export const MAX_EXECUTION_RECEIPT_AGE_MS = 2 * 60 * 1000;
const MAX_FUTURE_CLOCK_SKEW_MS = 30 * 1000;
const MIN_EXECUTION_SCORE = 55;

const CRITICAL_UNKNOWNS = new Set([
  "verifiable market price",
  "liquidity",
  "largest-holder concentration",
]);

export type ExecutionAuthorityInput = {
  now: number;
  receiptCreatedAt: number;
  decision: string;
  score?: number;
  riskBudgetSol?: number;
  unknowns?: string[];
  providerConfigured: boolean;
  providerLinked: boolean;
  providerHealthy: boolean;
};

export type ExecutionAuthorityVerdict = {
  authorized: boolean;
  receiptAgeMs: number;
  blockers: string[];
};

/**
 * Last-mile execution authority gate. A strategy receipt can recommend a trade,
 * but it cannot authorize value movement forever. Execution is refused when the
 * evidence is stale, critical evidence is still unknown, or the execution
 * provider is not both configured and reachable.
 */
export function evaluateExecutionAuthority(
  input: ExecutionAuthorityInput,
): ExecutionAuthorityVerdict {
  const blockers: string[] = [];
  const receiptAgeMs = input.now - input.receiptCreatedAt;

  if (input.decision !== "execute") blockers.push("stored receipt is not an execute decision");
  if ((input.score ?? 0) < MIN_EXECUTION_SCORE) blockers.push(`evidence score below ${MIN_EXECUTION_SCORE}`);
  if (!Number.isFinite(input.riskBudgetSol) || (input.riskBudgetSol ?? 0) <= 0) {
    blockers.push("receipt has no positive risk budget");
  }
  if (receiptAgeMs > MAX_EXECUTION_RECEIPT_AGE_MS) {
    blockers.push("execution receipt is stale; refresh market evidence before value movement");
  }
  if (receiptAgeMs < -MAX_FUTURE_CLOCK_SKEW_MS) {
    blockers.push("receipt timestamp is ahead of local execution clock");
  }

  for (const unknown of input.unknowns ?? []) {
    if (CRITICAL_UNKNOWNS.has(unknown)) blockers.push(`critical evidence remains unknown: ${unknown}`);
  }

  if (!input.providerConfigured) blockers.push("ClawPump provider is not configured");
  if (!input.providerLinked) blockers.push("local agent is not linked to a ClawPump agent");
  if (!input.providerHealthy) blockers.push("ClawPump provider/linked agent preflight is unhealthy");

  return { authorized: blockers.length === 0, receiptAgeMs, blockers };
}
