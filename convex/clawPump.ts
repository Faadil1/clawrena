"use node";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  buildClawPumpSwap,
  clawPumpConfigured,
  createClawPumpAgent,
  getClawPumpAgent,
  listClawPumpAgents,
  quoteClawPumpSwap,
} from "./lib/clawpump";
import { SOL_MINT } from "./lib/market";
import { evaluateExecutionAuthority } from "./lib/executionAuthority";

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type LocalAgent = {
  id: Id<"agents">;
  name: string;
  clawPumpAgentId?: string;
  clawPumpWalletAddress?: string;
  riskMaxPosition: number;
};

type StoredReceipt = {
  signalId?: Id<"signals">;
  tokenMint: string;
  decision: "execute" | "reject" | "skip" | "prepare";
  score?: number;
  riskBudgetSol?: number;
  unknowns: string[];
  createdAt: number;
};

type ConnectionStatusResult = {
  configured: boolean;
  linked: boolean;
  clawPumpAgentId: string | null;
  clawPumpWalletAddress: string | null;
};

type SyncAgentResult = {
  linked: true;
  id: string;
  walletAddress: string | null;
  requestId?: string | null;
  existing: boolean;
};

type RemoteAgentWithMeta = {
  id: string;
  name?: string;
  walletAddress?: string;
  status?: string;
  meta?: { requestId?: string };
};

type QuoteEntryResult = {
  quote: Record<string, unknown>;
  requestId: string | null;
  tokenMint: string;
  amountSol: number;
};

type BuildEntryResult = {
  status: "signature_required";
  requestId: string | null;
  tokenMint: string;
  amountSol: number;
  transaction: Record<string, unknown>;
};

export const connectionStatus = action({
  args: {},
  handler: async (ctx): Promise<ConnectionStatusResult> => {
    const agent = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {}) as LocalAgent | null;
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
  handler: async (ctx): Promise<SyncAgentResult> => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {}) as LocalAgent | null;
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
    const created: RemoteAgentWithMeta = existingRemote
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
  handler: async (ctx, { decisionReceiptId }): Promise<QuoteEntryResult> => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {}) as LocalAgent | null;
    if (!local) throw new Error("Not authenticated or no local agent");
    const receipt = await ctx.runQuery(internal.queries.internal.getDecisionReceiptForAgent, {
      receiptId: decisionReceiptId,
      agentId: local.id,
    }) as StoredReceipt | null;
    if (!receipt) throw new Error("Stored decision receipt not found for this agent");
    if (!MINT_RE.test(receipt.tokenMint)) throw new Error("Receipt contains an invalid Solana mint");

    const amountSol = Math.min(receipt.riskBudgetSol ?? 0, local.riskMaxPosition);
    await requireLiveExecutionAuthority(ctx, local, receipt, amountSol, "quote");

    const quote = await quoteClawPumpSwap({
      agentId: local.clawPumpAgentId!,
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
  handler: async (ctx, { decisionReceiptId }): Promise<BuildEntryResult> => {
    const local = await ctx.runQuery(internal.queries.internal.getMyAgentForClawPump, {}) as LocalAgent | null;
    if (!local) throw new Error("Not authenticated or no local agent");
    const receipt = await ctx.runQuery(internal.queries.internal.getDecisionReceiptForAgent, {
      receiptId: decisionReceiptId,
      agentId: local.id,
    }) as StoredReceipt | null;
    if (!receipt) throw new Error("Stored decision receipt not found for this agent");
    if (!MINT_RE.test(receipt.tokenMint)) throw new Error("Receipt contains an invalid Solana mint");

    const amountSol = Math.min(receipt.riskBudgetSol ?? 0, local.riskMaxPosition);
    const authority = await requireLiveExecutionAuthority(ctx, local, receipt, amountSol, "build");

    const built = await buildClawPumpSwap({
      agentId: local.clawPumpAgentId!,
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
      observations: {
        provider: "clawpump",
        providerPreflightHealthy: true,
        receiptAgeMs: authority.receiptAgeMs,
        unsignedSwapBuilt: true,
        authorizedByReceipt: decisionReceiptId,
      },
      unknowns: ["wallet signature", "Solana confirmation"],
      reasons: ["fresh evidence + live provider preflight authorized an unsigned ClawPump swap build; not counted as executed"],
      riskBudgetSol: amountSol,
      quote: { provider: "clawpump", requestId: requestId ?? null, unsignedSwapBuilt: true },
      ...(requestId && { requestId }),
    });

    return {
      status: "signature_required",
      requestId: requestId ?? null,
      tokenMint: receipt.tokenMint,
      amountSol,
      transaction: built,
    };
  },
});

async function requireLiveExecutionAuthority(
  ctx: ActionCtx,
  local: LocalAgent,
  receipt: StoredReceipt,
  amountSol: number,
  operation: "quote" | "build",
): Promise<{ authorized: boolean; receiptAgeMs: number; blockers: string[] }> {
  let providerHealthy = false;
  let providerFailure: string | undefined;

  if (clawPumpConfigured() && local.clawPumpAgentId) {
    try {
      const remote = await getClawPumpAgent(local.clawPumpAgentId);
      providerHealthy = remote.id === local.clawPumpAgentId;
      if (!providerHealthy) providerFailure = "linked ClawPump agent did not match the live provider record";
    } catch (error) {
      providerFailure = error instanceof Error ? error.message : "ClawPump provider preflight failed";
    }
  }

  const verdict = evaluateExecutionAuthority({
    now: Date.now(),
    receiptCreatedAt: receipt.createdAt,
    decision: receipt.decision,
    score: receipt.score,
    riskBudgetSol: amountSol,
    unknowns: receipt.unknowns,
    providerConfigured: clawPumpConfigured(),
    providerLinked: Boolean(local.clawPumpAgentId),
    providerHealthy,
  });

  if (!verdict.authorized) {
    const reasons = [...verdict.blockers, ...(providerFailure ? [providerFailure] : [])];
    await ctx.runMutation(internal.evidence.recordDecision, {
      agentId: local.id,
      signalId: receipt.signalId,
      tokenMint: receipt.tokenMint,
      decision: "reject",
      executionMode: "onchain",
      score: receipt.score,
      observations: {
        provider: "clawpump",
        operation,
        providerConfigured: clawPumpConfigured(),
        providerLinked: Boolean(local.clawPumpAgentId),
        providerHealthy,
        receiptAgeMs: verdict.receiptAgeMs,
      },
      unknowns: providerHealthy ? receipt.unknowns : [...receipt.unknowns, "ClawPump provider health"],
      reasons,
      ...(amountSol > 0 && { riskBudgetSol: amountSol }),
    });
    throw new Error(`Execution authority denied: ${reasons.join("; ")}`);
  }

  return verdict;
}
