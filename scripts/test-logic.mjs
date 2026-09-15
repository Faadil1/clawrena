import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const cache = new Map();
function loadTs(modulePath) {
  const normalized = path.posix.normalize(modulePath);
  if (cache.has(normalized)) return cache.get(normalized);
  const source = fs.readFileSync(new URL(`../${normalized}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  cache.set(normalized, module.exports);
  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) throw new Error(`Unsupported test-time require: ${specifier}`);
    let resolved = path.posix.normalize(path.posix.join(path.posix.dirname(normalized), specifier));
    if (!resolved.endsWith(".ts")) resolved += ".ts";
    return loadTs(resolved);
  };
  new Function("exports", "module", "require", output)(module.exports, module, localRequire);
  cache.set(normalized, module.exports);
  return module.exports;
}
const assert = (value, message) => { if (!value) throw new Error(message); };
const { evaluateLaunchEvidence } = loadTs("convex/lib/evidenceScore.ts");
const { canAcquireClaim, CLAIM_LEASE_MS } = loadTs("convex/lib/claimLease.ts");
const { nextEquityRisk } = loadTs("convex/lib/risk.ts");
const { isPumpCreateInstructionData, findPumpCreateMintInInstructions, PUMP_CREATE, PUMP_CREATE_V2 } = loadTs("convex/lib/pumpInstruction.ts");
const { evaluateExecutionAuthority, MAX_EXECUTION_RECEIPT_AGE_MS } = loadTs("convex/lib/executionAuthority.ts");
const { normalizeClawPumpFeeEarnings, CLAWPUMP_CREATOR_FEE_SHARE_PCT } = loadTs("convex/lib/tokenEconomics.ts");
const { buildEvidencePassport, evidenceReplayKey, recomputeEvidenceReplayKey, EVIDENCE_POLICY_VERSION, EVIDENCE_PASSPORT_FRESHNESS_MS } = loadTs("convex/lib/evidencePassport.ts");
const { EVIDENCE_POLICY, evidencePolicyDescriptor } = loadTs("convex/lib/evidencePolicy.ts");
const { compareUnderwritingDecisions } = loadTs("convex/lib/underwriting.ts");
const now = Date.now();

assert(EVIDENCE_POLICY.minEvidenceScore === 55, "canonical policy score threshold must stay explicit");
assert(evidencePolicyDescriptor().version === EVIDENCE_POLICY_VERSION, "published policy descriptor must match receipt policy version");
assert(evidencePolicyDescriptor().thresholds.passportFreshnessMs === EVIDENCE_PASSPORT_FRESHNESS_MS, "published freshness must match passport freshness");
assert(evaluateLaunchEvidence({ processedAt: now - 60_000, now, priceUsd: 0.01, liquidityUsd: 50_000, priceChange24h: 20, largestHolderPct: 12 }).eligible, "qualified launch should pass");
assert(!evaluateLaunchEvidence({ processedAt: now, now, priceUsd: 0.01, liquidityUsd: 50_000, largestHolderPct: null }).eligible, "unknown holder concentration must fail closed");
assert(!evaluateLaunchEvidence({ processedAt: now, now, priceUsd: 0.01, liquidityUsd: 500, largestHolderPct: 10 }).eligible, "sub-floor liquidity must fail");
assert(!evaluateLaunchEvidence({ processedAt: now, now, priceUsd: 0.01, liquidityUsd: 50_000, largestHolderPct: 70 }).eligible, "whale concentration must fail");
assert(canAcquireClaim(null, "run-a", now), "empty lease should be claimable");
assert(canAcquireClaim({ status: "claimed", claimToken: "run-a", claimedAt: now }, "run-a", now), "same run should be idempotent");
assert(!canAcquireClaim({ status: "claimed", claimToken: "run-a", claimedAt: now }, "run-b", now), "concurrent run must not steal active lease");
assert(canAcquireClaim({ status: "claimed", claimToken: "run-a", claimedAt: now - CLAIM_LEASE_MS - 1 }, "run-b", now), "expired lease should recover");
assert(!canAcquireClaim({ status: "acted", claimToken: "run-a", claimedAt: now }, "run-b", now), "acted execution must be terminal");

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeBase58(bytes) {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) + BigInt(byte);
  let out = "";
  while (value > 0n) { out = alphabet[Number(value % 58n)] + out; value /= 58n; }
  let leading = 0;
  while (leading < bytes.length && bytes[leading] === 0) { out = "1" + out; leading += 1; }
  return out || "1";
}
const pumpProgram = "PumpProgram111111111111111111111111111111";
const mintExample = "Mint111111111111111111111111111111111111";
assert(isPumpCreateInstructionData(encodeBase58([...PUMP_CREATE, 1, 2, 3])), "legacy Pump create discriminator must verify");
assert(isPumpCreateInstructionData(encodeBase58([...PUMP_CREATE_V2, 9, 8, 7])), "Pump create_v2 discriminator must verify");
assert(!isPumpCreateInstructionData(encodeBase58([1, 2, 3, 4, 5, 6, 7, 8, 9])), "unrelated Pump instruction must not verify as a launch");
assert(findPumpCreateMintInInstructions([
  { programId: "OtherProgram", accounts: ["OtherMint"], data: encodeBase58([...PUMP_CREATE, 1]) },
  { programId: pumpProgram, accounts: [mintExample], data: encodeBase58([...PUMP_CREATE_V2, 1]) },
], pumpProgram) === mintExample, "flattened top-level/CPI instruction verification must return the Pump create mint");
assert(findPumpCreateMintInInstructions([
  { programId: pumpProgram, accounts: [mintExample], data: encodeBase58([1, 2, 3, 4, 5, 6, 7, 8]) },
], pumpProgram) === null, "Pump program activity without an official create discriminator must not become launch provenance");
const risk = nextEquityRisk(10, 8);
assert(risk.peakSol === 10 && Math.abs(risk.drawdownPct - 20) < 1e-9, "drawdown must be measured from equity high-water mark");
const newPeak = nextEquityRisk(10, 12);
assert(newPeak.peakSol === 12 && newPeak.drawdownPct === 0, "new equity peak must reset drawdown to zero");

const authorityBase = {
  now,
  receiptCreatedAt: now - 15_000,
  decision: "execute",
  score: 80,
  riskBudgetSol: 0.1,
  unknowns: ["24h price change"],
  providerConfigured: true,
  providerLinked: true,
  providerHealthy: true,
};
assert(evaluateExecutionAuthority(authorityBase).authorized, "fresh passing receipt + healthy provider should authorize preparation");
assert(!evaluateExecutionAuthority({ ...authorityBase, receiptCreatedAt: now - MAX_EXECUTION_RECEIPT_AGE_MS - 1 }).authorized, "stale execution evidence must fail closed");
assert(!evaluateExecutionAuthority({ ...authorityBase, providerHealthy: false }).authorized, "unhealthy provider must fail closed");
assert(!evaluateExecutionAuthority({ ...authorityBase, unknowns: ["liquidity"] }).authorized, "critical unknown must fail closed at execution boundary");

assert(CLAWPUMP_CREATOR_FEE_SHARE_PCT === 75, "canonical ClawPump creator fee share must remain explicit");
const earnings = normalizeClawPumpFeeEarnings({ agentId: "agent-1", totalEarned: 1.25, totalSent: 1, totalPending: 0.2, totalHeld: 0.05, recentDistributions: [{ signature: "example" }] }, "agent-1");
assert(earnings.totalEarned === 1.25 && earnings.recentDistributions.length === 1, "valid creator-fee ledger must normalize without changing observed values");
let badEarningsRejected = false;
try { normalizeClawPumpFeeEarnings({ agentId: "agent-1", totalEarned: -1, totalSent: 0, totalPending: 0, totalHeld: 0 }, "agent-1"); }
catch { badEarningsRejected = true; }
assert(badEarningsRejected, "invalid economic values must fail closed rather than become fake zeroes");

const passportBase = {
  tokenMint: "mint-1",
  decision: "reject",
  executionMode: "paper",
  score: 41,
  observations: { liquidityUsd: 12000, priceUsd: 0.01 },
  unknowns: ["largest-holder concentration"],
  reasons: ["critical holder evidence unavailable"],
  riskBudgetSol: 0.1,
  requestId: "req-1",
  createdAt: now,
};
const passportA = buildEvidencePassport(passportBase);
const passportB = buildEvidencePassport({ ...passportBase, observations: { priceUsd: 0.01, liquidityUsd: 12000 } });
assert(passportA.policyVersion === EVIDENCE_POLICY_VERSION, "evidence receipts must record a policy version");
assert(passportA.replayKey === passportB.replayKey, "replay key must be stable across object key order");
assert(recomputeEvidenceReplayKey(passportBase, EVIDENCE_POLICY_VERSION) === passportA.replayKey, "stored policy version must reproduce the original replay key");
assert(recomputeEvidenceReplayKey(passportBase, "AS-AUTHORITY-V0") !== passportA.replayKey, "policy version is part of replay identity and must not be silently upgraded");
assert(passportA.policyState === "REFUSED", "reject decisions must remain REFUSED in the passport");
assert(passportA.counterfactuals.some((x) => x.includes("largest-holder concentration")), "refusal must explain what evidence must change before reconsideration");
assert(passportA.freshnessExpiresAt === now + EVIDENCE_PASSPORT_FRESHNESS_MS, "passport freshness must be explicit");
assert(EVIDENCE_PASSPORT_FRESHNESS_MS === MAX_EXECUTION_RECEIPT_AGE_MS, "passport and last-mile authority freshness must not drift");
assert(evidenceReplayKey({ b: 2, a: 1 }) === evidenceReplayKey({ a: 1, b: 2 }), "canonical replay identifiers must be deterministic");
const qualifiedPassport = buildEvidencePassport({ ...passportBase, decision: "execute", unknowns: [], reasons: ["evidence gate passed"] });
assert(qualifiedPassport.policyState === "QUALIFIED", "passing evidence must be QUALIFIED, never overclaim execution authorization");

const lineage = compareUnderwritingDecisions(
  { policyVersion: EVIDENCE_POLICY_VERSION, policyState: "REFUSED", score: 40, unknowns: ["liquidity"], blockers: ["liquidity unknown"], replayKey: "AS1-0000000000000001" },
  { artifactClass: "LIVE_EVIDENCE_UNDERWRITING_DECISION", tokenMint: "mint-1", launchSignature: "sig", createdAt: now, policyState: "QUALIFIED", valueMovement: false, nextBoundary: "LAST_MILE_PROVIDER_AND_RISK_PREFLIGHT_REQUIRED", score: 70, observations: {}, unknowns: [], reasons: [], blockers: [], sourceLedger: [], passport: qualifiedPassport },
);
assert(lineage.stateChanged && lineage.scoreDelta === 30, "re-underwriting lineage must expose state and score drift");
assert(lineage.unknownsResolved.includes("liquidity") && lineage.blockersResolved.includes("liquidity unknown"), "lineage must expose resolved unknowns and blockers");

console.log("Evidence policy, claim lease, Pump parser, high-water risk, execution authority, token economics, passports + underwriting lineage: PASS");
