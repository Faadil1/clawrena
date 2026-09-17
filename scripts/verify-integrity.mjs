import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const portfolio = read("convex/portfolio.ts");
const wallet = read("convex/wallet.ts");
const publicStats = read("convex/queries/public.ts");
const runner = read("convex/runAgent.ts");
const landing = read("src/pages/Landing.tsx");
const clawPumpLib = read("convex/lib/clawpump.ts");
const clawPumpAction = read("convex/clawPump.ts");
const schema = read("convex/schema.ts");
const signals = read("convex/signals.ts");
const market = read("convex/lib/market.ts");
const pumpInstruction = read("convex/lib/pumpInstruction.ts");
const risk = read("convex/lib/risk.ts");
const shield = read("convex/shieldScan.ts");
const executionAuthority = read("convex/lib/executionAuthority.ts");
const passport = read("convex/lib/evidencePassport.ts");
const policy = read("convex/lib/evidencePolicy.ts");
const evidenceScore = read("convex/lib/evidenceScore.ts");
const evidence = read("convex/evidence.ts");
const proof = read("src/pages/Proof.tsx");
const http = read("convex/http.ts");
const underwritingLib = read("convex/lib/underwriting.ts");
const underwritingDb = read("convex/underwriting.ts");
const skill = read("skills/evidence-authority/SKILL.md");
const tokenEconomics = read("convex/lib/tokenEconomics.ts");
const agentConsole = read("src/pages/AgentConsole.tsx");

assert(portfolio.includes("recordWalletObservation"), "wallet observations must have a dedicated path");
assert(wallet.includes("importedSol: 0"), "wallet observation must never mint paper cash");
assert(publicStats.includes('executionMode === "onchain"') && publicStats.includes("txSignature") && publicStats.includes("confirmationSlot"), "verified volume must require on-chain mode + signature + independent confirmation slot");
assert(publicStats.includes("pendingOnchainVolumeSol"), "submitted/unconfirmed on-chain activity must stay separate from paper and verified volume");
assert(runner.includes("claimSignal") && runner.includes("releaseSignalClaim"), "signal execution must use an atomic claim lease");
assert(runner.includes("evaluateLaunchEvidence"), "entry loop must pass through evidence scoring");
assert(clawPumpLib.includes("acknowledgeHighRisk: false") && clawPumpLib.includes("acknowledgeUnverified: false"), "ClawPump safety gates must not be bypassed");
assert(clawPumpAction.includes("decisionReceiptId") && clawPumpAction.includes("getDecisionReceiptForAgent"), "ClawPump build authority must come from a stored passing receipt");
assert(!landing.includes("Executes across spot, perps, and prediction markets"), "landing must not claim unbuilt execution surfaces");
assert(!landing.includes("every trade lands on Solana"), "landing must not present paper trades as on-chain");

assert(schema.includes("signal_executions") && schema.includes("by_agentId_signalId"), "idempotency must be scoped to agent + signal");
assert(signals.includes("claimToken") && signals.includes("canAcquireClaim"), "claim lease must distinguish concurrent runs of the same agent");
assert(portfolio.includes("updateEquityHighWater") && portfolio.includes("nextEquityRisk"), "drawdown must use a persisted equity high-water mark");
assert(risk.includes("drawdownPct") && risk.includes("Math.max"), "high-water risk math must remain explicit and testable");
assert(market.includes("isPumpCreateInstructionData") && pumpInstruction.includes("PUMP_CREATE_V2") && !market.includes("postTokenBalances"), "launch discovery must verify Pump create discriminators");
assert(market.includes("getMultipleAccounts") && market.includes("programControlledPct"), "holder concentration must aggregate sampled accounts by owner");
assert(!shield.includes("Deep scan queued"), "unimplemented shield classifiers must remain UNKNOWN");
assert(executionAuthority.includes("MAX_EXECUTION_RECEIPT_AGE_MS"), "last-mile authority must expire stale evidence");
assert(clawPumpAction.includes("providerPreflightHealthy") && clawPumpAction.includes("Execution authority denied"), "ClawPump last mile must use a live provider preflight and fail closed");
assert(clawPumpAction.includes('decision: "reject"') && clawPumpAction.includes('executionMode: "onchain"'), "last-mile authority failures must remain in the evidence record");

