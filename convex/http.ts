import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { evidencePolicyDescriptor } from "./lib/evidencePolicy";
import { compareUnderwritingDecisions, underwritePumpLaunch } from "./lib/underwriting";

const http = httpRouter();
auth.addHttpRoutes(http);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;
const REPLAY_RE = /^AS1-[0-9a-f]{16}$/;

function authorityAccess(request: Request): Response | null {
  const required = process.env.AUTHORITY_API_KEY?.trim();
  if (!required) return null;
  return request.headers.get("x-alpha-scout-key") === required
    ? null
    : json({ ok: false, error: "authority API key required" }, 401);
}

export const healthz = httpAction(async () => json({ ok: true, service: "alpha-scout", now: Date.now() }));

export const authorityPolicy = httpAction(async () => json({
  service: "alpha-scout",
  role: "evidence-underwriter-and-execution-authority",
  policy: evidencePolicyDescriptor(),
  semantics: {
    qualified: "EVIDENCE_GATE_PASSED_BUT_VALUE_MOVEMENT_STILL_REQUIRES_LAST_MILE_PREFLIGHT",
    unknown: "VETO_WHEN_CRITICAL",
    paper: "SIMULATION_ONLY",
    prepare: "NOT_EXECUTION",
    pendingOnchain: "NOT_VERIFIED",
    verifiedOnchain: "REQUIRES_TX_SIGNATURE_AND_CONFIRMATION_SLOT",
    replayKey: "DETERMINISTIC_AUDIT_IDENTIFIER_NOT_A_CRYPTOGRAPHIC_SIGNATURE",
  },
  pipeline: ["DISCOVER", "VERIFY_PROVENANCE", "INVESTIGATE", "QUALIFY", "LAST_MILE_PREFLIGHT", "EXECUTE_OR_REFUSE", "PROVE"],
  policyStates: ["QUALIFIED", "REFUSED", "ABSTAINED", "PREPARED"],
  sourceLedger: ["solana-pump-transaction", "jupiter-price-v3", "solana-owner-concentration"],
  fakeSuccessForbidden: true,
}));

export const authorityOpenApi = httpAction(async (_ctx, request) => {
  const origin = new URL(request.url).origin;
  return json({
    openapi: "3.1.0",
    info: { title: "Alpha Scout Evidence Authority", version: evidencePolicyDescriptor().version },
    servers: [{ url: origin }],
    paths: {
      "/authority-policy": { get: { summary: "Read the current versioned evidence policy" } },
      "/underwrite": {
        post: {
          summary: "Independently underwrite a Pump launch without moving value",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["tokenMint", "launchSignature"], properties: { tokenMint: { type: "string" }, launchSignature: { type: "string" } } } } } },
        },
      },
      "/reunderwrite": {
        post: {
          summary: "Re-run a stored underwriting decision against current evidence/policy and return lineage diff",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["previousReplayKey"], properties: { previousReplayKey: { type: "string", pattern: "^AS1-[0-9a-f]{16}$" } } } } } },
        },
      },
    },
  });
});

export const underwrite = httpAction(async (ctx, request) => {
  const denied = authorityAccess(request);
  if (denied) return denied;
  let body: { tokenMint?: unknown; launchSignature?: unknown };
  try { body = await request.json() as { tokenMint?: unknown; launchSignature?: unknown }; }
  catch { return json({ ok: false, error: "invalid json" }, 400); }

  const tokenMint = typeof body.tokenMint === "string" ? body.tokenMint.trim() : "";
  const launchSignature = typeof body.launchSignature === "string" ? body.launchSignature.trim() : "";
  if (!MINT_RE.test(tokenMint)) return json({ ok: false, error: "invalid Solana mint" }, 400);
  if (!SIG_RE.test(launchSignature)) return json({ ok: false, error: "invalid Solana transaction signature" }, 400);

  const result = await underwritePumpLaunch({ tokenMint, launchSignature });
  const ledgerId = await ctx.runMutation(internal.underwriting.recordDecision, {
    tokenMint: result.tokenMint,
    launchSignature: result.launchSignature,
    policyVersion: result.passport.policyVersion,
    replayKey: result.passport.replayKey,
    policyState: result.policyState,
    score: result.score,
    observations: result.observations,
    unknowns: result.unknowns,
    reasons: result.reasons,
    blockers: result.blockers,
    sourceLedger: result.sourceLedger,
    freshnessExpiresAt: result.passport.freshnessExpiresAt,
    createdAt: result.createdAt,
  });
  return json({ ok: true, ledgerId, ...result });
});

/**
 * Decision-lineage endpoint: re-underwrite the exact mint/signature associated
 * with a server-stored replay key. The caller cannot swap in different evidence
 * while claiming continuity with an older decision.
 */
export const reunderwrite = httpAction(async (ctx, request) => {
  const denied = authorityAccess(request);
  if (denied) return denied;
  let body: { previousReplayKey?: unknown };
  try { body = await request.json() as { previousReplayKey?: unknown }; }
  catch { return json({ ok: false, error: "invalid json" }, 400); }
  const previousReplayKey = typeof body.previousReplayKey === "string" ? body.previousReplayKey.trim() : "";
  if (!REPLAY_RE.test(previousReplayKey)) return json({ ok: false, error: "invalid replay key" }, 400);

  const previous = await ctx.runQuery(internal.underwriting.getByReplayKey, { replayKey: previousReplayKey });
  if (!previous) return json({ ok: false, error: "previous underwriting decision not found" }, 404);

  const result = await underwritePumpLaunch({ tokenMint: previous.tokenMint, launchSignature: previous.launchSignature });
  const ledgerId = await ctx.runMutation(internal.underwriting.recordDecision, {
    tokenMint: result.tokenMint,
    launchSignature: result.launchSignature,
    policyVersion: result.passport.policyVersion,
    replayKey: result.passport.replayKey,
    policyState: result.policyState,
    score: result.score,
    observations: result.observations,
    unknowns: result.unknowns,
    reasons: result.reasons,
    blockers: result.blockers,
    sourceLedger: result.sourceLedger,
    freshnessExpiresAt: result.passport.freshnessExpiresAt,
    supersedesReplayKey: previous.replayKey,
    createdAt: result.createdAt,
  });

  return json({
    ok: true,
    ledgerId,
    lineage: compareUnderwritingDecisions(previous, result),
    current: result,
  });
});

/** Helius is transport; scanner verification remains launch authority. */
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
http.route({ path: "/authority-openapi", method: "GET", handler: authorityOpenApi });
http.route({ path: "/underwrite", method: "POST", handler: underwrite });
http.route({ path: "/reunderwrite", method: "POST", handler: reunderwrite });
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
