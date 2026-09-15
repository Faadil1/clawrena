import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { buildEvidencePassport } from "./lib/evidencePassport";

export const recordDecision = internalMutation({
  args: {
    agentId: v.id("agents"),
    signalId: v.optional(v.id("signals")),
    tokenMint: v.string(),
    decision: v.union(
      v.literal("execute"),
      v.literal("reject"),
      v.literal("skip"),
      v.literal("prepare"),
    ),
    executionMode: v.union(v.literal("paper"), v.literal("onchain")),
    score: v.optional(v.number()),
    observations: v.any(),
    unknowns: v.array(v.string()),
    reasons: v.array(v.string()),
    riskBudgetSol: v.optional(v.number()),
    quote: v.optional(v.any()),
    txSignature: v.optional(v.string()),
    requestId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const passport = buildEvidencePassport({
      tokenMint: args.tokenMint,
      decision: args.decision,
      executionMode: args.executionMode,
      score: args.score,
      observations: args.observations,
      unknowns: args.unknowns,
      reasons: args.reasons,
      riskBudgetSol: args.riskBudgetSol,
      requestId: args.requestId,
      createdAt,
    });

    return ctx.db.insert("decision_receipts", {
      ...args,
      ...passport,
      createdAt,
    });
  },
});
