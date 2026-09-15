import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { recomputeEvidenceReplayKey } from "./lib/evidencePassport";
import { evidencePolicyDescriptor } from "./lib/evidencePolicy";

const policyState = v.union(v.literal("QUALIFIED"), v.literal("REFUSED"));
const REPLAY_RE = /^AS1-[0-9a-f]{16}$/;

export const recordDecision = internalMutation({
  args: {
    tokenMint: v.string(),
    launchSignature: v.string(),
    policyVersion: v.string(),
    replayKey: v.string(),
    policyState,
    score: v.optional(v.number()),
    observations: v.any(),
    unknowns: v.array(v.string()),
    reasons: v.array(v.string()),
    blockers: v.array(v.string()),
    sourceLedger: v.any(),
    freshnessExpiresAt: v.number(),
    supersedesReplayKey: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("underwriting_decisions")
      .withIndex("by_replayKey", (q) => q.eq("replayKey", args.replayKey))
      .first();
    if (existing) return existing._id;
    return ctx.db.insert("underwriting_decisions", args);
  },
});

export const getByReplayKey = internalQuery({
  args: { replayKey: v.string() },
  handler: async (ctx, { replayKey }) => {
    return ctx.db
      .query("underwriting_decisions")
      .withIndex("by_replayKey", (q) => q.eq("replayKey", replayKey))
      .first();
  },
});

/**
 * Public, read-only deterministic consistency check for an Evidence Passport.
 * It does not refresh live market evidence and is not a cryptographic
 * attestation. It proves only that the persisted underwriting envelope still
 * recomputes to the same replay identifier under its recorded policy version.
 */
export const verifyReceipt = query({
  args: { replayKey: v.string() },
  handler: async (ctx, { replayKey }) => {
    if (!REPLAY_RE.test(replayKey)) {
      return {
        ok: false,
        error: "invalid replay key",
        artifactClass: "STORED_EVIDENCE_PASSPORT_CONSISTENCY_CHECK",
      };
    }

    const stored = await ctx.db
      .query("underwriting_decisions")
      .withIndex("by_replayKey", (q) => q.eq("replayKey", replayKey))
      .first();

    if (!stored) {
      return {
        ok: false,
        error: "underwriting decision not found",
        artifactClass: "STORED_EVIDENCE_PASSPORT_CONSISTENCY_CHECK",
      };
    }

    const decision = stored.policyState === "QUALIFIED" ? "execute" as const : "reject" as const;
    const recomputedReplayKey = recomputeEvidenceReplayKey({
      tokenMint: stored.tokenMint,
      decision,
      executionMode: "paper",
      score: stored.score,
      observations: stored.observations,
      unknowns: stored.unknowns,
      reasons: stored.reasons,
      createdAt: stored.createdAt,
    }, stored.policyVersion);
    const replayConsistency = recomputedReplayKey === stored.replayKey ? "MATCH" as const : "MISMATCH" as const;

    return {
      ok: replayConsistency === "MATCH",
      artifactClass: "STORED_EVIDENCE_PASSPORT_CONSISTENCY_CHECK",
      semantics: "DETERMINISTIC_CONSISTENCY_NOT_CRYPTOGRAPHIC_ATTESTATION_NOT_LIVE_REVALIDATION",
      replayKey: stored.replayKey,
      recomputedReplayKey,
      replayConsistency,
      policyVersion: stored.policyVersion,
      policyIsCurrent: stored.policyVersion === evidencePolicyDescriptor().version,
      policyState: stored.policyState,
      freshnessExpiresAt: stored.freshnessExpiresAt,
      tokenMint: stored.tokenMint,
      launchSignature: stored.launchSignature,
      score: stored.score ?? null,
      unknowns: stored.unknowns,
      reasons: stored.reasons,
      blockers: stored.blockers,
      sourceLedger: stored.sourceLedger,
      supersedesReplayKey: stored.supersedesReplayKey ?? null,
      createdAt: stored.createdAt,
      valueMovement: false,
    };
  },
});
