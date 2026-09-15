"use node";

import { action, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  fetchLaunchMintsWithDiagnostics,
  findMintCreatedInTx,
  type LaunchDiscoverySourceResult,
} from "./lib/market";

type LaunchEvent = { mint: string; signature: string; ts: number };
type ScanResult = {
  configured: boolean;
  verified: number;
  inserted: number;
  signaturesExamined: number;
  pagesSearched: number;
  discoverySource: "pump-mint-authority" | "pump-program-fallback" | "none";
  sources: LaunchDiscoverySourceResult[];
};

async function ingestVerified(ctx: ActionCtx, events: LaunchEvent[]): Promise<number> {
  if (events.length === 0) return 0;
  const result = await ctx.runMutation(internal.signals.ingestWebhookEvents, { events }) as { inserted: number };
  return result.inserted;
}

export const discover = internalAction({
  args: {},
  handler: async (ctx): Promise<ScanResult> => {
    const startedAt = Date.now();
    const discovery = await fetchLaunchMintsWithDiagnostics(60, 2);
    const inserted: number = await ingestVerified(ctx, discovery.events);
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "scanner.run",
      payload: {
        source: "pump.fun",
        candidateSource: discovery.discoverySource,
        sources: discovery.sources,
        verification: "official-create-or-create-v2-top-level-or-cpi",
        configured: discovery.dedicatedRpcConfigured,
        signatureLimitRequested: discovery.signatureLimitRequested,
        signatureLimitApplied: discovery.signatureLimitApplied,
        signaturesExamined: discovery.signaturesExamined,
        pagesSearched: discovery.pagesSearched,
        verified: discovery.events.length,
        inserted,
        at: startedAt,
      },
    });
    return {
      configured: discovery.dedicatedRpcConfigured,
      verified: discovery.events.length,
      inserted,
      signaturesExamined: discovery.signaturesExamined,
      pagesSearched: discovery.pagesSearched,
      discoverySource: discovery.discoverySource,
      sources: discovery.sources,
    };
  },
});

/**
 * Judge/runtime proof discovery. The requested window is bounded in market.ts
 * to 500 signatures. The first 100 candidates come from Pump's mint-authority
 * PDA; broad program history is used only as a strict fallback.
 */
export const discoverNow = action({
  args: { signatureLimit: v.optional(v.number()) },
  handler: async (ctx, { signatureLimit }): Promise<ScanResult & {
    events: LaunchEvent[];
    signatureLimitRequested: number;
    signatureLimitApplied: number;
  }> => {
    const discovery = await fetchLaunchMintsWithDiagnostics(signatureLimit ?? 120, 3);
    const inserted: number = await ingestVerified(ctx, discovery.events);
    return {
      configured: discovery.dedicatedRpcConfigured,
      verified: discovery.events.length,
      inserted,
      signaturesExamined: discovery.signaturesExamined,
      pagesSearched: discovery.pagesSearched,
      discoverySource: discovery.discoverySource,
      sources: discovery.sources,
      signatureLimitRequested: discovery.signatureLimitRequested,
      signatureLimitApplied: discovery.signatureLimitApplied,
      events: discovery.events,
    };
  },
});

/** Helius is transport; RPC instruction parsing remains launch authority. */
export const verifyLaunchSignatures = internalAction({
  args: { signatures: v.array(v.string()) },
  handler: async (ctx, { signatures }): Promise<{ candidates: number; verified: number; inserted: number }> => {
    const events: LaunchEvent[] = [];
    for (const signature of [...new Set(signatures as string[])].slice(0, 20)) {
      const verified = await findMintCreatedInTx(signature);
      if (verified) events.push({ mint: verified.mint, signature, ts: verified.blockTime ?? Date.now() });
    }
    const inserted: number = await ingestVerified(ctx, events);
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "scanner.webhookVerify",
      payload: { candidates: signatures.length, verified: events.length, inserted, at: Date.now() },
    });
    return { candidates: signatures.length, verified: events.length, inserted };
  },
});
