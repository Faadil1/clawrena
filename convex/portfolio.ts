import { mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { nextEquityRisk } from "./lib/risk";

/** Read the signed-in user's paper ledger plus watch-only wallet observation. */
export const getMyContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) return null;
    const portfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    return {
      user: { id: user._id, walletAddress: user.walletAddress },
      portfolio: portfolio
        ? {
            id: portfolio._id,
            cashSol: portfolio.cashSol,
            depositedSol: portfolio.depositedSol ?? 0,
            observedWalletSol: portfolio.observedWalletSol ?? null,
            observedWalletAt: portfolio.observedWalletAt ?? null,
          }
        : null,
    };
  },
});

/**
 * Explicit PAPER funding. This does not represent an on-chain deposit and is
 * deliberately labelled as such throughout the UI and metrics.
 */
export const depositSol = mutation({
  args: { amountSol: v.number(), txSignature: v.optional(v.string()) },
  handler: async (ctx, { amountSol, txSignature }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) throw new Error("User not found; call ensureUser first");
    if (!Number.isFinite(amountSol) || amountSol <= 0 || amountSol > 100) {
      throw new Error("Paper deposit must be between 0 and 100 SOL");
    }
    let portfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (!portfolio) {
      const id = await ctx.db.insert("portfolios", {
        ownerId: user._id,
        cashSol: 0,
        investedSol: 0,
        depositedSol: 0,
        updatedAt: Date.now(),
      });
      portfolio = await ctx.db.get(id);
    }
    if (!portfolio) throw new Error("No portfolio");

    const now = Date.now();
    await ctx.db.patch(portfolio._id, {
      cashSol: portfolio.cashSol + amountSol,
      depositedSol: (portfolio.depositedSol ?? 0) + amountSol,
      updatedAt: now,
    });
    await ctx.db.insert("deposits", {
      portfolioId: portfolio._id,
      amountSol,
      source: "manual",
      ...(txSignature && { txSignature }),
      createdAt: now,
    });
    return ctx.db.get(portfolio._id);
  },
});

/**
 * Store a live wallet-balance observation without crediting the paper ledger.
 * Re-observing the same wallet can never mint new buying power.
 */
export const recordWalletObservation = internalMutation({
  args: { amountSol: v.number() },
  handler: async (ctx, { amountSol }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) throw new Error("User not found; call ensureUser first");
    let portfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (!portfolio) {
      const id = await ctx.db.insert("portfolios", {
        ownerId: user._id,
        cashSol: 0,
        investedSol: 0,
        depositedSol: 0,
        updatedAt: Date.now(),
      });
      portfolio = await ctx.db.get(id);
    }
    if (!portfolio) throw new Error("No portfolio");
    const now = Date.now();
    await ctx.db.patch(portfolio._id, {
      observedWalletSol: amountSol,
      observedWalletAt: now,
      updatedAt: now,
    });
    return { paperCashSol: portfolio.cashSol, observedWalletSol: amountSol, observedAt: now };
  },
});

/** Paper-only manual position placement after server-side Jupiter pricing. */
export const internalPlaceUserPosition = internalMutation({
  args: {
    tokenMint: v.string(),
    tokenSymbol: v.optional(v.string()),
    sizeSol: v.number(),
    price: v.number(),
    stopLoss: v.optional(v.number()),
    takeProfit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier!))
      .first();
    if (!user) throw new Error("User not found; call ensureUser first");
    const portfolio = await ctx.db
      .query("portfolios")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .first();
    if (!portfolio) throw new Error("No portfolio");
    if (!Number.isFinite(args.sizeSol) || args.sizeSol <= 0) throw new Error("Position size must be positive");
    if (!Number.isFinite(args.price) || args.price <= 0) throw new Error("Position price must be positive");
    if (
      (args.stopLoss !== undefined && (!Number.isFinite(args.stopLoss) || args.stopLoss <= 0)) ||
      (args.takeProfit !== undefined && (!Number.isFinite(args.takeProfit) || args.takeProfit <= 0))
    ) {
      throw new Error("Exit prices must be positive");
    }
    if (portfolio.cashSol < args.sizeSol) throw new Error("Insufficient paper cash in portfolio");

    const positionId = await ctx.db.insert("positions", {
      portfolioId: portfolio._id,
      ...(portfolio.agentId && { agentId: portfolio.agentId }),
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
      ...(portfolio.agentId && { agentId: portfolio.agentId }),
      direction: "buy",
      tokenMint: args.tokenMint,
      ...(args.tokenSymbol && { tokenSymbol: args.tokenSymbol }),
      amountSol: args.sizeSol,
      price: args.price,
      executionMode: "paper",
      executedBy: "user",
      timestamp: Date.now(),
    });
    return ctx.db.get(positionId);
  },
});

/** Persist the real paper-equity high-water mark used by the drawdown guard. */
export const updateEquityHighWater = internalMutation({
  args: { portfolioId: v.id("portfolios"), equitySol: v.number() },
  handler: async (ctx, { portfolioId, equitySol }) => {
    if (!Number.isFinite(equitySol) || equitySol < 0) throw new Error("Invalid portfolio equity");
    const portfolio = await ctx.db.get(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");
    const risk = nextEquityRisk(portfolio.equityHighWaterSol, equitySol);
    if (portfolio.equityHighWaterSol !== risk.peakSol) {
      await ctx.db.patch(portfolioId, { equityHighWaterSol: risk.peakSol, updatedAt: Date.now() });
    }
    return risk;
  },
});
