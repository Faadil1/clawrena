import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { EVIDENCE_POLICY_VERSION, EVIDENCE_PASSPORT_FRESHNESS_MS } from "./lib/evidencePassport";

const http = httpRouter();
auth.addHttpRoutes(http);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const healthz = httpAction(async () => json({ ok: true, service: "alpha-scout", now: Date.now() }));

/** Public, read-only machine contract for agents integrating Alpha Scout authority receipts. */
export const authorityPolicy = httpAction(async () => json({
  service: "alpha-scout",
  role: "evidence-underwriter-and-execution-authority",
  policyVersion: EVIDENCE_POLICY_VERSION,
  receiptFreshnessMs: EVIDENCE_PASSPORT_FRESHNESS_MS,
  semantics: {
    unknown: "VETO_WHEN_CRITICAL",
    paper: "SIMULATION_ONLY",
    prepare: "NOT_EXECUTION",
    pendingOnchain: "NOT_VERIFIED",
    verifiedOnchain: "REQUIRES_TX_SIGNATURE_AND_CONFIRMATION_SLOT",
    replayKey: "DETERMINISTIC_AUDIT_IDENTIFIER_NOT_A_CRYPTOGRAPHIC_SIGNATURE",
  },
  pipeline: ["DISCOVER", "CLAIM", "INVESTIGATE", "QUALIFY", "EXECUTE_OR_REFUSE", "PROVE"],
  authorityStates: ["AUTHORIZED", "REFUSED", "ABSTAINED", "PREPARED"],
  criticalUnknowns: ["verifiable market price", "liquidity", "largest-holder concentration"],
  receiptFields: ["policyVersion", "replayKey", "authorityState", "freshnessExpiresAt", "counterfactuals"],
  fakeSuccessForbidden: true,
}));

/**
 * Helius is a low-latency transport, not launch authority. We accept only
 * authenticated transaction signatures here; scanner.verifyLaunchSignatures
 * re-fetches each transaction and requires an official Pump create/create_v2
 * discriminator before a new-launch signal is written.
 */
export const heliusWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.HELIUS_WEBHOOK_SECRET;
  if (!secret) return json({ ok: false, error: "webhook secret is not configured" }, 503);
  if (request.headers.get("x-webhook-secret") !== secret) return json({ ok: false, error: "unauthorized" }, 401);
  let payload: unknown;
  try { payload = await request.json(); } catch { return json({ ok: false, error: "invalid json" }, 400); }
  const signatures = extractSignatures(payload);
  if (signatures.length === 0) return json({ ok: true, candidates: 0, verified: 0, ingested: 0 });
  try {
    const result = await ctx.runAction(internal.scanner.verifyLaunchSignatures, { signatures });
    return json({ ok: true, candidates: result.candidates, verified: result.verified, ingested: result.inserted });
  } catch (error) { return json({ ok: false, error: String(error) }, 500); }
});

http.route({ path: "/healthz", method: "GET", handler: healthz });
http.route({ path: "/authority-policy", method: "GET", handler: authorityPolicy });
http.route({ path: "/webhooks/helius", method: "POST", handler: heliusWebhook });

function extractSignatures(payload: unknown): string[] {
  const txs = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { transactions?: unknown })?.transactions)
      ? (payload as { transactions: unknown[] }).transactions
      : [];
  const signatures = new Set<string>();
  for (const raw of txs) {
    if (!raw || typeof raw !== "object") continue;
    const tx = raw as { signature?: string; transaction?: { signature?: string; signatures?: string[] } };
    const signature = tx.signature ?? tx.transaction?.signature ?? tx.transaction?.signatures?.[0];
    if (typeof signature === "string" && signature.length >= 64) signatures.add(signature);
  }
  return [...signatures].slice(0, 20);
}

export default http;
