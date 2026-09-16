# P11.4 — Agent-to-Agent Authority Proof

Status: CODED NEXT / RUNTIME PROOF PENDING

## Goal

Prove that Alpha Scout is useful as infrastructure to another autonomous agent, not only to its own UI.

The proof is valid only when a real external ClawPump/Hermes agent invokes Alpha Scout's live `/underwrite` endpoint against a real Pump launch and the two systems' receipts can be cross-referenced.

## Attribution model

`/underwrite` may accept optional caller metadata:

```json
{
  "tokenMint": "<mint>",
  "launchSignature": "<real Pump create/create_v2 signature>",
  "caller": {
    "platform": "clawpump",
    "agentId": "<real ClawPump agent id>",
    "runId": "<real autonomous run id when available>",
    "skillSlug": "evidence-authority"
  }
}
```

Caller metadata is **DECLARED_EXTERNAL_CONTEXT**, not cryptographically verified identity. Alpha Scout never calls it a unique user or authenticated agent unless a separate ClawPump receipt proves that identity.

## Required cross-system evidence

A canonical agent-to-agent proof must preserve both sides:

### Alpha Scout side
- real Pump mint + create/create_v2 signature
- underwriting ledger id
- Evidence Passport replay key
- policy state (`REFUSED` is valid)
- `valueMovement=false`
- caller metadata copied into the durable decision record

### ClawPump/Hermes side
- real ClawPump agent id
- custom Evidence Authority skill id/slug enabled
- real chat or autonomous run id
- run/chat step showing the Alpha Scout request
- returned replay key/state from Alpha Scout
- usage/billing receipt if the run consumed paid credits

The two sides must match on at least:
- Alpha Scout replay key
- token mint
- launch signature
- external agent id
- run/chat id when supplied

## Truth boundaries

- caller metadata is declared, not identity proof by itself
- request count is not unique-agent count
- `REFUSED` is a successful authority-service result
- shadow underwriting moves no value
- ClawPump chat/run activity is not trading volume
- ANSEM-funded is forbidden wording until a real ANSEM billing/run receipt exists

## Official ClawPump path

Current official ClawPump documentation exposes:
- `create_custom_skill`
- `create_agent_run`
- `get_agent_run_steps`
- `chat_with_agent`
- billing/usage tools

The local MCP setup is documented by ClawPump as:

```powershell
npx @clawpump/agents --claude
```

or Hermes:

```bash
hermes clawpump setup
```

The `cpk_` API key must stay in the local MCP environment. Never paste it into Alpha Scout evidence files or chat logs.
