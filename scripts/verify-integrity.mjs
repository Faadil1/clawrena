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

assert(portfolio.includes("recordWalletObservation"), "wallet observations must have a dedicated path");
assert(wallet.includes("importedSol: 0"), "wallet observation must never mint paper cash");
assert(publicStats.includes('executionMode === "onchain"') && publicStats.includes("txSignature") && publicStats.includes("confirmationSlot"), "verified volume must require on-chain mode + signature + independent confirmation slot");
assert(publicStats.includes("pendingOnchainVolumeSol"), "submitted/unconfirmed on-chain activity must stay separate from paper and verified volume");
assert(runner.includes("claimSignal") && runner.includes("releaseSignalClaim"), "signal execution must use an atomic claim lease");
assert(runner.includes("evaluateLaunchEvidence"), "entry loop must pass through evidence scoring");
assert(clawPumpLib.includes("acknowledgeHighRisk: false") && clawPumpLib.includes("acknowledgeUnverified: false"), "ClawPump safety gates must not be bypassed");
assert(clawPumpAction.includes("decisionReceiptId") && clawPumpAction.includes("getDecisionReceiptForAgent"), "ClawPump build authority must come from a stored passing receipt, not client-supplied score");
assert(!landing.includes("Executes across spot, perps, and prediction markets"), "landing must not claim unbuilt execution surfaces");
assert(!landing.includes("every trade lands on Solana"), "landing must not present paper trades as on-chain");

const schema = read("convex/schema.ts");
const signals = read("convex/signals.ts");
const market = read("convex/lib/market.ts");
const pumpInstruction = read("convex/lib/pumpInstruction.ts");
const risk = read("convex/lib/risk.ts");
const shield = read("convex/shieldScan.ts");
assert(schema.includes("signal_executions") && schema.includes("by_agentId_signalId"), "idempotency must be scoped to agent + signal");
assert(signals.includes("claimToken") && signals.includes("canAcquireClaim"), "claim lease must distinguish concurrent runs of the same agent");
assert(portfolio.includes("updateEquityHighWater") && portfolio.includes("nextEquityRisk"), "drawdown must use a persisted equity high-water mark");
assert(risk.includes("drawdownPct") && risk.includes("Math.max"), "high-water risk math must remain explicit and testable");
assert(market.includes("isPumpCreateInstructionData") && pumpInstruction.includes("PUMP_CREATE_V2") && !market.includes("postTokenBalances"), "launch discovery must verify Pump create discriminators, not infer from token-balance deltas");
assert(market.includes("getMultipleAccounts") && market.includes("programControlledPct"), "holder concentration must aggregate sampled accounts by owner and classify Pump custody");
assert(!shield.includes("Deep scan queued"), "unimplemented shield classifiers must remain UNKNOWN, never queued/pass by implication");

const executionAuthority = read("convex/lib/executionAuthority.ts");
assert(executionAuthority.includes("MAX_EXECUTION_RECEIPT_AGE_MS"), "last-mile authority must expire stale strategy evidence");
assert(clawPumpAction.includes("providerPreflightHealthy") && clawPumpAction.includes("Execution authority denied"), "ClawPump last mile must use a live provider preflight and fail closed");
assert(clawPumpAction.includes('decision: "reject"') && clawPumpAction.includes('executionMode: "onchain"'), "last-mile authority failures must remain in the evidence record");
assert(read("docs/REAL_FAILURE_EVIDENCE.md").includes("Real failure > fake success"), "real-failure rule must remain canonical");
assert(read("docs/CLAIM_LEDGER.md").includes("PROHIBITED UNTIL PROVEN"), "claim ledger must preserve unproven-performance boundary");

