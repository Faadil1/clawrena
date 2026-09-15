import { query } from "../_generated/server";

export const publicStats = query({
  args: {},
  handler: async (ctx) => {
    const [trades, agents, users, signals] = await Promise.all([
      ctx.db.query("trades").collect(),
      ctx.db.query("agents").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("signals").collect(),
    ]);

    const verifiedOnchain = trades.filter(
      (t) => t.executionMode === "onchain" && Boolean(t.txSignature) && t.confirmationSlot !== undefined,
    );
    const pendingOnchain = trades.filter(
      (t) => t.executionMode === "onchain" && (!t.txSignature || t.confirmationSlot === undefined),
    );
    const paper = trades.filter((t) => t.executionMode !== "onchain");

    return {
      tradesExecuted: verifiedOnchain.length,
      verifiedOnchainTrades: verifiedOnchain.length,
      pendingOnchainTrades: pendingOnchain.length,
      paperTrades: paper.length,
      agentsDeployed: agents.length,
      totalUsers: users.length,
      signalsGenerated: signals.length,
      verifiedOnchainVolumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      pendingOnchainVolumeSol: pendingOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      paperVolumeSol: paper.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      // Backward compatibility: volumeSol means independently confirmed on-chain volume only.
      volumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
    };
  },
});
