import fs from "node:fs";
import path from "node:path";

const site = stripSlash(process.env.CONVEX_HTTP_URL);
const cloud = stripSlash(process.env.CONVEX_CLOUD_URL);
const tokenMint = process.env.AUTHORITY_TOKEN_MINT?.trim() || "";
const launchSignature = process.env.AUTHORITY_LAUNCH_SIGNATURE?.trim() || "";
const callerPlatform = process.env.AUTHORITY_CALLER_PLATFORM?.trim() || "clawpump";
const callerAgentId = process.env.CLAWPUMP_AGENT_ID?.trim() || "";
const callerRunId = process.env.CLAWPUMP_RUN_ID?.trim() || "";
const callerSkillSlug = process.env.AUTHORITY_CALLER_SKILL?.trim() || "evidence-authority";
const authorityKey = process.env.AUTHORITY_API_KEY?.trim() || "";

if (!site || !cloud || !tokenMint || !launchSignature || !callerAgentId) {
  console.error("CONVEX_HTTP_URL, CONVEX_CLOUD_URL, AUTHORITY_TOKEN_MINT, AUTHORITY_LAUNCH_SIGNATURE and CLAWPUMP_AGENT_ID are required");
  process.exit(2);
}

const proof = {
  artifactClass: "AGENT_TO_AGENT_AUTHORITY_PROOF",
  status: "RUNNING",
  capturedAt: new Date().toISOString(),
  caller: {
    platform: callerPlatform,
    agentId: callerAgentId,
    runId: callerRunId || null,
    skillSlug: callerSkillSlug,
    identitySemantics: "DECLARED_EXTERNAL_CONTEXT_REQUIRES_SEPARATE_CLAWPUMP_RECEIPT_FOR_IDENTITY_PROOF"
  },
  authority: null,
  receiptConsistency: null,
  truthBoundaries: {
    requestCountIsUniqueAgents: false,
    callerMetadataIsCryptographicIdentity: false,
    underwritingMovesValue: false,
    refusedIsValidServiceOutcome: true
  }
};

try {
  const headers = authorityKey ? { "x-alpha-scout-key": authorityKey } : {};
  const authority = await postJson(`${site}/underwrite`, {
    tokenMint,
    launchSignature,
    caller: {
      platform: callerPlatform,
      agentId: callerAgentId,
      runId: callerRunId || undefined,
      skillSlug: callerSkillSlug
    }
  }, headers);
  proof.authority = authority;
  if (!authority?.ok || authority?.valueMovement !== false) throw new Error("Agent-to-agent underwriting contract failed or moved value.");
  if (!["QUALIFIED", "REFUSED"].includes(authority?.policyState)) throw new Error("Invalid authority policy state.");
  if (authority?.caller?.agentId !== callerAgentId) throw new Error("Persisted caller attribution does not match the external agent id.");

  const replayKey = authority?.passport?.replayKey;
  if (!/^AS1-[0-9a-f]{16}$/.test(replayKey || "")) throw new Error("No valid replay key returned.");
  proof.receiptConsistency = await runFunction(cloud, "underwriting/verifyReceipt", { replayKey });
  if (proof.receiptConsistency?.value?.replayConsistency !== "MATCH") throw new Error("Evidence Passport consistency check failed.");
  if (proof.receiptConsistency?.value?.caller?.agentId !== callerAgentId) throw new Error("Stored receipt lost caller attribution.");

  proof.status = "CAPTURED_ALPHA_SCOUT_SIDE";
} catch (error) {
  proof.status = "FAILED_CLOSED";
  proof.error = error instanceof Error ? error.message : String(error);
}

const out = path.resolve("evidence/runtime/P11-AGENT-TO-AGENT-AUTHORITY.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof, null, 2));
if (proof.status === "FAILED_CLOSED") process.exit(1);

async function runFunction(base, identifier, args) {
  const response = await fetch(`${base}/api/run/${identifier}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "alpha-scout-agent-proof/1.0" },
    body: JSON.stringify({ args, format: "json" })
  });
  const body = await response.json();
  if (!response.ok || body?.status !== "success") throw new Error(`Convex function ${identifier} failed: ${JSON.stringify(body)}`);
  return body;
}

async function postJson(url, body, extraHeaders = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "alpha-scout-agent-proof/1.0", ...extraHeaders },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`POST ${url} failed with ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

function stripSlash(value) {
  return value ? value.trim().replace(/\/+$/, "") : "";
}