const canonicalStatus = JSON.parse(read("evidence/canonical-run/STATUS.json"));
assert(["PENDING_REAL_RUNTIME_CAPTURE", "REAL_NEGATIVE_PATH_CAPTURED"].includes(canonicalStatus.status), "canonical runtime status must be an explicit known state");
if (canonicalStatus.status === "REAL_NEGATIVE_PATH_CAPTURED") {
  assert(canonicalStatus.captured?.realPumpLaunchMint, "captured canonical runtime must preserve the real Pump mint");
  assert(canonicalStatus.captured?.realPumpLaunchSignature, "captured canonical runtime must preserve the real Pump launch signature");
  assert(canonicalStatus.captured?.realNegativePathLedgerId, "captured canonical runtime must preserve the negative-path ledger id");
  assert(/^AS1-[0-9a-f]{16}$/.test(canonicalStatus.captured?.replayKey ?? ""), "captured canonical runtime must preserve a valid replay key");
  assert(canonicalStatus.captured?.replayConsistency === "MATCH", "captured canonical runtime must have deterministic replay consistency");
  assert(canonicalStatus.captured?.valueMovement === false, "canonical negative path must not move value");
  assert(canonicalStatus.promotionReady === false, "runtime capture alone must not bypass remaining promotion gates");
}
assert(read("evidence/negative-path/FAIL-CLOSED-FIXTURE.json").includes("TEST_FIXTURE_NOT_RUNTIME_EVIDENCE"), "negative-path fixture must never masquerade as runtime evidence");
assert(read("state/CURRENT.yaml").includes("gate_7_promote"), "canonical state must preserve promotion gate");

const tokenEconomics = read("convex/lib/tokenEconomics.ts");
const agentConsole = read("src/pages/AgentConsole.tsx");
assert(tokenEconomics.includes("CLAWPUMP_CREATOR_FEE_SHARE_PCT = 75"), "creator-fee share must be explicit and testable");
assert(clawPumpLib.includes("/fees/earnings?agentId=") && clawPumpLib.includes("normalizeClawPumpFeeEarnings"), "token economics must come from ClawPump's public fee ledger, not invented values");
assert(clawPumpAction.includes("treasuryStatus") && clawPumpAction.includes("holderRevenueShare: false") && clawPumpAction.includes("automatedTreasurySpending: false"), "treasury observation must preserve token-utility claim boundaries");
assert(agentConsole.includes("Agent Treasury") && agentConsole.includes("does <b>not</b> claim holder revenue share"), "judge-facing treasury UI must state the non-holder-revenue boundary");
assert(read("docs/TOKEN_UTILITY.md").includes("NOT BUILT / prohibited wording"), "token utility doc must preserve prohibited financial claims");
assert(read("evidence/eligibility/STATUS.json").includes("PENDING_EXTERNAL_RECEIPT"), "tokenization eligibility must remain pending until a real receipt exists");
assert(read("docs/GATE_7_PROMOTE.md").includes("NO_PROMOTE"), "promotion authority must remain fail closed");

const passport = read("convex/lib/evidencePassport.ts");
const policy = read("convex/lib/evidencePolicy.ts");
const evidenceScore = read("convex/lib/evidenceScore.ts");
const evidence = read("convex/evidence.ts");
const proof = read("src/pages/Proof.tsx");
const http = read("convex/http.ts");
const underwritingLib = read("convex/lib/underwriting.ts");
const underwritingDb = read("convex/underwriting.ts");
const skill = read("skills/evidence-authority/SKILL.md");
const competition = read("docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md");
const whiteSpace = read("docs/WHITE_SPACE_P11_1.md");
const x402 = read("docs/X402_AUTHORITY_SERVICE.md");

