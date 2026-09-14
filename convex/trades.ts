import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { fetchPrices, fetchTokenMeta } from "./lib/market";
import type { Doc } from "./_generated/dataModel";

export const openPosition = action({
  args: {
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    sizeSol: v.number(),
    price: v.optional(v.number()),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"positions"> | null> => {
    const mint = args.tokenMint.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error("Not a valid Solana mint");
    if (!Number.isFinite(args.sizeSol) || args.sizeSol <= 0) throw new Error("Position size must be positive");
    const prices = await fetchPrices([mint]);
    const price = prices[mint];
    if (price === undefined || price <= 0) throw new Error("No verifiable market price for this token — rejecting the order.");
    let symbol = args.tokenSymbol;
    if (!symbol) symbol = (await fetchTokenMeta(mint))?.symbol;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Not authenticated");
    return ctx.runMutation(internal.portfolio.internalPlaceUserPosition, {
      tokenMint: mint,
      ...(symbol && { tokenSymbol: symbol }),
      sizeSol: args.sizeSol,
      price,
      stopLoss: args.stopLoss,
      takeProfit: args.takeProfit,
    });
  },
});

export const internalOpenPosition = internalMutation({
  args: {
    agentId: v.id("agents"),
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    sizeSol: v.number(),
    price: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");
    if (agent.status !== "running" || !agent.autoTrading) throw new Error("Agent is not authorized to trade");
    if (args.sizeSol <= 0 || args.sizeSol > agent.riskMaxPosition) throw new Error("Position exceeds the agent risk limit");
    if (!Number.isFinite(args.price) || args.price <= 0) throw new Error("Position price must be positive");
    const portfolio = await ctx.db.query("portfolios").withIndex("by_ownerId", (q) => q.eq("ownerId", agent.ownerId)).first();
    if (!portfolio) throw new Error("No portfolio for agent owner");
    if (portfolio.cashSol < args.sizeSol) throw new Error("Insufficient paper cash in portfolio");

    const positionId = await ctx.db.insert("positions", {
      portfolioId: portfolio._id,
      agentId: args.agentId,
      tokenMint: args.tokenMint,
      ...(args.tokenSymbol && { tokenSymbol: args.tokenSymbol }),
      sizeSol: args.sizeSol,
      entryPrice: args.price,
      currentPrice: args.price,
      pnlSol: 0,
      pnlPct: 0,
      ...(args.stopLoss !== undefined && { stopLoss: args.stopLoss }),
      ...(args.takeProfit !== undefined && { takeProfit: args.takeProfit }),
      executionMode: "paper",
      status: "open",
      openedAt: Date.now(),
    });
    await ctx.db.patch(portfolio._id, {
      cashSol: portfolio.cashSol - args.sizeSol,
      investedSol: portfolio.investedSol + args.sizeSol,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("trades", {
      portfolioId: portfolio._id,
      agentId: args.agentId,
      direction: "buy",
      tokenMint: args.tokenMint,
      ...(args.tokenSymbol && { tokenSymbol: args.tokenSymbol }),
      amountSol: args.sizeSol,
      price: args.price,
      executionMode: "paper",
      executedBy: "agent",
      timestamp: Date.now(),
    });
    return ctx.db.get(positionId);
  },
});

export const updatePositionPrice = internalMutation({
  args: { positionId: v.id("positions"), price: v.number(), at: v.number() },
  handler: async (ctx, { positionId, price }) => {
    const position = await ctx.db.get(positionId);
    if (!position || position.status !== "open" || !Number.isFinite(price) || price <= 0) return position;
    const pnlPct = ((price - position.entryPrice) / position.entryPrice) * 100;
    const pnlSol = (pnlPct / 100) * position.sizeSol;
    await ctx.db.patch(positionId, { currentPrice: price, pnlPct, pnlSol });
    return ctx.db.get(positionId);
  },
});

export const internalClosePosition = internalMutation({
  args: {
    positionId: v.id("positions"),
    reason: v.union(v.literal("manual"), v.literal("stop"), v.literal("target"), v.literal("agent")),
  },
  handler: async (ctx, { positionId, reason }) => {
    const position = await ctx.db.get(positionId);
    if (!position || position.status !== "open") return null;
    const status = reason === "stop" ? "closed_stop" : reason === "target" ? "closed_target" : "closed";
    const proceeds = position.entryPrice > 0 ? (position.currentPrice / position.entryPrice) * position.sizeSol : position.sizeSol;
    const realizedPnlSol = proceeds - position.sizeSol;
    await ctx.db.patch(position._id, {
      status,
      closedAt: Date.now(),
      pnlSol: realizedPnlSol,
    });
    const portfolio = await ctx.db.get(position.portfolioId);
    if (portfolio) {
      await ctx.db.patch(portfolio._id, {
        cashSol: portfolio.cashSol + proceeds,
        investedSol: Math.max(0, portfolio.investedSol - position.sizeSol),
        updatedAt: Date.now(),
      });
    }
    await ctx.db.insert("trades", {
      portfolioId: position.portfolioId,
      ...(position.agentId && { agentId: position.agentId }),
      direction: "sell",
      tokenMint: position.tokenMint,
      ...(position.tokenSymbol && { tokenSymbol: position.tokenSymbol }),
      amountSol: proceeds,
      price: position.currentPrice,
      pnlSol: realizedPnlSol,
      pnlPct: position.pnlPct,
      executionMode: position.executionMode ?? "paper",
      ...(position.txSignature && { txSignature: position.txSignature }),
      ...(position.venue && { venue: position.venue }),
      executedBy: "agent",
      timestamp: Date.now(),
    });
    return ctx.db.get(position._id);
  },
});
