import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const CLAIM_LEASE_MS = 2 * 60 * 1000;

export const recordTelemetry = internalMutation({
  args: { eventType: v.string(), payload: v.any() },
  handler: async (ctx, { eventType, payload }) => {
    await ctx.db.insert("telemetry", { eventType, payload, timestamp: Date.now() });
  },
});

export const createSignal = internalMutation({
  args: {
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    type: v.union(v.literal("buy"), v.literal("sell"), v.literal("warn"), v.literal("new-launch"), v.literal("alert")),
    confidence: v.number(),
    score: v.number(),
    title: v.string(),
    detail: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("signals", { ...args, processedAt: Date.now() });
  },
});

/**
 * Atomically lease one launch signal to one agent. Convex mutations are
 * transactional, so concurrent runNow/cron cycles cannot both acquire the same
 * fresh lease. Stale leases expire automatically after two minutes.
 */
export const claimSignal = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents") },
  handler: async (ctx, { signalId, agentId }) => {
    const signal = await ctx.db.get(signalId);
    if (!signal || signal.type !== "new-launch" || signal.actedOn === true) return false;
    const now = Date.now();
    const activeLease =
      signal.claimStatus === "claimed" &&
      signal.claimedAt !== undefined &&
      now - signal.claimedAt < CLAIM_LEASE_MS;
    if (activeLease && signal.claimedByAgentId !== agentId) return false;
    if (activeLease && signal.claimedByAgentId === agentId) return true;
    await ctx.db.patch(signalId, {
      claimStatus: "claimed",
      claimedByAgentId: agentId,
      claimedAt: now,
    });
    return true;
  },
});

export const releaseSignalClaim = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents") },
  handler: async (ctx, { signalId, agentId }) => {
    const signal = await ctx.db.get(signalId);
    if (!signal || signal.actedOn === true || signal.claimedByAgentId !== agentId) return false;
    await ctx.db.patch(signalId, {
      claimStatus: "released",
      claimedByAgentId: undefined,
      claimedAt: undefined,
    });
    return true;
  },
});

export const markSignalActed = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents") },
  handler: async (ctx, { signalId, agentId }) => {
    const signal = await ctx.db.get(signalId);
    if (!signal) return null;
    if (signal.claimedByAgentId !== agentId) throw new Error("Signal is not claimed by this agent");
    return ctx.db.patch(signalId, {
      actedOn: true,
      actedAt: Date.now(),
      claimStatus: "acted",
    });
  },
});

export const sweepTelemetryRows = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, { cutoff }) => {
    const old = await ctx.db.query("telemetry").withIndex("by_timestamp", (q) => q.lte("timestamp", cutoff)).take(5000);
    let deleted = 0;
    for (const row of old) {
      await ctx.db.delete(row._id);
      deleted += 1;
    }
    return deleted;
  },
});

export const ingestWebhookEvents = internalMutation({
  args: {
    events: v.array(v.object({ mint: v.string(), signature: v.optional(v.string()), ts: v.optional(v.number()) })),
  },
  handler: async (ctx, { events }) => {
    let inserted = 0;
    for (const ev of events) {
      const existing = await ctx.db
        .query("signals")
        .withIndex("by_tokenMint_type", (q) => q.eq("tokenMint", ev.mint).eq("type", "new-launch"))
        .first();
      if (existing) continue;
      await ctx.db.insert("signals", {
        tokenMint: ev.mint,
        type: "new-launch",
        confidence: 0,
        score: 0,
        title: "New launch observed on-chain",
        detail: ev.signature
          ? `Fresh token creation observed at ${new Date(ev.ts ?? Date.now()).toISOString()} (tx ${ev.signature.slice(0, 12)}…). Evidence gate pending.`
          : "Fresh token creation observed on-chain. Evidence gate pending.",
        payload: { source: "onchain-launch-observation", signature: ev.signature, ts: ev.ts ?? Date.now() },
        processedAt: Date.now(),
      });
      inserted += 1;
    }
    return { inserted };
  },
});
