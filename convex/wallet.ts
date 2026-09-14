import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { fetchWalletBalance } from "./lib/market";
import type { Id } from "./_generated/dataModel";

type MyContext = {
  user: { id: Id<"users">; walletAddress?: string };
  portfolio: { id: Id<"portfolios">; cashSol: number; depositedSol: number } | null;
} | null;

/**
 * Watch-only balance observation. The address is not proven owned and its live
 * balance is never converted into executable/paper cash. This closes the old
 * repeated-import inflation path by separating observation from funding.
 */
export const importWalletBalance = action({
  args: {},
  handler: async (ctx): Promise<{
    walletAddress: string;
    balanceSol: number;
    currentCashSol: number;
    importedSol: 0;
    observedWalletSol: number;
  }> => {
    const context: MyContext = await ctx.runQuery(internal.portfolio.getMyContext, {});
    if (!context) throw new Error("User not found; call ensureUser first");
    if (!context.user.walletAddress) throw new Error("Attach a Solana address before observing its balance");

    const balance = await fetchWalletBalance(context.user.walletAddress);
    if (balance === null) throw new Error("Could not read wallet balance — RPC unreachable.");

    const observed = await ctx.runMutation(internal.portfolio.recordWalletObservation, {
      amountSol: balance,
    });
    return {
      walletAddress: context.user.walletAddress,
      balanceSol: balance,
      currentCashSol: observed.paperCashSol,
      importedSol: 0,
      observedWalletSol: observed.observedWalletSol,
    };
  },
});
