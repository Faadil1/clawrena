"use node";

import { action, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { fetchPrices, fetchMarketSnapshot, fetchHolderConcentration } from "./lib/market";
import { evaluateLaunchEvidence } from "./lib/evidenceScore";

const DEFAULT_STOP_PCT = 0.2;
const DEFAULT_TAKE_PROFIT_PCT = 0.5;
const MAX_DISCOVERIES_PER_CYCLE = 3;
const FRACTION_OF_CASH_PER_ENTRY = 0.1;

type AgentState = {
  id: Id<"agents">;
  status: "idle" | "running" | "paused" | "halted";
  autoTrading: boolean;
  ownerId: Id<"users">;
  riskMaxPosition: number;
  riskMaxDrawdownPct: number;
};

type OpenPosition = {
  _id: Id<"positions">;
  tokenMint: string;
  tokenSymbol?: string;
  sizeSol: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
};

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const targets: Array<{ id: Id<"agents">; status: string }> = await ctx.runQuery(
      internal.queries.internal.listEligibleAgents,
      {},
    );
    const summaries = [];
    for (const target of targets) summaries.push(await runCycle(ctx, target.id));
    return summaries;
  },
});

export const runNow = action({
  args: {},
  handler: async (ctx): Promise<{
    agentId: Id<"agents"> | null;
    outcome: string;
    reason?: string;
    positionsProcessed?: number;
    tradesExecuted?: number;
  }> => {
    const agentId: Id<"agents"> | null = await ctx.runQuery(internal.queries.internal.getMyAgentId, {});
    if (!agentId) return { agentId: null, outcome: "none", reason: "no agent" };
    return runCycle(ctx, agentId);
  },
});

