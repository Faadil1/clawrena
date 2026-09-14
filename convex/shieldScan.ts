"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { fetchHolderConcentration, fetchTokenMeta, fetchMarketSnapshot, isMarketConfigured } from "./lib/market";
import { internal } from "./_generated/api";

export type ShieldCheck = { id: string; label: string; status: "pass" | "flag" | "unknown"; detail: string };

export const scan = action({
  args: { tokenMint: v.string() },
  handler: async (ctx, { tokenMint }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const mint = tokenMint.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return { valid: false, error: "Not a valid Solana base58 mint." };
    const [meta, snap, holdings] = await Promise.all([fetchTokenMeta(mint), fetchMarketSnapshot([mint]), fetchHolderConcentration(mint)]);
    const price = snap[mint]?.priceUsd;
    const liquidityUsd = snap[mint]?.liquidityUsd;
    const checks: ShieldCheck[] = [];
    checks.push({ id: "price", label: "Price verification", status: price !== undefined ? "pass" : "unknown", detail: price !== undefined ? `Listed — price $${price.toPrecision(5)} via Jupiter.` : "No verifiable Jupiter price." });
    checks.push({
      id: "holders", label: "Largest sampled owner concentration",
      status: holdings === null ? "unknown" : holdings.largestHolderPct > 50 ? "flag" : "pass",
      detail: holdings === null
        ? "Owner aggregation unavailable — fail closed for automated entry."
        : `Largest sampled non-Pump owner: ${holdings.largestHolderPct.toFixed(1)}% (${holdings.sampledOwnerCount} sampled owners; ${holdings.programControlledPct.toFixed(1)}% program-controlled custody excluded).`,
    });
    checks.push({ id: "liquidity", label: "Liquidity", status: liquidityUsd === undefined ? "unknown" : liquidityUsd > 0 ? "pass" : "flag", detail: liquidityUsd === undefined ? "No Jupiter liquidity observation." : `~$${liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} observed liquidity.` });
    const heliusConfigured = isMarketConfigured();
    for (const item of [
      { id: "wash", label: "Wash trading", missing: "Trade-history classifier not implemented yet." },
      { id: "bundle", label: "Bundling", missing: "Bundle/launch-account classifier not implemented yet." },
      { id: "honeypot", label: "Buy/sell restrictions", missing: "Live sell-route simulation not implemented yet." },
    ]) checks.push({ id: item.id, label: item.label, status: "unknown", detail: `${item.missing}${heliusConfigured ? " Helius transport is configured, but transport alone is not a verdict." : ""}` });
    const flagCount = checks.filter((check) => check.status === "flag").length;
    await ctx.runMutation(internal.signals.recordTelemetry, { eventType: "shield.scan", payload: { mint, token: meta, price, liquidityUsd, holderConcentration: holdings, flagCount, checks } });
    return { valid: true, configured: heliusConfigured, token: meta, price, flagCount, checks };
  },
});
