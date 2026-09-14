"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  buildClawPumpSwap,
  clawPumpConfigured,
  createClawPumpAgent,
  listClawPumpAgents,
  quoteClawPumpSwap,
} from "./lib/clawpump";
import { SOL_MINT } from "./lib/market";

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const connectionStatus = action({
  args: {},
  handler: async (ctx) => {
    const agent = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {});
    if (!agent) throw new Error("Not authenticated or no local agent");
    return {
      configured: clawPumpConfigured(),
      linked: Boolean(agent.clawPumpAgentId),
      clawPumpAgentId: agent.clawPumpAgentId ?? null,
      clawPumpWalletAddress: agent.clawPumpWalletAddress ?? null,
    };
  },
});

export const syncAgent = action({
  args: {},
  handler: async (ctx) => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {});
    if (!local) throw new Error("Not authenticated or no local agent");
    if (local.clawPumpAgentId) {
      return {
        linked: true,
        id: local.clawPumpAgentId,
        walletAddress: local.clawPumpWalletAddress ?? null,
        existing: true,
      };
    }

    const catalogue = await listClawPumpAgents();
    const existingRemote = catalogue.agents?.find((a) => a.name === local.name);
    const created = existingRemote
      ? { ...existingRemote, meta: catalogue.meta }
      : await createClawPumpAgent({
          name: local.name,
          systemPrompt:
            "You are Alpha Scout. Trade only when the caller provides a deterministic evidence receipt and explicit risk budget. Never infer missing risk evidence. Refuse unverified/high-risk tokens rather than bypassing safety gates.",
        });
    if (!created.id) throw new Error("ClawPump did not return an agent id");

    await ctx.runMutation(internal.agents.linkClawPumpAgent, {
      agentId: local.id,
      clawPumpAgentId: created.id,
      ...(created.walletAddress && { clawPumpWalletAddress: created.walletAddress }),
    });
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "clawpump.agent.linked",
      payload: {
        localAgentId: local.id,
        clawPumpAgentId: created.id,
        requestId: created.meta?.requestId,
        at: Date.now(),
      },
    });

    return {
      linked: true,
      id: created.id,
      walletAddress: created.walletAddress ?? null,
      requestId: created.meta?.requestId ?? null,
      existing: Boolean(existingRemote),
    };
  },
});

export const quoteEntry = action({
  args: { decisionReceiptId: v.id("decision_receipts") },
  handler: async (ctx, { decisionReceiptId }) => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {});
    if (!local?.clawPumpAgentId) throw new Error("Link the local agent to ClawPump first");
    const receipt = await ctx.runQuery(internal.queries.internal.getDecisionReceiptForAgent, {
      receiptId: decisionReceiptId,
      agentId: local.id,
    });
    if (!receipt || receipt.decision !== "execute" || (receipt.score ?? 0) < 55) {
      throw new Error("A passing execution receipt is required before a ClawPump quote");
    }
    if (!MINT_RE.test(receipt.tokenMint)) throw new Error("Receipt contains an invalid Solana mint");
    const amountSol = Math.min(receipt.riskBudgetSol ?? 0, local.riskMaxPosition);
    if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error("Receipt has no executable risk budget");
    const quote = await quoteClawPumpSwap({
      agentId: local.clawPumpAgentId,
      inputMint: SOL_MINT,
      outputMint: receipt.tokenMint,
      amount: amountSol,
      slippageBps: 50,
    });
    return { quote, requestId: quote.meta?.requestId ?? null, tokenMint: receipt.tokenMint, amountSol };
  },
});

export const buildEntry = action({
  args: { decisionReceiptId: v.id("decision_receipts") },
  handler: async (ctx, { decisionReceiptId }) => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {});
    if (!local?.clawPumpAgentId) throw new Error("Link the local agent to ClawPump first");
    const receipt = await ctx.runQuery(internal.queries.internal.getDecisionReceiptForAgent, {
      receiptId: decisionReceiptId,
      agentId: local.id,
    });
    if (!receipt || receipt.decision !== "execute" || (receipt.score ?? 0) < 55) {
      throw new Error("A passing execution receipt is required before a ClawPump build");
    }
    if (!MINT_RE.test(receipt.tokenMint)) throw new Error("Receipt contains an invalid Solana mint");
    const amountSol = Math.min(receipt.riskBudgetSol ?? 0, local.riskMaxPosition);
    if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error("Receipt has no executable risk budget");

    const built = await buildClawPumpSwap({
      agentId: local.clawPumpAgentId,
      inputMint: SOL_MINT,
      outputMint: receipt.tokenMint,
      amount: amountSol,
      slippageBps: 50,
    });
    const requestId = built.meta?.requestId;

    await ctx.runMutation(internal.evidence.recordDecision, {
      agentId: local.id,
      signalId: receipt.signalId,
      tokenMint: receipt.tokenMint,
      decision: "prepare",
      executionMode: "onchain",
      score: receipt.score,
      observations: { provider: "clawpump", unsignedSwapBuilt: true, authorizedByReceipt: decisionReceiptId },
      unknowns: ["wallet signature", "Solana confirmation"],
      reasons: ["ClawPump safety-gated swap transaction prepared from a stored passing receipt; not counted as executed"],
      riskBudgetSol: amountSol,
      quote: { provider: "clawpump", requestId: requestId ?? null, unsignedSwapBuilt: true },
      ...(requestId && { requestId }),
    });

    return {
      status: "signature_required" as const,
      requestId: requestId ?? null,
      tokenMint: receipt.tokenMint,
      amountSol,
      transaction: built,
    };
  },
});