assert(policy.includes('EVIDENCE_POLICY_VERSION = "AS-AUTHORITY-V1"') && policy.includes("minLiquidityUsd") && policy.includes("minEvidenceScore") && policy.includes("scoreWeights"), "P11.1 must centralize executable policy version, thresholds and scoring weights");
assert(evidenceScore.includes('from "./evidencePolicy"') && evidenceScore.includes("EVIDENCE_POLICY.minEvidenceScore"), "Evidence Gate must execute the canonical policy manifest");
assert(executionAuthority.includes('from "./evidencePolicy"') && executionAuthority.includes("EVIDENCE_POLICY.passportFreshnessMs"), "last-mile authority must share the canonical policy freshness/thresholds");
assert(passport.includes('from "./evidencePolicy"') && passport.includes("replayKey") && passport.includes("counterfactuals"), "Evidence Passport must be bound to the versioned policy and remain replayable/counterfactual-aware");
assert(passport.includes('return "QUALIFIED"') && !passport.includes('return "AUTHORIZED"'), "evidence qualification must never overclaim last-mile execution authorization");
assert(evidence.includes("buildEvidencePassport"), "every local decision receipt must receive an Evidence Passport at write time");
assert(schema.includes("underwriting_decisions") && schema.includes("by_replayKey") && schema.includes("supersedesReplayKey"), "cross-agent underwriting must have a durable replay/lineage ledger");
assert(schema.includes("DECLARED_EXTERNAL_CONTEXT") && schema.includes("caller:"), "agent-to-agent receipts must support bounded declared caller context");
assert(underwritingDb.includes("recordDecision") && underwritingDb.includes("getByReplayKey") && underwritingDb.includes("by_replayKey"), "durable underwriting writes and replay lookup must be server-side");
assert(underwritingDb.includes("callerIdentityVerifiedByAlphaScout: false"), "stored caller context must not be mislabeled as verified identity");
assert(underwritingLib.includes("findMintCreatedInTx") && underwritingLib.includes("sourceLedger") && underwritingLib.includes("jupiter-price-v3") && underwritingLib.includes("solana-owner-concentration"), "underwriting must independently verify Pump provenance and preserve evidence-source lineage");
assert(underwritingLib.includes("compareUnderwritingDecisions") && underwritingLib.includes("unknownsResolved") && underwritingLib.includes("blockersResolved"), "re-underwriting must expose decision/evidence drift rather than rewrite history");
assert(market.includes("blockId") && market.includes("observationSlot") && market.includes("observedAt"), "evidence sources must preserve available observation clocks/slots");
assert(schema.includes("policyVersion") && schema.includes("policyState") && schema.includes("freshnessExpiresAt") && schema.includes("counterfactuals"), "local receipt schema must persist Evidence Passport fields without rewriting history");
assert(proof.includes("TO RECONSIDER") && proof.includes("REPLAY") && proof.includes("qualified ≠ authorized"), "judge-facing proof room must expose replay, counterfactuals and qualification boundary");

assert(http.includes('path: "/authority-policy"') && http.includes('path: "/authority-openapi"') && http.includes('path: "/authority-stats"'), "authority policy, integration schema and honest activity stats must be machine-readable");
assert(http.includes('path: "/underwrite"') && http.includes('path: "/reunderwrite"'), "authority runtime must expose underwriting and server-bound re-underwriting");
assert(http.includes("internal.underwriting.recordDecision") && http.includes("internal.underwriting.getByReplayKey"), "HTTP authority must persist decisions and resolve prior replay keys server-side");
assert(http.includes("previousReplayKey") && !http.includes("previousTokenMint"), "re-underwrite continuity must not accept caller-supplied replacement token identity");
assert(http.includes("AUTHORITY_API_KEY") && http.includes("x-alpha-scout-key"), "authority mutation endpoints must support optional server-side access control");
assert(http.includes("DECLARED_EXTERNAL_CONTEXT") && http.includes("callerIdentityVerifiedByAlphaScout: false"), "HTTP authority must preserve caller attribution truth boundary");
assert(http.includes("valueMovement") || underwritingLib.includes("valueMovement: false"), "underwriting must never masquerade as execution");
assert(publicStats.includes('query("underwriting_decisions")') && publicStats.includes("underwritingLineageReruns"), "public authority metrics must derive from durable underwriting history");
assert(publicStats.includes("externallyAttributedUnderwritingRequests") && publicStats.includes("Request counts only") && publicStats.includes("not unique-agent counts") && publicStats.includes("not trading volume"), "authority activity must preserve non-user/non-volume semantics");

assert(skill.includes("Shadow mode") && skill.includes("/reunderwrite") && skill.includes("source ledger") && skill.includes("QUALIFIED is not AUTHORIZED"), "Hermes/ClawPump skill must teach shadow adoption, source lineage and replay semantics");
assert(skill.includes("DECLARED_EXTERNAL_CONTEXT") && skill.includes("not cryptographic identity proof"), "skill must preserve external caller attribution boundary");
assert(competition.includes("154 tokenized entries") && competition.includes("SelfMade") && competition.includes("HyperBull") && competition.includes("MarketBubbleSearch"), "competitive intelligence snapshot must stay grounded in observed Clawrena surfaces");
assert(whiteSpace.includes("no equivalent implementation was found") && whiteSpace.includes("Shadow underwriting") && whiteSpace.includes("Re-underwriting") && whiteSpace.includes("not unique agents/users"), "white-space document must preserve scope/traction truth boundaries");
assert(x402.includes("READY TO ACTIVATE / NOT DEPLOYED / NO REVENUE CLAIM") && x402.includes("A paid refusal is meaningful"), "x402 specialization must remain a prepared, unproven service rather than fake traction");

console.log("Winning Intelligence P11 authority-network integrity gates: PASS");
