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
assert(read("evidence/canonical-run/STATUS.json").includes("PENDING_REAL_RUNTIME_CAPTURE"), "canonical run must not be marked complete before real runtime capture");
assert(read("evidence/negative-path/FAIL-CLOSED-FIXTURE.json").includes("TEST_FIXTURE_NOT_RUNTIME_EVIDENCE"), "negative-path fixture must never masquerade as runtime evidence");
assert(read("state/CURRENT.yaml").includes("gate_7_promote"), "canonical state must preserve promotion gate");

console.log("Winning-delta P0-P3 integrity gates: PASS");
