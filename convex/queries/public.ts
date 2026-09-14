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
    const verifiedOnchain = trades.filter((t) => t.executionMode === "onchain" && Boolean(t.txSignature));
    const paper = trades.filter((t) => t.executionMode !== "onchain" || !t.txSignature);
    return {
      tradesExecuted: verifiedOnchain.length,
      verifiedOnchainTrades: verifiedOnchain.length,
      paperTrades: paper.length,
      agentsDeployed: agents.length,
      totalUsers: users.length,
      signalsGenerated: signals.length,
      verifiedOnchainVolumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      paperVolumeSol: paper.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      // Backward compatibility: volumeSol now means verified volume only.
      volumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
    };
  },
});
