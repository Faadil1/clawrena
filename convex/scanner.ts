"use node";

import { action, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { fetchLaunchMints, findMintCreatedInTx, isMarketConfigured } from "./lib/market";

type LaunchEvent = { mint: string; signature: string; ts: number };
type ScanResult = { configured: boolean; verified: number; inserted: number };

async function ingestVerified(ctx: ActionCtx, events: LaunchEvent[]): Promise<number> {
  if (events.length === 0) return 0;
  const result = await ctx.runMutation(internal.signals.ingestWebhookEvents, { events }) as { inserted: number };
  return result.inserted;
}

export const discover = internalAction({
  args: {},
  handler: async (ctx): Promise<ScanResult> => {
    const startedAt = Date.now();
    const configured = isMarketConfigured();
    const events = await fetchLaunchMints(40, 2);
    const inserted: number = await ingestVerified(ctx, events);
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "scanner.run",
      payload: {
        source: "pump.fun",
        verification: "create-discriminator",
        configured,
        searchedSignatureLimit: 40,
        verified: events.length,
        inserted,
        at: startedAt,
      },
    });
    return { configured, verified: events.length, inserted };
  },
});

export const discoverNow = action({
  args: {},
  handler: async (ctx): Promise<ScanResult & { events: LaunchEvent[]; searchedSignatureLimit: number }> => {
    const searchedSignatureLimit = 60;
    const events = await fetchLaunchMints(searchedSignatureLimit, 3);
    const inserted: number = await ingestVerified(ctx, events);
    return {
      configured: isMarketConfigured(),
      verified: events.length,
      inserted,
      searchedSignatureLimit,
      events,
    };
  },
});

/** Helius webhook signatures are candidates only; RPC instruction parsing is authority. */
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