async function runCycle(ctx: ActionCtx, agentId: Id<"agents">) {
  const startedAt = Date.now();
  const learned = await ctx.runQuery(internal.queries.internal.loadAgentContext, { agentId });
  if (!learned) return { agentId, outcome: "error", reason: "no agent" };

  const agent = learned.agent as AgentState;
  const open = (learned.openPositions ?? []) as OpenPosition[];
  if (agent.status !== "running" || !agent.autoTrading || !learned.portfolio) {
    await ctx.runMutation(internal.agents.logAgentRun, {
      agentId,
      startedAt,
      endedAt: Date.now(),
      scansProcessed: 0,
      tradesExecuted: 0,
      outcome: "ok",
    });
    return { agentId, outcome: "ok", positionsProcessed: 0, tradesExecuted: 0 };
  }

  const openMints = [...new Set(open.map((p) => p.tokenMint))];
  const prices = await fetchPrices(openMints);
  let tradesExecuted = 0;
  let processed = 0;

  for (const position of open) {
    const price = prices[position.tokenMint];
    if (price === undefined) continue;
    processed += 1;
    await ctx.runMutation(internal.trades.updatePositionPrice, {
      positionId: position._id,
      price,
      at: startedAt,
    });
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "price.tick",
      payload: { mint: position.tokenMint, price, source: "jupiter", at: startedAt },
    });

    if (position.stopLoss !== undefined && price <= position.stopLoss) {
      await ctx.runMutation(internal.trades.internalClosePosition, { positionId: position._id, reason: "stop" });
      tradesExecuted += 1;
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId,
        tokenMint: position.tokenMint,
        decision: "execute",
        executionMode: "paper",
        observations: { price, stopLoss: position.stopLoss },
        unknowns: [],
        reasons: ["deterministic stop-loss threshold reached"],
        riskBudgetSol: position.sizeSol,
      });
      await ctx.runMutation(internal.signals.createSignal, {
        tokenMint: position.tokenMint,
        ...(position.tokenSymbol && { tokenSymbol: position.tokenSymbol }),
        type: "warn",
        confidence: 100,
        score: -3,
        title: "Paper stop-loss executed",
        detail: `Paper position closed at ${price} after crossing stop ${position.stopLoss}.`,
        payload: { price, stop: position.stopLoss, direction: "sell", executionMode: "paper" },
      });
    } else if (position.takeProfit !== undefined && price >= position.takeProfit) {
      await ctx.runMutation(internal.trades.internalClosePosition, { positionId: position._id, reason: "target" });
      tradesExecuted += 1;
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId,
        tokenMint: position.tokenMint,
        decision: "execute",
        executionMode: "paper",
        observations: { price, takeProfit: position.takeProfit },
        unknowns: [],
        reasons: ["deterministic take-profit threshold reached"],
        riskBudgetSol: position.sizeSol,
      });
      await ctx.runMutation(internal.signals.createSignal, {
        tokenMint: position.tokenMint,
        ...(position.tokenSymbol && { tokenSymbol: position.tokenSymbol }),
        type: "sell",
        confidence: 100,
        score: 3,
        title: "Paper take-profit executed",
        detail: `Paper position closed at ${price} after reaching target ${position.takeProfit}.`,
        payload: { price, target: position.takeProfit, executionMode: "paper" },
      });
    }
  }

  const discovered = await discoverEntries(ctx, agent, openMints);
  tradesExecuted += discovered.tradesExecuted;
  processed += discovered.candidatesExamined;

  const fresh = await ctx.runQuery(internal.queries.internal.loadAgentContext, { agentId });
  let outcome: "ok" | "halted" = "ok";
  const freshAgent = fresh?.agent as AgentState | undefined;
  if (fresh?.portfolio && fresh.openPositions.length > 0 && freshAgent) {
    const cost = fresh.portfolio.investedSol;
    const value = fresh.openPositions.reduce(
      (sum: number, p: OpenPosition) => sum + (p.currentPrice / p.entryPrice) * p.sizeSol,
      0,
    );
    const maxDrawdownPct = freshAgent.riskMaxDrawdownPct;
    const threshold = cost * (1 - Math.min(100, Math.max(0, maxDrawdownPct)) / 100);
    if (cost > 0 && value < threshold) {
      await ctx.runMutation(internal.agents.internalSetStatus, { agentId, status: "halted" });
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId,
        tokenMint: fresh.openPositions[0].tokenMint,
        decision: "reject",
        executionMode: "paper",
        observations: { investedCostSol: cost, openValueSol: value, maxDrawdownPct },
        unknowns: [],
        reasons: ["portfolio drawdown guard halted new execution"],
      });
      await ctx.runMutation(internal.signals.createSignal, {
        tokenMint: fresh.openPositions[0].tokenMint,
        type: "warn",
        confidence: 100,
        score: -4,
        title: "Agent halted — drawdown guard",
        detail: `Harness halted: open paper value crossed the configured ${maxDrawdownPct}% drawdown cap. Explicit acknowledgement is required before restart.`,
        payload: { cost, value, maxDrawdownPct },
      });
      outcome = "halted";
    }
  }

  await ctx.runMutation(internal.agents.logAgentRun, {
    agentId,
    startedAt,
    endedAt: Date.now(),
    scansProcessed: processed,
    tradesExecuted,
    outcome,
  });
  return { agentId, outcome, positionsProcessed: processed, tradesExecuted };
}

