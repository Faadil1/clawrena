import fs from "node:fs";

const eligibility = readJson("evidence/eligibility/STATUS.json");
const runtime = readJson("evidence/runtime/LATEST.json");
const canonical = readJson("evidence/canonical-run/STATUS.json");

const checks = [];
for (const [name, item] of Object.entries(eligibility.requirements ?? {})) {
  if (item.required) checks.push([`eligibility:${name}`, item.status === "VERIFIED", item.status]);
}

checks.push(["runtime:public", runtime.status === "PUBLIC_RUNTIME_CAPTURED", runtime.status]);
checks.push([
  "runtime:commit-sha",
  typeof runtime.deployedCommitSha === "string" && runtime.deployedCommitSha.length >= 7,
  runtime.deployedCommitSha ?? "missing",
]);
checks.push([
  "canonical-run",
  canonical.status === "REAL_RUNTIME_CAPTURED" || canonical.status === "READY_FOR_PROMOTION",
  canonical.status,
]);

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "BLOCK"} ${name} — ${detail}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`Gate 7 blocked: ${failed} required check(s) incomplete.`);
  process.exit(1);
}
console.log("Gate 7 submission-readiness checks: PASS");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
