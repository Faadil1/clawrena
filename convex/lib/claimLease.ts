export type ClaimLeaseState = {
  status?: "claimed" | "released" | "acted";
  claimToken?: string;
  claimedAt?: number;
};

export const CLAIM_LEASE_MS = 10 * 60 * 1000;

/** Pure lease policy used by the transactional Convex mutation and logic tests. */
export function canAcquireClaim(
  state: ClaimLeaseState | null,
  claimToken: string,
  now: number,
  leaseMs = CLAIM_LEASE_MS,
): boolean {
  if (!state || state.status === "released") return true;
  if (state.status === "acted") return false;
  const active = state.claimedAt !== undefined && now - state.claimedAt < leaseMs;
  if (!active) return true;
  return state.claimToken === claimToken;
}