async function discoverEntries(
  ctx: ActionCtx,
  agent: AgentState,
  alreadyHeldMints: string[],
): Promise<{ tradesExecuted: number; candidatesExamined: number }> {
  const candidates: Array<{
    signalId: Id<"signals">;
    mint: string;
    symbol: string | null;
    processedAt: number;
  }> = await ctx.runQuery(internal.queries.internal.listCandidateLaunches, {
    excludeMints: alreadyHeldMints,
  });
  if (candidates.length === 0) return { tradesExecuted: 0, candidatesExamined: 0 };

  const snap = await fetchMarketSnapshot(candidates.map((c) => c.mint));
  const holdings = await Promise.all(
    candidates.map((c) => fetchHolderConcentration(c.mint).catch(() => null)),
  );
  let remainingCash = Math.max(0, await currentCash(ctx, agent));
  let opened = 0;
  let examined = 0;

  for (let i = 0; i < candidates.length; i += 1) {
    if (opened >= MAX_DISCOVERIES_PER_CYCLE) break;
    const c = candidates[i];
    const claimed = await ctx.runMutation(internal.signals.claimSignal, {
      signalId: c.signalId,
      agentId: agent.id,
    });
    if (!claimed) continue;

    examined += 1;
    const market = snap[c.mint] ?? {};
    const holder = holdings[i];
    const verdict = evaluateLaunchEvidence({
      processedAt: c.processedAt,
      now: Date.now(),
      priceUsd: market.priceUsd,
      liquidityUsd: market.liquidityUsd,
      priceChange24h: market.priceChange24h,
      largestHolderPct: holder?.largestHolderPct ?? null,
    });

    if (!verdict.eligible) {
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId: agent.id,
        signalId: c.signalId,
        tokenMint: c.mint,
        decision: "reject",
        executionMode: "paper",
        score: verdict.score,
        observations: verdict.observations,
        unknowns: verdict.unknowns,
        reasons: [...verdict.reasons, ...verdict.blockers],
      });
      await ctx.runMutation(internal.signals.recordTelemetry, {
        eventType: "agent.evidenceReject",
        payload: { mint: c.mint, score: verdict.score, blockers: verdict.blockers, unknowns: verdict.unknowns, at: Date.now() },
      });
      await ctx.runMutation(internal.signals.releaseSignalClaim, {
        signalId: c.signalId,
        agentId: agent.id,
      });
      continue;
    }

    if (remainingCash <= 0) {
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId: agent.id,
        signalId: c.signalId,
        tokenMint: c.mint,
        decision: "skip",
        executionMode: "paper",
        score: verdict.score,
        observations: verdict.observations,
        unknowns: verdict.unknowns,
        reasons: [...verdict.reasons, "no paper cash available"],
      });
      await ctx.runMutation(internal.signals.releaseSignalClaim, {
        signalId: c.signalId,
        agentId: agent.id,
      });
      continue;
    }

    const price = market.priceUsd;
    if (price === undefined || price <= 0) {
      await ctx.runMutation(internal.signals.releaseSignalClaim, { signalId: c.signalId, agentId: agent.id });
      continue;
    }
    const sizeSol = Math.min(agent.riskMaxPosition, remainingCash * FRACTION_OF_CASH_PER_ENTRY);
    try {
      await ctx.runMutation(internal.trades.internalOpenPosition, {
        agentId: agent.id,
        tokenMint: c.mint,
        ...(c.symbol && { tokenSymbol: c.symbol }),
        sizeSol,
        price,
        stopLoss: price * (1 - DEFAULT_STOP_PCT),
        takeProfit: price * (1 + DEFAULT_TAKE_PROFIT_PCT),
      });
      await ctx.runMutation(internal.signals.markSignalActed, {
        signalId: c.signalId,
        agentId: agent.id,
      });
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId: agent.id,
        signalId: c.signalId,
        tokenMint: c.mint,
        decision: "execute",
        executionMode: "paper",
        score: verdict.score,
        observations: verdict.observations,
        unknowns: verdict.unknowns,
        reasons: verdict.reasons,
        riskBudgetSol: sizeSol,
      });
      await ctx.runMutation(internal.signals.createSignal, {
        tokenMint: c.mint,
        ...(c.symbol && { tokenSymbol: c.symbol }),
        type: "buy",
        confidence: verdict.score,
        score: verdict.score,
        title: "Evidence gate passed — paper position opened",
        detail: `Score ${verdict.score}/100. Paper entry ${formatSol(sizeSol)} at ${price}; stop ${price * (1 - DEFAULT_STOP_PCT)}, target ${price * (1 + DEFAULT_TAKE_PROFIT_PCT)}.`,
        payload: {
          executionMode: "paper",
          evidenceScore: verdict.score,
          observations: verdict.observations,
          unknowns: verdict.unknowns,
          price,
          sizeSol,
        },
      });
      remainingCash -= sizeSol;
      opened += 1;
    } catch (error) {
      await ctx.runMutation(internal.evidence.recordDecision, {
        agentId: agent.id,
        signalId: c.signalId,
        tokenMint: c.mint,
        decision: "skip",
        executionMode: "paper",
        score: verdict.score,
        observations: verdict.observations,
        unknowns: verdict.unknowns,
        reasons: [...verdict.reasons, error instanceof Error ? error.message : "position open failed"],
      });
      await ctx.runMutation(internal.signals.releaseSignalClaim, {
        signalId: c.signalId,
        agentId: agent.id,
      });
    }
  }
  return { tradesExecuted: opened, candidatesExamined: examined };
}

async function currentCash(ctx: ActionCtx, agent: AgentState): Promise<number> {
  const fresh = await ctx.runQuery(internal.queries.internal.loadAgentContext, { agentId: agent.id });
  return fresh?.portfolio?.cashSol ?? 0;
}

function formatSol(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
