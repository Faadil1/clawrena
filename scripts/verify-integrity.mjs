import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const portfolio = read("convex/portfolio.ts");
const wallet = read("convex/wallet.ts");
const publicStats = read("convex/queries/public.ts");
const runner = read("convex/runAgent.ts");
const landing = read("src/pages/Landing.tsx");
const clawPump = read("convex/lib/clawpump.ts");

assert(portfolio.includes("recordWalletObservation"), "wallet observations must have a dedicated path");
assert(wallet.includes("importedSol: 0"), "wallet observation must never mint paper cash");
assert(publicStats.includes('executionMode === "onchain"') && publicStats.includes("txSignature"), "verified volume must require on-chain mode + signature");
assert(runner.includes("claimSignal") && runner.includes("releaseSignalClaim"), "signal execution must use an atomic claim lease");
assert(runner.includes("evaluateLaunchEvidence"), "entry loop must pass through evidence scoring");
assert(clawPump.includes("acknowledgeHighRisk: false") && clawPump.includes("acknowledgeUnverified: false"), "ClawPump safety gates must not be bypassed");
assert(read("convex/clawPump.ts").includes("decisionReceiptId") && read("convex/clawPump.ts").includes("getDecisionReceiptForAgent"), "ClawPump build authority must come from a stored passing receipt, not client-supplied score");
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

console.log("Winning-delta integrity gates: PASS");
