import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { EVIDENCE_POLICY_VERSION, EVIDENCE_PASSPORT_FRESHNESS_MS, buildEvidencePassport } from "./lib/evidencePassport";
import { evaluateLaunchEvidence } from "./lib/evidenceScore";
import { fetchHolderConcentration, fetchMarketSnapshot, findMintCreatedInTx } from "./lib/market";

const http = httpRouter();
auth.addHttpRoutes(http);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;

export const healthz = httpAction(async () => json({ ok: true, service: "alpha-scout", now: Date.now() }));

/** Public, read-only machine contract for agents integrating Alpha Scout policy. */
export const authorityPolicy = httpAction(async () => json({
  service: "alpha-scout",
  role: "evidence-underwriter-and-execution-authority",
  policyVersion: EVIDENCE_POLICY_VERSION,
  receiptFreshnessMs: EVIDENCE_PASSPORT_FRESHNESS_MS,
  semantics: {
    qualified: "EVIDENCE_GATE_PASSED_BUT_VALUE_MOVEMENT_STILL_REQUIRES_LAST_MILE_PREFLIGHT",
    unknown: "VETO_WHEN_CRITICAL",
    paper: "SIMULATION_ONLY",
    prepare: "NOT_EXECUTION",
    pendingOnchain: "NOT_VERIFIED",
    verifiedOnchain: "REQUIRES_TX_SIGNATURE_AND_CONFIRMATION_SLOT",
    replayKey: "DETERMINISTIC_AUDIT_IDENTIFIER_NOT_A_CRYPTOGRAPHIC_SIGNATURE",
  },
  pipeline: ["DISCOVER", "CLAIM", "INVESTIGATE", "QUALIFY", "LAST_MILE_PREFLIGHT", "EXECUTE_OR_REFUSE", "PROVE"],
  policyStates: ["QUALIFIED", "REFUSED", "ABSTAINED", "PREPARED"],
  criticalUnknowns: ["verifiable market price", "liquidity", "largest-holder concentration", "verified Pump launch provenance"],
  receiptFields: ["policyVersion", "replayKey", "policyState", "freshnessExpiresAt", "counterfactuals"],
  fakeSuccessForbidden: true,
}));

/**
 * Cross-agent underwriting endpoint. The caller supplies a mint + purported
 * launch signature; Alpha Scout independently re-fetches the transaction,
 * verifies an official Pump create/create_v2 instruction, fetches live market
 * and owner evidence, and returns a deterministic QUALIFIED or REFUSED result.
 * It never signs, submits, or moves value.
 */
export const underwrite = httpAction(async (ctx, request) => {
  let body: { tokenMint?: unknown; launchSignature?: unknown };
  try { body = await request.json() as { tokenMint?: unknown; launchSignature?: unknown }; }
  catch { return json({ ok: false, error: "invalid json" }, 400); }

  const tokenMint = typeof body.tokenMint === "string" ? body.tokenMint.trim() : "";
  const launchSignature = typeof body.launchSignature === "string" ? body.launchSignature.trim() : "";
  if (!MINT_RE.test(tokenMint)) return json({ ok: false, error: "invalid Solana mint" }, 400);
  if (!SIG_RE.test(launchSignature)) return json({ ok: false, error: "invalid Solana transaction signature" }, 400);

  const now = Date.now();
  const provenance = await findMintCreatedInTx(launchSignature);
  if (!provenance || provenance.mint !== tokenMint || provenance.blockTime === undefined) {
    const reasons = [
      !provenance ? "launch signature does not verify as an official Pump create/create_v2 instruction" :
        provenance.mint !== tokenMint ? "verified Pump launch mint does not match requested token" :
          "verified Pump launch timestamp is unavailable",
    ];
    const unknowns = ["verified Pump launch provenance"];
    const observations = { launchSignature, launchVerified: false, verifiedMint: provenance?.mint ?? null, blockTime: provenance?.blockTime ?? null };
    const passport = buildEvidencePassport({
      tokenMint,
      decision: "reject",
      executionMode: "paper",
      observations,
      unknowns,
      reasons,
      createdAt: now,
    });
    await ctx.runMutation(internal.signals.recordTelemetry, {
      eventType: "authority.underwrite",
      payload: { tokenMint, policyState: passport.policyState, score: null, replayKey: passport.replayKey, provenanceVerified: false },
    });
    return json({
      ok: true,
      artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION",
      tokenMint,
      policyState: "REFUSED",
      valueMovement: false,
      nextBoundary: "NONE",
      observations,
      unknowns,
      reasons,
      blockers: reasons,
      passport,
    });
  }

  const [snapshots, holder] = await Promise.all([
    fetchMarketSnapshot([tokenMint]),
    fetchHolderConcentration(tokenMint),
  ]);
  const market = snapshots[tokenMint];
  const verdict = evaluateLaunchEvidence({
    processedAt: provenance.blockTime,
    now,
    priceUsd: market?.priceUsd,
    liquidityUsd: market?.liquidityUsd,
    priceChange24h: market?.priceChange24h,
    largestHolderPct: holder?.largestHolderPct ?? null,
  });
  const decision = verdict.eligible ? "execute" as const : "reject" as const;
  const observations = {
    ...verdict.observations,
    launchSignature,
    launchVerified: true,
    launchBlockTime: provenance.blockTime,
    sampledOwnerCount: holder?.sampledOwnerCount ?? null,
    programControlledPct: holder?.programControlledPct ?? null,
  };
  const passport = buildEvidencePassport({
    tokenMint,
    decision,
    executionMode: "paper",
    score: verdict.score,
    observations,
    unknowns: verdict.unknowns,
    reasons: verdict.reasons,
    createdAt: now,
  });

  await ctx.runMutation(internal.signals.recordTelemetry, {
    eventType: "authority.underwrite",
    payload: { tokenMint, policyState: passport.policyState, score: verdict.score, replayKey: passport.replayKey, provenanceVerified: true },
  });

  return json({
    ok: true,
    artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION",
    tokenMint,
    policyState: passport.policyState,
    valueMovement: false,
    nextBoundary: verdict.eligible ? "LAST_MILE_PROVIDER_AND_RISK_PREFLIGHT_REQUIRED" : "NONE",
    score: verdict.score,
    observations,
    unknowns: verdict.unknowns,
    reasons: verdict.reasons,
    blockers: verdict.blockers,
    passport,
  });
});

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
http.route({ path: "/underwrite", method: "POST", handler: underwrite });
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
