# P11.4 — Agent-to-Agent Authority Proof

Status: **EXTERNAL AGENT AUTHORITY PROOF COMPLETE / CLAWPUMP-NATIVE AUTONOMOUS RUN NOT PROVED**

## Goal

Prove that Alpha Scout is useful as infrastructure to another autonomous agent, not only to its own UI.

The canonical proof is valid when an auditable external agent runtime invokes Alpha Scout's live `/underwrite` endpoint against a real Pump launch, preserves its external session/run identifier in declared caller context, and the stored Alpha Scout Evidence Passport independently recomputes to the same replay key.

The completed canonical external runtime is Claude Code headless in safe mode. The separate ClawPump-native path remains preserved as integration evidence: a real ClawPump agent exists and the Evidence Authority custom skill is installed/enabled, but ClawPump chat produced no auditable HTTP tool trace and zero-budget autonomous runs are rejected by the current runtime.

## Completed canonical proof

External runtime:
- platform: `claude-code`
- agentId: `claude-code-headless`
- session/runId: `94b94917-ff0d-4697-b0fd-5ca7d687f3a0`
- tools: `Bash`, `Read`
- MCP servers: none
- mode: headless safe mode

Real Pump launch:
- mint: `BPVRf68R4zxrXVXBQMo8KpvJcq9vLM1tpe7p1hckuvd1`
- launch signature: `47emwzJgBXieLUc1zq555jv4ajQbXevwhJFoxaATNyJnqLoFDvpp6ZFE4QLVVe5CoXahFkMyfF6Fy9mpNR4Zoy83`

Alpha Scout result:
- HTTP `200`
- ledger: `md72gnkxnf2arb7ewnrc2szb498ehrxr`
- policy: `AS-AUTHORITY-V1`
- state: `REFUSED`
- score: `30`
- blockers: `holder concentration unknown`; `launch signal older than six hours`
- replay key: `AS1-51fff2964ef6c06d`
- `valueMovement=false`

Stored receipt verification:
- Convex status: `success`
- replay key: `AS1-51fff2964ef6c06d`
- recomputed replay key: `AS1-51fff2964ef6c06d`
- replay consistency: `MATCH`
- stored caller runId equals external session ID
- stored mint and launch signature match the external request
- `callerIdentityVerifiedByAlphaScout=false`

Canonical artifact:
`evidence/canonical-run/P11-EXTERNAL-AGENT-AUTHORITY-2026-09-16.json`

## Attribution model

`/underwrite` accepts bounded declared caller metadata:

```json
{
  "tokenMint": "<mint>",
  "launchSignature": "<real Pump create/create_v2 signature>",
  "caller": {
    "platform": "<external runtime>",
    "agentId": "<external agent/runtime identifier>",
    "runId": "<real external session/run id>",
    "skillSlug": "evidence-authority"
  }
}
```

Caller metadata is **DECLARED_EXTERNAL_CONTEXT**, not cryptographically verified identity. A matching external transcript/session plus stored Alpha Scout receipt provides cross-system evidence, but neither the caller metadata nor the Claude Code session ID is a cryptographic identity primitive.

## Required cross-system evidence

A canonical external-agent proof preserves both sides:

### Alpha Scout side
- real Pump mint + create/create_v2 signature
- underwriting ledger id
- Evidence Passport replay key
- policy state (`REFUSED` is valid)
- `valueMovement=false`
- caller metadata copied into the durable decision record
- `verifyReceipt` returns deterministic `MATCH`

### External runtime side
- real external session/run id
- auditable tool step showing the Alpha Scout request
- actual HTTP response
- returned replay key/state
- no silent retry when the proof contract says one request

The two sides match on:
- replay key
- token mint
- launch signature
- external platform/agent identifier
- session/run id

## ClawPump-native path — preserved but incomplete

Observed:
- real agent `T`: `c1a5477c-c79e-4388-a9eb-8303fa441087`
- Evidence Authority skill id: `aa303f0b-9f60-4e06-8278-e0dee6ef5a33`
- slug: `evidence-authority`
- skill enabled: true
- chat probe returned plausible policy text but `tools_used=[]`; therefore no live HTTP proof
- autonomous-run schema advertised budget minimum `0`, but runtime rejected `budget_usd=0` and required a positive budget
- no autonomous ClawPump run was created and no financial state change occurred

Do not describe the completed Claude Code proof as a ClawPump-native autonomous-run proof.

## Truth boundaries

- caller metadata is declared, not cryptographic identity proof
- Claude Code session ID is not cryptographic identity proof
- deterministic replay `MATCH` is not cryptographic attestation and not live revalidation
- request count is not unique-agent count
- `REFUSED` is a successful authority-service result
- shadow underwriting moves no value
- `QUALIFIED` would still not mean final execution authorization
- ClawPump chat/run activity is not trading volume
- ClawPump-native autonomous invocation remains unproved
- ANSEM-funded is forbidden wording until a real ANSEM billing/run receipt exists
