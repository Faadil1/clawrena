import { query } from "../_generated/server";

export const publicStats = query({
  args: {},
  handler: async (ctx) => {
    const [trades, agents, users, signals, underwriting] = await Promise.all([
      ctx.db.query("trades").collect(),
      ctx.db.query("agents").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("signals").collect(),
      ctx.db.query("underwriting_decisions").collect(),
    ]);

    const verifiedOnchain = trades.filter(
      (t) => t.executionMode === "onchain" && Boolean(t.txSignature) && t.confirmationSlot !== undefined,
    );
    const pendingOnchain = trades.filter(
      (t) => t.executionMode === "onchain" && (!t.txSignature || t.confirmationSlot === undefined),
    );
    const paper = trades.filter((t) => t.executionMode !== "onchain");
    const underwritingQualified = underwriting.filter((row) => row.policyState === "QUALIFIED");
    const underwritingRefused = underwriting.filter((row) => row.policyState === "REFUSED");
    const lineageReruns = underwriting.filter((row) => Boolean(row.supersedesReplayKey));
    const externallyAttributed = underwriting.filter((row) => Boolean(row.caller?.platform && row.caller?.agentId));

    return {
      tradesExecuted: verifiedOnchain.length,
      verifiedOnchainTrades: verifiedOnchain.length,
      pendingOnchainTrades: pendingOnchain.length,
      paperTrades: paper.length,
      agentsDeployed: agents.length,
      totalUsers: users.length,
      signalsGenerated: signals.length,
      // Request counts only. These are not unique-agent counts and not trading volume.
      underwritingDecisions: underwriting.length,
      underwritingQualified: underwritingQualified.length,
      underwritingRefused: underwritingRefused.length,
      underwritingLineageReruns: lineageReruns.length,
      externallyAttributedUnderwritingRequests: externallyAttributed.length,
      verifiedOnchainVolumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      pendingOnchainVolumeSol: pendingOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      paperVolumeSol: paper.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
      volumeSol: verifiedOnchain.reduce((sum, t) => sum + (t.amountSol ?? 0), 0),
    };
  },
});
