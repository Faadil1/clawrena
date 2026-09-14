"use node";

const BASE_URL = "https://clawpump.tech/api/v1";

export type ClawPumpMeta = { timestamp?: string; requestId?: string };
export type ClawPumpResponse<T> = T & { meta?: ClawPumpMeta };

function apiKey(): string {
  const key = process.env.CLAWPUMP_API_KEY?.trim();
  if (!key || !key.startsWith("cpk_")) {
    throw new Error("CLAWPUMP_API_KEY is not configured");
  }
  return key;
}

export function clawPumpConfigured(): boolean {
  const key = process.env.CLAWPUMP_API_KEY?.trim();
  return Boolean(key && key.startsWith("cpk_"));
}

async function request<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<ClawPumpResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${apiKey()}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const requestId = (body.meta as ClawPumpMeta | undefined)?.requestId;
      const error = typeof body.error === "string" ? body.error : `ClawPump ${res.status}`;
      throw new Error(`${error}${requestId ? ` (request ${requestId})` : ""}`);
    }
    return body as ClawPumpResponse<T>;
  } finally {
    clearTimeout(timer);
  }
}

export async function listClawPumpAgents(): Promise<ClawPumpResponse<{ agents: Array<{ id: string; name: string; walletAddress?: string; status?: string }> }>> {
  return request("/agents", { method: "GET" }, 30_000);
}
export async function createClawPumpAgent(input: {
  name: string;
  systemPrompt: string;
}): Promise<ClawPumpResponse<{ id: string; walletAddress?: string; status?: string }>> {
  return request(
    "/agents",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        system_prompt: input.systemPrompt,
        temperature: 0.2,
        skills: ["trading", "portfolio", "market-intelligence", "sniper"],
      }),
    },
    120_000,
  );
}

export async function quoteClawPumpSwap(input: {
  agentId: string;
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}): Promise<ClawPumpResponse<Record<string, unknown>>> {
  return request(
    "/swap/quote",
    {
      method: "POST",
      body: JSON.stringify({
        input_mint: input.inputMint,
        output_mint: input.outputMint,
        amount: input.amount,
        slippage_bps: input.slippageBps ?? 50,
        agent_id: input.agentId,
      }),
    },
    30_000,
  );
}

export async function buildClawPumpSwap(input: {
  agentId: string;
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}): Promise<ClawPumpResponse<Record<string, unknown>>> {
  // This endpoint builds an unsigned transaction. Alpha Scout deliberately
  // does not count it as execution until a wallet signs it and the signature
  // is independently confirmed on Solana.
  return request(
    "/swap/execute",
    {
      method: "POST",
      body: JSON.stringify({
        input_mint: input.inputMint,
        output_mint: input.outputMint,
        amount: input.amount,
        slippage_bps: input.slippageBps ?? 50,
        agent_id: input.agentId,
        acknowledgeHighRisk: false,
        acknowledgeUnverified: false,
      }),
    },
    120_000,
  );
}