assert(policy.includes('EVIDENCE_POLICY_VERSION = "AS-AUTHORITY-V1"') && policy.includes("minLiquidityUsd") && policy.includes("minEvidenceScore") && policy.includes("scoreWeights"), "authority policy must centralize executable thresholds and scoring weights");
assert(evidenceScore.includes('from "./evidencePolicy"') && evidenceScore.includes("EVIDENCE_POLICY.minEvidenceScore"), "Evidence Gate must execute the canonical policy manifest");
assert(executionAuthority.includes('from "./evidencePolicy"') && executionAuthority.includes("EVIDENCE_POLICY.passportFreshnessMs"), "last-mile authority must share canonical policy freshness");
assert(passport.includes('from "./evidencePolicy"') && passport.includes("replayKey") && passport.includes("counterfactuals"), "Evidence Passport must remain replayable and counterfactual-aware");
assert(passport.includes('return "QUALIFIED"') && !passport.includes('return "AUTHORIZED"'), "qualification must never overclaim execution authorization");
assert(evidence.includes("buildEvidencePassport"), "every local decision receipt must receive an Evidence Passport");
assert(schema.includes("underwriting_decisions") && schema.includes("by_replayKey") && schema.includes("supersedesReplayKey"), "cross-agent underwriting must have durable replay lineage");
assert(schema.includes("DECLARED_EXTERNAL_CONTEXT") && schema.includes("caller:"), "receipts must support bounded declared caller context");
assert(underwritingDb.includes("recordDecision") && underwritingDb.includes("getByReplayKey") && underwritingDb.includes("by_replayKey"), "durable underwriting writes and replay lookup must be server-side");
assert(underwritingDb.includes("callerIdentityVerifiedByAlphaScout: false"), "stored caller context must not be mislabeled as verified identity");
assert(underwritingLib.includes("findMintCreatedInTx") && underwritingLib.includes("sourceLedger") && underwritingLib.includes("jupiter-price-v3") && underwritingLib.includes("solana-owner-concentration"), "underwriting must independently verify provenance and preserve source lineage");
assert(underwritingLib.includes("compareUnderwritingDecisions") && underwritingLib.includes("unknownsResolved") && underwritingLib.includes("blockersResolved"), "re-underwriting must expose evidence drift");
assert(market.includes("blockId") && market.includes("observationSlot") && market.includes("observedAt"), "evidence sources must preserve available observation clocks");
assert(schema.includes("policyVersion") && schema.includes("policyState") && schema.includes("freshnessExpiresAt") && schema.includes("counterfactuals"), "receipt schema must persist Evidence Passport fields");
assert(proof.includes("TO RECONSIDER") && proof.includes("REPLAY") && proof.includes("qualified ≠ authorized"), "Proof Room must expose replay, counterfactuals and qualification boundary");

assert(http.includes('path: "/authority-policy"') && http.includes('path: "/authority-openapi"') && http.includes('path: "/authority-stats"'), "authority policy, schema and activity stats must be machine-readable");
assert(http.includes('path: "/underwrite"') && http.includes('path: "/reunderwrite"'), "authority runtime must expose underwriting and re-underwriting");
assert(http.includes("internal.underwriting.recordDecision") && http.includes("internal.underwriting.getByReplayKey"), "HTTP authority must persist decisions and resolve replay keys server-side");
assert(http.includes("previousReplayKey") && !http.includes("previousTokenMint"), "re-underwrite continuity must not accept replacement token identity");
assert(http.includes("AUTHORITY_API_KEY") && http.includes("x-alpha-scout-key"), "authority mutation endpoints must support server-side access control");
assert(http.includes("DECLARED_EXTERNAL_CONTEXT") && http.includes("callerIdentityVerifiedByAlphaScout: false"), "HTTP authority must preserve caller attribution truth boundary");
assert(http.includes("valueMovement") || underwritingLib.includes("valueMovement: false"), "underwriting must never masquerade as execution");
assert(publicStats.includes('query("underwriting_decisions")') && publicStats.includes("underwritingLineageReruns"), "public authority metrics must derive from durable underwriting history");
assert(publicStats.includes("externallyAttributedUnderwritingRequests") && publicStats.includes("Request counts only") && publicStats.includes("not unique-agent counts") && publicStats.includes("not trading volume"), "authority activity must preserve non-user/non-volume semantics");
assert(skill.includes("Shadow mode") && skill.includes("/reunderwrite") && skill.includes("source ledger") && skill.includes("QUALIFIED is not AUTHORIZED"), "integration skill must preserve shadow adoption, lineage and replay semantics");
assert(skill.includes("DECLARED_EXTERNAL_CONTEXT") && skill.includes("not cryptographic identity proof"), "integration skill must preserve caller attribution boundary");

