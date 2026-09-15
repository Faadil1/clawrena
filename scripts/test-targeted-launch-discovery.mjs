import fs from "node:fs";

const market = fs.readFileSync(new URL("../convex/lib/market.ts", import.meta.url), "utf8");
const scanner = fs.readFileSync(new URL("../convex/scanner.ts", import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(market.includes('PUMP_MINT_AUTHORITY = "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM"'), "Pump mint-authority PDA must remain explicit");
assert(market.includes('"pump-mint-authority"') && market.includes('"pump-program-fallback"'), "discovery must preserve targeted-first plus broad fallback sources");
assert(market.includes("findPumpCreateMintInInstructions"), "candidate-source optimization must not replace strict create/create_v2 parsing");
assert(market.includes("topLevel") && market.includes("innerInstructions"), "launch verification must inspect top-level and CPI instructions");
assert(market.includes("targetedBudget = Math.min(100, cap)"), "targeted mint-authority source must receive a bounded first-pass budget");
assert(scanner.includes("candidateSource") && scanner.includes("sources: discovery.sources"), "runtime diagnostics must expose which candidate source produced the launch");
assert(scanner.includes("official-create-or-create-v2-top-level-or-cpi"), "scanner telemetry must preserve strict verification semantics");

console.log("Targeted Pump launch discovery invariants: PASS");
