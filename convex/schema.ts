import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Alpha Scout data model.
 *
 * Migration rule: new proof/execution fields are optional on existing tables so
 * the winning delta can deploy over the current pre-launch database without
 * rewriting historical rows. Missing executionMode is treated as paper.
 */
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    tokenIdentifier: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    agentDeployed: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("email", ["email"])
    .index("phone", ["phone"]),

  portfolios: defineTable({
    ownerId: v.id("users"),
    agentId: v.optional(v.id("agents")),
    cashSol: v.number(),
    investedSol: v.number(),
    depositedSol: v.optional(v.number()),
    observedWalletSol: v.optional(v.number()),
    observedWalletAt: v.optional(v.number()),
    equityHighWaterSol: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  deposits: defineTable({
    portfolioId: v.id("portfolios"),
    amountSol: v.number(),
    source: v.union(v.literal("manual"), v.literal("wallet")),
    txSignature: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_portfolioId_createdAt", ["portfolioId", "createdAt"]),

  agents: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    status: v.union(v.literal("idle"), v.literal("running"), v.literal("paused"), v.literal("halted")),
    walletAddress: v.optional(v.string()),
    clawPumpAgentId: v.optional(v.string()),
    clawPumpWalletAddress: v.optional(v.string()),
    riskMaxPosition: v.number(),
    riskMaxDrawdownPct: v.number(),
    autoTrading: v.boolean(),
    haltReason: v.optional(v.string()),
    haltedAt: v.optional(v.number()),
    requiresRiskAck: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status_autoTrading", ["status", "autoTrading"]),

  positions: defineTable({
    agentId: v.optional(v.id("agents")),
    portfolioId: v.id("portfolios"),
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    sizeSol: v.number(),
    entryPrice: v.number(),
    currentPrice: v.number(),
    pnlSol: v.number(),
    pnlPct: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
    executionMode: v.optional(v.union(v.literal("paper"), v.literal("onchain"))),
    txSignature: v.optional(v.string()),
    venue: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("closed"), v.literal("closed_stop"), v.literal("closed_target")),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_portfolioId_status", ["portfolioId", "status"])
    .index("by_agentId", ["agentId"]),

  trades: defineTable({
    portfolioId: v.id("portfolios"),
    agentId: v.optional(v.id("agents")),
    direction: v.union(v.literal("buy"), v.literal("sell")),
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    amountSol: v.number(),
    price: v.number(),
    pnlUsd: v.optional(v.number()),
    pnlPct: v.optional(v.number()),
    pnlSol: v.optional(v.number()),
    executionMode: v.optional(v.union(v.literal("paper"), v.literal("onchain"))),
    txSignature: v.optional(v.string()),
    confirmationSlot: v.optional(v.number()),
    venue: v.optional(v.string()),
    providerRequestId: v.optional(v.string()),
    executedBy: v.union(v.literal("user"), v.literal("agent")),
    timestamp: v.number(),
  })
    .index("by_portfolioId_timestamp", ["portfolioId", "timestamp"])
    .index("by_agentId", ["agentId"]),

  signals: defineTable({
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    type: v.union(v.literal("buy"), v.literal("sell"), v.literal("warn"), v.literal("new-launch"), v.literal("alert")),
    confidence: v.number(),
    score: v.number(),
    title: v.string(),
    detail: v.string(),
    payload: v.any(),
    actedOn: v.optional(v.boolean()),
    actedAt: v.optional(v.number()),
    claimStatus: v.optional(v.union(v.literal("claimed"), v.literal("released"), v.literal("acted"))),
    claimedByAgentId: v.optional(v.id("agents")),
    claimedAt: v.optional(v.number()),
    claimToken: v.optional(v.string()),
    processedAt: v.number(),
  })
    .index("by_processedAt", ["processedAt"])
    .index("by_tokenMint_type", ["tokenMint", "type"])
    .index("by_type_processedAt", ["type", "processedAt"]),

  signal_executions: defineTable({
    signalId: v.id("signals"),
    agentId: v.id("agents"),
    status: v.union(v.literal("claimed"), v.literal("released"), v.literal("acted")),
    claimToken: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    actedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_agentId", ["agentId"])
    .index("by_agentId_signalId", ["agentId", "signalId"]),

  decision_receipts: defineTable({
    agentId: v.id("agents"),
    signalId: v.optional(v.id("signals")),
    tokenMint: v.string(),
    decision: v.union(v.literal("execute"), v.literal("reject"), v.literal("skip"), v.literal("prepare")),
    executionMode: v.union(v.literal("paper"), v.literal("onchain")),
    score: v.optional(v.number()),
    observations: v.any(),
    unknowns: v.array(v.string()),
    reasons: v.array(v.string()),
    riskBudgetSol: v.optional(v.number()),
    quote: v.optional(v.any()),
    txSignature: v.optional(v.string()),
    requestId: v.optional(v.string()),
    policyVersion: v.optional(v.string()),
    replayKey: v.optional(v.string()),
    policyState: v.optional(v.union(v.literal("QUALIFIED"), v.literal("REFUSED"), v.literal("ABSTAINED"), v.literal("PREPARED"))),
    freshnessExpiresAt: v.optional(v.number()),
    counterfactuals: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_agentId_createdAt", ["agentId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  underwriting_decisions: defineTable({
    tokenMint: v.string(),
    launchSignature: v.string(),
    policyVersion: v.string(),
    replayKey: v.string(),
    policyState: v.union(v.literal("QUALIFIED"), v.literal("REFUSED")),
    score: v.optional(v.number()),
    observations: v.any(),
    unknowns: v.array(v.string()),
    reasons: v.array(v.string()),
    blockers: v.array(v.string()),
    sourceLedger: v.any(),
    freshnessExpiresAt: v.number(),
    supersedesReplayKey: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_replayKey", ["replayKey"])
    .index("by_tokenMint_createdAt", ["tokenMint", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  products: defineTable({
    mint: v.string(),
    name: v.string(),
    symbol: v.string(),
    supply: v.number(),
    curveState: v.any(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  agent_runs: defineTable({
    agentId: v.id("agents"),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    scansProcessed: v.number(),
    tradesExecuted: v.number(),
    outcome: v.union(v.literal("ok"), v.literal("halted"), v.literal("error")),
    error: v.optional(v.string()),
  })
    .index("by_agentId_startedAt", ["agentId", "startedAt"])
    .index("by_startedAt", ["startedAt"]),

  telemetry: defineTable({
    eventType: v.string(),
    payload: v.any(),
    walletAddress: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
