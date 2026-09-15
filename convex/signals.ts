import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { canAcquireClaim } from "./lib/claimLease";

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
 * Claim one launch for one agent + run token. The lease lives in a separate
 * signal_executions row, so another user's agent is never blocked merely
 * because somebody else already acted on the same global launch signal.
 */
export const claimSignal = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents"), claimToken: v.string() },
  handler: async (ctx, { signalId, agentId, claimToken }) => {
    const signal = await ctx.db.get(signalId);
    if (!signal || signal.type !== "new-launch") return false;
    const now = Date.now();
    const existing = await ctx.db
      .query("signal_executions")
      .withIndex("by_agentId_signalId", (q) => q.eq("agentId", agentId).eq("signalId", signalId))
      .first();

    if (!canAcquireClaim(existing, claimToken, now)) return false;
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "claimed",
        claimToken,
        claimedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("signal_executions", {
        signalId,
        agentId,
        status: "claimed",
        claimToken,
        claimedAt: now,
        updatedAt: now,
      });
    }
    return true;
  },
});

export const releaseSignalClaim = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents"), claimToken: v.string() },
  handler: async (ctx, { signalId, agentId, claimToken }) => {
    const execution = await ctx.db
      .query("signal_executions")
      .withIndex("by_agentId_signalId", (q) => q.eq("agentId", agentId).eq("signalId", signalId))
      .first();
    if (!execution || execution.status === "acted" || execution.claimToken !== claimToken) return false;
    await ctx.db.patch(execution._id, {
      status: "released",
      claimToken: undefined,
      claimedAt: undefined,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const markSignalActed = internalMutation({
  args: { signalId: v.id("signals"), agentId: v.id("agents"), claimToken: v.string() },
  handler: async (ctx, { signalId, agentId, claimToken }) => {
    const execution = await ctx.db
      .query("signal_executions")
      .withIndex("by_agentId_signalId", (q) => q.eq("agentId", agentId).eq("signalId", signalId))
      .first();
    if (!execution || execution.status !== "claimed" || execution.claimToken !== claimToken) {
      throw new Error("Signal execution lease is not owned by this agent run");
    }
    await ctx.db.patch(execution._id, { status: "acted", actedAt: Date.now(), updatedAt: Date.now() });
    return true;
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
        title: "Pump create instruction verified on-chain",
        detail: ev.signature
          ? `Verified Pump create/create_v2 instruction at ${new Date(ev.ts ?? Date.now()).toISOString()} (tx ${ev.signature.slice(0, 12)}…). Evidence gate pending.`
          : "Verified Pump create/create_v2 instruction. Evidence gate pending.",
        payload: { source: "pump-create-instruction", signature: ev.signature, ts: ev.ts ?? Date.now() },
        processedAt: Date.now(),
      });
      inserted += 1;
    }
    return { inserted };
  },
});
