import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";

export const dashboard = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) return null;

    const portfolio = await ctx.db.query("portfolios").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).first();
    const agent = await ctx.db.query("agents").withIndex("by_ownerId", (q) => q.eq("ownerId", user._id)).first();

    let positions: any[] = [];
    let trades: any[] = [];
    if (portfolio) {
      positions = await ctx.db
        .query("positions")
        .withIndex("by_portfolioId_status", (q) => q.eq("portfolioId", portfolio._id).eq("status", "open"))
        .order("desc")
        .take(50);
      trades = await ctx.db
        .query("trades")
        .withIndex("by_portfolioId_timestamp", (q) => q.eq("portfolioId", portfolio._id))
        .order("desc")
        .take(50);
    }

    let agentRuns: any[] = [];
    let decisionReceipts: any[] = [];
    if (agent) {
      agentRuns = await ctx.db
        .query("agent_runs")
        .withIndex("by_agentId_startedAt", (q) => q.eq("agentId", agent._id))
        .order("desc")
        .take(8);
      decisionReceipts = await ctx.db
        .query("decision_receipts")
        .withIndex("by_agentId_createdAt", (q) => q.eq("agentId", agent._id))
        .order("desc")
        .take(20);
    }

    const positionValue = positions.reduce((sum, p) => sum + (p.currentPrice / p.entryPrice) * p.sizeSol, 0);
    const portfolioValue = (portfolio?.cashSol ?? 0) + positionValue;
    const realizedPnl = portfolio ? await sumPaperPnl(ctx, portfolio._id) : 0;
    const verifiedOnchainVolumeSol = trades
      .filter((t) => t.executionMode === "onchain" && Boolean(t.txSignature) && t.confirmationSlot !== undefined)
      .reduce((sum, t) => sum + t.amountSol, 0);
    const pendingOnchainVolumeSol = trades
      .filter((t) => t.executionMode === "onchain" && (!t.txSignature || t.confirmationSlot === undefined))
      .reduce((sum, t) => sum + t.amountSol, 0);
    const paperVolumeSol = trades
      .filter((t) => t.executionMode !== "onchain")
      .reduce((sum, t) => sum + t.amountSol, 0);

    const signals = await ctx.db.query("signals").withIndex("by_processedAt").order("desc").take(20);

    return {
      user: { name: user.name, walletAddress: user.walletAddress, agentDeployed: user.agentDeployed },
      portfolio: portfolio
        ? {
            id: portfolio._id,
            cashSol: portfolio.cashSol,
            investedSol: portfolio.investedSol,
            depositedSol: portfolio.depositedSol ?? 0,
            observedWalletSol: portfolio.observedWalletSol ?? null,
            observedWalletAt: portfolio.observedWalletAt ?? null,
            equityHighWaterSol: portfolio.equityHighWaterSol ?? portfolioValue,
            positionValue,
            portfolioValue,
            realizedPnl,
            paperVolumeSol,
            pendingOnchainVolumeSol,
            verifiedOnchainVolumeSol,
          }
        : null,
      agent: agent
        ? {
            id: agent._id,
            name: agent.name,
            status: agent.status,
            autoTrading: agent.autoTrading,
            riskMaxPosition: agent.riskMaxPosition,
            riskMaxDrawdownPct: agent.riskMaxDrawdownPct,
            walletAddress: agent.walletAddress,
            clawPumpAgentId: agent.clawPumpAgentId,
            clawPumpWalletAddress: agent.clawPumpWalletAddress,
            haltReason: agent.haltReason ?? null,
            haltedAt: agent.haltedAt ?? null,
            requiresRiskAck: agent.requiresRiskAck ?? false,
          }
        : null,
      positions,
      trades,
      agentRuns,
      decisionReceipts,
      signals,
    };
  },
});

async function sumPaperPnl(ctx: QueryCtx, portfolioId: any) {
  const trades = await ctx.db
    .query("trades")
    .withIndex("by_portfolioId_timestamp", (q) => q.eq("portfolioId", portfolioId))
    .take(1000);
  return trades
    .filter((t) => t.executionMode !== "onchain")
    .reduce((sum: number, t: any) => sum + (t.pnlSol ?? 0), 0);
}
