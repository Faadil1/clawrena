import fs from "node:fs";
import ts from "typescript";

function loadTs(path) {
  const source = fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("exports", "module", output)(module.exports, module);
  return module.exports;
}
const assert = (value, message) => { if (!value) throw new Error(message); };
const { evaluateLaunchEvidence } = loadTs("convex/lib/evidenceScore.ts");
const { canAcquireClaim, CLAIM_LEASE_MS } = loadTs("convex/lib/claimLease.ts");
const { nextEquityRisk } = loadTs("convex/lib/risk.ts");
const { isPumpCreateInstructionData, PUMP_CREATE, PUMP_CREATE_V2 } = loadTs("convex/lib/pumpInstruction.ts");
const { evaluateExecutionAuthority, MAX_EXECUTION_RECEIPT_AGE_MS } = loadTs("convex/lib/executionAuthority.ts");
const now = Date.now();
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
assert(isPumpCreateInstructionData(encodeBase58([...PUMP_CREATE, 1, 2, 3])), "legacy Pump create discriminator must verify");
assert(isPumpCreateInstructionData(encodeBase58([...PUMP_CREATE_V2, 9, 8, 7])), "Pump create_v2 discriminator must verify");
assert(!isPumpCreateInstructionData(encodeBase58([1, 2, 3, 4, 5, 6, 7, 8, 9])), "unrelated Pump instruction must not verify as a launch");
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
console.log("Evidence, claim lease, Pump parser, high-water risk + execution authority tests: PASS");
