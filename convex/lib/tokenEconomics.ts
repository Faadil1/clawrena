export const CLAWPUMP_CREATOR_FEE_SHARE_PCT = 75 as const;

export type ClawPumpFeeEarnings = {
  agentId: string;
  totalEarned: number;
  totalSent: number;
  totalPending: number;
  totalHeld: number;
  recentDistributions: unknown[];
};

/**
 * Normalize ClawPump's public fee ledger without inventing missing economics.
 * Invalid/missing monetary fields fail closed rather than becoming a fake zero.
 */
export function normalizeClawPumpFeeEarnings(
  raw: Record<string, unknown>,
  expectedAgentId: string,
): ClawPumpFeeEarnings {
  const agentId = typeof raw.agentId === "string" ? raw.agentId : expectedAgentId;
  if (agentId !== expectedAgentId) throw new Error("ClawPump fee ledger returned a different agent id");

  return {
    agentId,
    totalEarned: requiredNonnegativeNumber(raw, "totalEarned"),
    totalSent: requiredNonnegativeNumber(raw, "totalSent"),
    totalPending: requiredNonnegativeNumber(raw, "totalPending"),
    totalHeld: requiredNonnegativeNumber(raw, "totalHeld"),
    recentDistributions: Array.isArray(raw.recentDistributions) ? raw.recentDistributions : [],
  };
}

function requiredNonnegativeNumber(raw: Record<string, unknown>, key: string): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`ClawPump fee ledger field ${key} is missing or invalid`);
  }
  return value;
}
