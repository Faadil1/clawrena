import fs from "node:fs";
import path from "node:path";

const cloud = stripSlash(process.env.CONVEX_CLOUD_URL);
const site = stripSlash(process.env.CONVEX_HTTP_URL);
const sourceSha = process.env.DEPLOYED_COMMIT_SHA?.trim() || null;
const requestedScanLimit = boundedInt(process.env.PUMP_SIGNATURE_SCAN_LIMIT, 300, 1, 500);
if (!cloud || !site) {
  console.error("CONVEX_CLOUD_URL and CONVEX_HTTP_URL are required");
  process.exit(2);
}

const evidence = {
  artifactClass: "P11_AUTHORITY_RUNTIME_PROOF",
  status: "RUNNING",
  fakeSuccessForbidden: true,
  sourceSha,
  convexCloudUrl: cloud,
  convexHttpUrl: site,
  capturedAt: new Date().toISOString(),
  requestedPumpSignatureScanLimit: requestedScanLimit,
  reachability: {},
  discovery: null,
  underwriting: null,
  receiptConsistency: null,
  lineage: null,
  truthBoundaries: {
    qualifiedIsExecutionAuthorization: false,
    underwritingMovesValue: false,
    requestCountIsUniqueAgents: false,
    requestCountIsTradingVolume: false,
    replayKeyIsCryptographicSignature: false
  }
};

try {
  evidence.reachability.health = await getJson(`${site}/healthz`);
  evidence.reachability.policy = await getJson(`${site}/authority-policy`);
  evidence.reachability.openapi = await getJson(`${site}/authority-openapi`);
  evidence.reachability.statsBefore = await getJson(`${site}/authority-stats`);

  const discovery = await runFunction(cloud, "scanner/discoverNow", { signatureLimit: requestedScanLimit });
  evidence.discovery = discovery;
  const event = discovery?.value?.events?.[0];
  if (!event?.mint || !event?.signature) {
    const value = discovery?.value ?? {};
    throw new Error(
      `No verified Pump create/create_v2 launch was discovered after ${value.signaturesExamined ?? "unknown"} examined signatures across ${value.pagesSearched ?? "unknown"} page(s); dedicated RPC configured=${Boolean(value.configured)}. No synthetic candidate was substituted.`,
    );
  }

  const underwriting = await postJson(`${site}/underwrite`, {
    tokenMint: event.mint,
    launchSignature: event.signature
  });
  evidence.underwriting = underwriting;
  if (!underwriting?.ok || underwriting?.valueMovement !== false) throw new Error("Underwriting contract failed or value-movement boundary was violated.");
  if (!["QUALIFIED", "REFUSED"].includes(underwriting.policyState)) throw new Error("Underwriting returned an invalid policy state.");
  if (!Array.isArray(underwriting.sourceLedger) || underwriting.sourceLedger.length === 0) throw new Error("Underwriting returned no source ledger.");

  const replayKey = underwriting?.passport?.replayKey;
  if (!/^AS1-[0-9a-f]{16}$/.test(replayKey || "")) throw new Error("Underwriting returned no valid Evidence Passport replay key.");

  evidence.receiptConsistency = await runFunction(cloud, "underwriting/verifyReceipt", { replayKey });
  if (evidence.receiptConsistency?.value?.replayConsistency !== "MATCH") throw new Error("Stored Evidence Passport did not recompute to the same replay key.");

  evidence.lineage = await postJson(`${site}/reunderwrite`, { previousReplayKey: replayKey });
  if (!evidence.lineage?.ok || evidence.lineage?.lineage?.previousReplayKey !== replayKey) throw new Error("Re-underwriting lineage did not bind to the previous server-stored receipt.");
  if (evidence.lineage?.current?.valueMovement !== false) throw new Error("Re-underwriting violated the no-value-movement boundary.");

  evidence.reachability.statsAfter = await getJson(`${site}/authority-stats`);
  evidence.status = "CAPTURED";
} catch (error) {
  evidence.status = "FAILED_CLOSED";
  evidence.error = error instanceof Error ? error.message : String(error);
}

const out = path.resolve("evidence/runtime/P11-AUTHORITY-RUNTIME.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
if (evidence.status !== "CAPTURED") process.exit(1);

async function runFunction(base, identifier, args) {
  const response = await fetch(`${base}/api/run/${identifier}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "alpha-scout-runtime-proof/2.1" },
    body: JSON.stringify({ args, format: "json" })
  });
  const body = await response.json();
  if (!response.ok || body?.status !== "success") throw new Error(`Convex function ${identifier} failed: ${JSON.stringify(body)}`);
  return body;
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "alpha-scout-runtime-proof/2.1" } });
  const body = await response.json();
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`);
  return body;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "alpha-scout-runtime-proof/2.1" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`POST ${url} failed with ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function stripSlash(value) {
  return value ? value.trim().replace(/\/+$/, "") : "";
}
