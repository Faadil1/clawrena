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

console.log("Winning-delta integrity gates: PASS");
