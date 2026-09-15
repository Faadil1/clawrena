import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const policyState = v.union(v.literal("QUALIFIED"), v.literal("REFUSED"));

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