assert(tokenEconomics.includes("CLAWPUMP_CREATOR_FEE_SHARE_PCT = 75"), "creator-fee share must remain explicit");
assert(clawPumpLib.includes("/fees/earnings?agentId=") && clawPumpLib.includes("normalizeClawPumpFeeEarnings"), "token economics must come from ClawPump's public fee ledger");
assert(clawPumpAction.includes("treasuryStatus") && clawPumpAction.includes("holderRevenueShare: false") && clawPumpAction.includes("automatedTreasurySpending: false"), "treasury observation must preserve token-utility boundaries");
assert(agentConsole.includes("Agent Treasury") && agentConsole.includes("does <b>not</b> claim holder revenue share"), "treasury UI must state the non-holder-revenue boundary");

assert(read("docs/REAL_FAILURE_EVIDENCE.md").includes("Real failure > fake success"), "real-failure rule must remain public");
assert(read("docs/TOKEN_UTILITY.md").includes("NOT BUILT / prohibited wording"), "token utility doc must preserve prohibited financial claims");
assert(read("docs/AUTHORITY_PROOF.md").includes("REPLAY MATCH") || read("docs/AUTHORITY_PROOF.md").includes("Replay meaning"), "authority proof must preserve replay limitations");
assert(read("docs/ARCHITECTURE.md").includes("QUALIFIED"), "architecture must preserve qualification boundary");

const canonicalStatus = JSON.parse(read("evidence/canonical-run/STATUS.json"));
assert(["PENDING_REAL_RUNTIME_CAPTURE", "REAL_NEGATIVE_PATH_CAPTURED"].includes(canonicalStatus.status), "canonical runtime status must be explicit");
if (canonicalStatus.status === "REAL_NEGATIVE_PATH_CAPTURED") {
  assert(canonicalStatus.captured?.realPumpLaunchMint, "captured runtime must preserve the real Pump mint");
  assert(canonicalStatus.captured?.realPumpLaunchSignature, "captured runtime must preserve the real Pump launch signature");
  assert(canonicalStatus.captured?.realNegativePathLedgerId, "captured runtime must preserve the negative-path ledger id");
  assert(/^AS1-[0-9a-f]{16}$/.test(canonicalStatus.captured?.replayKey ?? ""), "captured runtime must preserve a valid replay key");
  assert(canonicalStatus.captured?.replayConsistency === "MATCH", "captured runtime must have deterministic replay consistency");
  assert(canonicalStatus.captured?.valueMovement === false, "canonical negative path must not move value");
  assert(canonicalStatus.promotionReady === false, "runtime evidence alone must not bypass remaining submission requirements");
}

const runtimeStatus = JSON.parse(read("evidence/runtime/LATEST.json"));
assert(runtimeStatus.status === "PUBLIC_RUNTIME_CAPTURED", "public runtime capture must remain explicit");
assert(runtimeStatus.probes?.filter((p) => p.critical).every((p) => p.ok), "all critical runtime probes must be healthy");
assert(read("evidence/negative-path/FAIL-CLOSED-FIXTURE.json").includes("TEST_FIXTURE_NOT_RUNTIME_EVIDENCE"), "fixture must never masquerade as runtime evidence");
assert(read("evidence/eligibility/STATUS.json").includes("PENDING_EXTERNAL_RECEIPT"), "external eligibility must remain pending until real receipts exist");

console.log("Alpha Scout integrity gates: PASS");
