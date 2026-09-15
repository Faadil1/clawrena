import { getJson, postJson } from "./http";
import { isPumpCreateInstructionData, PUMP_CREATE, PUMP_CREATE_V2 } from "./pumpInstruction";

const PUMP_FUN_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export type MarketConfig = { heliusConfigured: boolean; heliusRpcUrl?: string };
export function marketConfig(): MarketConfig {
  const key = process.env.HELIUS_API_KEY;
  const rawUrl = process.env.HELIUS_RPC_URL;
  const heliusRpcUrl = key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : rawUrl || undefined;
  return { heliusConfigured: Boolean(heliusRpcUrl), heliusRpcUrl };
}
export function isMarketConfigured(): boolean { return marketConfig().heliusConfigured; }

const PUBLIC_SOLANA_RPCS = ["https://api.mainnet-beta.solana.com", "https://solana.publicnode.com"];

async function rpcCall(method: string, params: unknown[]): Promise<{ result?: any; error?: any }> {
  const cfg = marketConfig();
  const urls = [...(cfg.heliusRpcUrl ? [cfg.heliusRpcUrl] : []), ...PUBLIC_SOLANA_RPCS];
  let last: unknown;
  for (const url of urls) {
    try {
      const res = await postJson<{ result?: any; error?: any }>(url, { jsonrpc: "2.0", id: 1, method, params }, 6_000);
      if (res.error) throw new Error(`${method}: ${res.error?.message ?? JSON.stringify(res.error)}`);
      return res;
    } catch (error) { last = error; }
  }
  throw last ?? new Error(`${method} failed`);
}
export { rpcCall };

export async function fetchWalletBalance(address: string): Promise<number | null> {
  try {
    const res = await rpcCall("getBalance", [address, { commitment: "confirmed" }]);
    const lamports = Number(res.result?.value ?? NaN);
    return Number.isFinite(lamports) && lamports >= 0 ? lamports / 1e9 : null;
  } catch { return null; }
}

export async function fetchSolUsdRate(): Promise<number | null> {
  const prices = await fetchPrices([SOL_MINT]);
  const rate = prices[SOL_MINT];
  return rate !== undefined && rate > 0 ? rate : null;
}

export type MarketSnapshot = {
  priceUsd?: number;
  liquidityUsd?: number;
  decimals?: number;
  priceChange24h?: number;
  blockId?: number;
  observedAt: number;
};
export async function fetchMarketSnapshot(mints: string[]): Promise<Record<string, MarketSnapshot>> {
  const ids = [...new Set(mints)].slice(0, 50);
  if (ids.length === 0) return {};
  const headers: Record<string, string> = {};
  const key = process.env.JUPITER_API_KEY;
  if (key) headers["x-api-key"] = key;
  try {
    const observedAt = Date.now();
    const body = await getJson<Record<string, Record<string, unknown>>>(`https://api.jup.ag/price/v3?ids=${ids.join(",")}`, 8_000, headers);
    const map = (body.data ?? body) as Record<string, Record<string, unknown>>;
    const out: Record<string, MarketSnapshot> = {};
    for (const mint of ids) {
      const raw = map[mint];
      if (!raw || typeof raw !== "object") continue;
      const num = (keys: string[]) => {
        for (const candidate of keys) {
          const value = raw[candidate];
          const parsed = Number(value);
          if (value !== undefined && value !== null && Number.isFinite(parsed)) return parsed;
        }
        return undefined;
      };
      const snap: MarketSnapshot = {
        priceUsd: num(["usdPrice", "price"]),
        liquidityUsd: num(["liquidity"]),
        decimals: num(["decimals"]),
        priceChange24h: num(["priceChange24h"]),
        blockId: num(["blockId"]),
        observedAt,
      };
      if (snap.priceUsd !== undefined) out[mint] = snap;
    }
    return out;
  } catch { return {}; }
}

export async function fetchPrices(mints: string[]): Promise<Record<string, number>> {
  const snap = await fetchMarketSnapshot(mints);
  const out: Record<string, number> = {};
  for (const [mint, value] of Object.entries(snap)) if (value.priceUsd !== undefined) out[mint] = value.priceUsd;
  return out;
}

export async function fetchTokenMeta(mint: string): Promise<{ name?: string; symbol?: string; decimals?: number } | null> {
  try {
    const body = await getJson<{ name?: string; symbol?: string; decimals?: number }>(`https://tokens.jup.ag/token/${mint}`, 5_000);
    return body && (body.name || body.symbol) ? body : null;
  } catch { return null; }
}

export type HolderConcentration = {
  mint: string;
  supply: number;
  largestHolderAmount: number;
  largestHolderPct: number;
  holderCount: number;
  sampledOwnerCount: number;
  programControlledPct: number;
  observedAt: number;
  observationSlot?: number;
};

