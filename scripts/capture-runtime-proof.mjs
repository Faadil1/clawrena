import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const publicUrl = stripSlash(process.env.PUBLIC_URL);
const convexHttpUrl = stripSlash(process.env.CONVEX_HTTP_URL);
const deployedCommitSha = process.env.DEPLOYED_COMMIT_SHA?.trim() || null;

if (!publicUrl || !convexHttpUrl) {
  console.error("PUBLIC_URL and CONVEX_HTTP_URL are required.");
  process.exit(2);
}

const targets = [
  { name: "frontend_root", url: `${publicUrl}/`, critical: true },
  { name: "frontend_proof_route", url: `${publicUrl}/proof`, critical: true },
  { name: "convex_healthz", url: `${convexHttpUrl}/healthz`, critical: true },
  { name: "clawpump_platform_health", url: "https://clawpump.tech/api/health", critical: false },
];

const probes = [];
for (const target of targets) probes.push(await probe(target));

const appHealthy = probes.filter((p) => p.critical).every((p) => p.ok);
const provider = probes.find((p) => p.name === "clawpump_platform_health");
const capture = {
  artifactClass: "PUBLIC_RUNTIME_CAPTURE_STATUS",
  status: appHealthy ? "PUBLIC_RUNTIME_CAPTURED" : "RUNTIME_CAPTURE_FAILED",
  fakeSuccessForbidden: true,
  publicUrl,
  convexHttpUrl,
  deployedCommitSha,
  capturedAt: new Date().toISOString(),
  providerHealth: provider ? { ok: provider.ok, status: provider.status } : null,
  probes,
  notes:
    "Reachability evidence only. Canonical-run promotion still requires a real launch signature and a real negative-path decision receipt.",
};

const out = path.resolve("evidence/runtime/LATEST.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(capture, null, 2)}\n`);
console.log(JSON.stringify(capture, null, 2));
if (!appHealthy) process.exit(1);

async function probe(target) {
  const started = Date.now();
  try {
    const res = await fetch(target.url, {
      redirect: "follow",
      headers: { "user-agent": "alpha-scout-runtime-proof/1.0" },
    });
    const body = await res.text();
    return {
      ...target,
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      latencyMs: Date.now() - started,
      contentType: res.headers.get("content-type"),
      bytes: Buffer.byteLength(body),
      sha256: crypto.createHash("sha256").update(body).digest("hex"),
    };
  } catch (error) {
    return {
      ...target,
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function stripSlash(value) {
  if (!value) return "";
  return value.trim().replace(/\/+$/, "");
}
