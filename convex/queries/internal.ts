import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const loadAgentContext = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    const agent = await ctx.db.get(agentId);
    if (!agent) return null;
    const portfolio = await ctx.db.query("portfolios").withIndex("by_ownerId", (q) => q.eq("ownerId", agent.ownerId)).first();
    const positions = await ctx.db.query("positions").withIndex("by_agentId", (q) => q.eq("agentId", agentId)).take(100);
    const openPositions = positions.filter((p) => p.status === "open");
    return {
      agent: {
        id: agent._id,
        status: agent.status,
        autoTrading: agent.autoTrading,
        ownerId: agent.ownerId,
        riskMaxPosition: agent.riskMaxPosition,
        riskMaxDrawdownPct: agent.riskMaxDrawdownPct,
      },
      portfolio: portfolio
        ? { id: portfolio._id, cashSol: portfolio.cashSol, investedSol: portfolio.investedSol }
        : null,
      openPositions,
    };
  },
});

export const listEligibleAgents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_status_autoTrading", (q) => q.eq("status", "running").eq("autoTrading", true))
      .take(200);
    return agents.map((a) => ({ id: a._id, status: a.status }));
  },
});

export const getMyAgentId = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) return null;
    const agent = await ctx.db.query("agents").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).first();
    return agent?._id ?? null;
  },
});

export const getMyAgentForClawPump = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) return null;
    const agent = await ctx.db.query("agents").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).first();
    if (!agent) return null;
    return {
      id: agent._id,
      name: agent.name,
      riskMaxPosition: agent.riskMaxPosition,
      clawPumpAgentId: agent.clawPumpAgentId,
      clawPumpWalletAddress: agent.clawPumpWalletAddress,
    };
  },
});


export const getDecisionReceiptForAgent = internalQuery({
  args: { receiptId: v.id("decision_receipts"), agentId: v.id("agents") },
  handler: async (ctx, { receiptId, agentId }) => {
    const receipt = await ctx.db.get(receiptId);
    if (!receipt || receipt.agentId !== agentId) return null;
    return receipt;
  },
});

export const listCandidateLaunches = internalQuery({
  args: { excludeMints: v.optional(v.array(v.string())) },
  handler: async (ctx, { excludeMints }) => {
    const excluded = new Set(excludeMints ?? []);
    const rows = await ctx.db
      .query("signals")
      .withIndex("by_type_processedAt", (q) => q.eq("type", "new-launch"))
      .order("desc")
      .take(50);
    return rows
      .filter((s) => s.actedOn !== true && !excluded.has(s.tokenMint))
      .slice(0, 8)
      .map((s) => ({ signalId: s._id, mint: s.tokenMint, symbol: s.tokenSymbol ?? null, processedAt: s.processedAt }));
  },
});