/** Aggregate sampled token accounts by economic owner and exclude Pump custody. */
export async function fetchHolderConcentration(mint: string): Promise<HolderConcentration | null> {
  try {
    const observedAt = Date.now();
    const [supplyRes, largestRes] = await Promise.all([
      rpcCall("getTokenSupply", [mint]), rpcCall("getTokenLargestAccounts", [mint]),
    ]);
    const supply = Number(supplyRes.result?.value?.uiAmount ?? NaN);
    const accounts: Array<{ address: string; uiAmount?: number | null }> = largestRes.result?.value ?? [];
    if (!accounts.length || !Number.isFinite(supply) || supply <= 0) return null;

    const addresses = accounts.map((account) => account.address);
    const parsed = await rpcCall("getMultipleAccounts", [addresses, { encoding: "jsonParsed" }]);
    const rows: any[] = parsed.result?.value ?? [];
    const byOwner = new Map<string, number>();
    for (let index = 0; index < accounts.length; index += 1) {
      const info = rows[index]?.data?.parsed?.info;
      const owner = typeof info?.owner === "string" ? info.owner : null;
      const amount = Number(info?.tokenAmount?.uiAmount ?? accounts[index].uiAmount ?? NaN);
      if (!owner || !Number.isFinite(amount) || amount < 0) continue;
      byOwner.set(owner, (byOwner.get(owner) ?? 0) + amount);
    }
    if (byOwner.size === 0) return null;

    const owners = [...byOwner.keys()];
    const ownerAccounts = await rpcCall("getMultipleAccounts", [owners, { encoding: "base64" }]);
    const ownerRows: any[] = ownerAccounts.result?.value ?? [];
    const programControlled = new Set<string>();
    for (let index = 0; index < owners.length; index += 1) {
      if (ownerRows[index]?.owner === PUMP_FUN_PROGRAM) programControlled.add(owners[index]);
    }

    let programControlledAmount = 0;
    const sampledUserOwners: Array<[string, number]> = [];
    for (const [owner, amount] of byOwner) {
      if (programControlled.has(owner)) programControlledAmount += amount;
      else sampledUserOwners.push([owner, amount]);
    }
    const largest = sampledUserOwners.reduce((max, current) => current[1] > max ? current[1] : max, 0);
    const sampledOwnerCount = sampledUserOwners.length;
    const slots = [
      supplyRes.result?.context?.slot,
      largestRes.result?.context?.slot,
      parsed.result?.context?.slot,
      ownerAccounts.result?.context?.slot,
    ].map(Number).filter(Number.isFinite);
    return {
      mint,
      supply,
      largestHolderAmount: largest,
      largestHolderPct: (largest / supply) * 100,
      holderCount: sampledOwnerCount,
      sampledOwnerCount,
      programControlledPct: (programControlledAmount / supply) * 100,
      observedAt,
      observationSlot: slots.length > 0 ? Math.max(...slots) : undefined,
    };
  } catch { return null; }
}

export async function fetchRecentLaunches(limit = 25): Promise<string[]> {
  try {
    const res = await rpcCall("getSignaturesForAddress", [PUMP_FUN_PROGRAM, { limit, commitment: "confirmed" }]);
    const signatures: Array<{ signature?: string }> = res.result ?? [];
    return signatures.map((item) => item.signature ?? "").filter(Boolean);
  } catch { return []; }
}

export type LaunchEvent = { mint: string; signature: string; ts: number };
export async function fetchLaunchMints(limit = 25): Promise<LaunchEvent[]> {
  const signatures = await fetchRecentLaunches(limit);
  const events: LaunchEvent[] = [];
  for (const signature of signatures.slice(0, 15)) {
    const result = await findMintCreatedInTx(signature);
    if (result) events.push({ mint: result.mint, signature, ts: result.blockTime ?? Date.now() });
  }
  return events;
}

/** Only official Pump create/create_v2 instructions qualify as launch provenance. */
export async function findMintCreatedInTx(signature: string): Promise<{ mint: string; blockTime?: number; slot?: number } | null> {
  try {
    const res = await rpcCall("getTransaction", [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
    const tx = res.result as null | {
      transaction?: { message?: { instructions?: Array<{ programId?: string; accounts?: string[]; data?: string }> } };
      blockTime?: number;
      slot?: number;
    };
    const instructions = tx?.transaction?.message?.instructions ?? [];
    for (const instruction of instructions) {
      if (instruction.programId !== PUMP_FUN_PROGRAM || typeof instruction.data !== "string") continue;
      if (!isPumpCreateInstructionData(instruction.data)) continue;
      const mint = instruction.accounts?.[0];
      if (typeof mint === "string" && MINT_RE.test(mint)) {
        return {
          mint,
          blockTime: tx?.blockTime ? tx.blockTime * 1000 : undefined,
          slot: Number.isFinite(Number(tx?.slot)) ? Number(tx?.slot) : undefined,
        };
      }
    }
    return null;
  } catch { return null; }
}

export { PUMP_FUN_PROGRAM, SPL_TOKEN_PROGRAM, SOL_MINT, SYSTEM_PROGRAM, PUMP_CREATE, PUMP_CREATE_V2 };
