# P11.1 White-Space Exploitation — Authority Network

Date: 2026-09-15

This document records white-space found after re-scanning the official Clawrena judging surface, ClawPump analytics/docs and a representative set of leading/current entries. It is **not an exhaustive claim that no competitor anywhere has similar mechanics**. The correct statement is: **no equivalent implementation was found on the official/public surfaces reviewed in this pass.**

## Competitive areas already crowded

Do not spend differentiation budget recreating these categories:

- generic alpha scanning / token discovery
- meme-token analysis
- generic risk scoring
- autonomous trading
- treasury strategies, buybacks and creator-fee dashboards
- generic x402 usage
- evidence/refusal as a generic product value

Official surfaces reviewed:

- https://clawpump.tech/ansemhack
- https://clawpump.tech/analytics
- https://clawpump.tech/docs
- https://clawpump.tech/guide
- https://clawpump.tech/developers

Representative crowded examples reviewed include Steve and Dispatch:

- https://clawpump.tech/tokens/3z84z2Na9Cd5R3uoBmSFbBrRr5bFxaECVPM3wQaWJQRX
- https://clawpump.tech/tokens/4vhJ4iFqJLzNebrAcUZTqTGakcJGok34WCXmsa9Dh9vi

## White-space exploited in P11.1

### WS-01 — Cross-agent Evidence Authority

Alpha Scout does not need to be the agent that found the trade. Another Hermes/ClawPump workflow can send only a Pump mint + launch signature and receive an independently recomputed policy decision.

Runtime contract:

`other agent → POST /underwrite → QUALIFIED | REFUSED → last-mile authority elsewhere`

Why this matters:

- sponsor-native agent-to-agent infrastructure
- useful without Alpha Scout's own UI
- avoids collision with Alpha Scanner / Risk Manager
- can be adopted in shadow mode before anyone delegates custody

### WS-02 — Versioned policy as a real executable contract

`AS-AUTHORITY-V1` is now backed by a single canonical policy manifest rather than thresholds duplicated across files.

The same manifest drives:

- Evidence Gate score thresholds
- critical UNKNOWN vetoes
- passport freshness
- last-mile freshness/score checks
- public `/authority-policy`

This closes a subtle audit gap: a receipt cannot claim to be replayable if the thresholds associated with its version are ambiguous.

### WS-03 — Evidence source ledger

An underwriting decision carries provenance, not only values.

Current source classes:

- `solana-pump-transaction`
- `jupiter-price-v3`
- `solana-owner-concentration`

Where available, the runtime preserves:

- observation timestamp
- transaction signature
- Pump block time
- Solana slot
- Jupiter `blockId`

This gives a judge or downstream agent a compact chain of **what source said what, and when**.

### WS-04 — Durable decision lineage

Cross-agent underwriting is now stored in `underwriting_decisions` rather than treated as ephemeral telemetry.

Each durable entry has:

- mint + launch signature
- policy version
- replay key
- state
- score
- observed evidence
- unknowns / reasons / blockers
- source ledger
- freshness expiry
- optional `supersedesReplayKey`

This creates a reusable evidence history even if no trade ever occurs.

### WS-05 — Re-underwriting, not hindsight editing

`POST /reunderwrite` accepts only a previous replay key.

The server loads the original mint + launch signature itself, refreshes the evidence, applies the current versioned policy and produces a lineage diff:

- policy changed?
- state changed?
- score delta
- unknowns resolved / added
- blockers resolved / added
- old and new replay keys

A caller cannot supply a new token while claiming continuity with the old decision.

Important semantics:

**A changed decision means the evidence/policy changed. It does not prove the earlier decision was wrong.**

### WS-06 — Shadow underwriting

Alpha Scout can be used with **zero value movement**.

An external agent can measure what Alpha Scout would reject/qualify before enabling any live execution delegation. This lowers adoption risk and creates a judge-friendly integration path:

`candidate → underwriting → receipt → no custody → no trade required`

This is strategically useful because it produces real product evidence even before live capital is entrusted to the system.

### WS-07 — Honest non-financial adoption metrics

`GET /authority-stats` exposes only request activity:

- underwriting decisions
- qualified decisions
- refused decisions
- lineage reruns

The response explicitly says:

- request counts are **not unique agents/users**
- request counts are **not trading volume**
- request counts are **not realised performance**

This allows traction to begin accumulating without converting API calls into fake market success.

### WS-08 — Machine-readable integration surface

`GET /authority-openapi` publishes the authority service contract for external agents/tooling.

Together with the ClawPump/Hermes `Evidence Authority` skill, this turns the differentiation into an integration primitive rather than a landing-page claim.

### WS-09 — $ANSEM-funded underwriting

Official ClawPump billing supports ANSEM deposits for agent/model usage. The planned live demo is:

`ANSEM-funded ClawPump/Hermes agent → Evidence Authority skill → /underwrite → real QUALIFIED/REFUSED decision`

This remains **PLANNED / NOT PROVED** until actual billing and run receipts are captured.

See `docs/ANSEM_AUTHORITY_DEMO.md`.

### WS-10 — Specialized x402 underwriting service

ClawPump/x402 itself is not white-space; other projects already use x402.

The narrower opportunity is a **paid Evidence Authority service** where another agent pays specifically for a replayable underwriting decision rather than paying for generic inference/trading.

This remains **READY TO ACTIVATE / NOT DEPLOYED** until a real paid service is configured and a settlement receipt exists.

See `docs/X402_AUTHORITY_SERVICE.md`.

## Rubric leverage

| White-space | Product | Traction | Novel Hermes tooling | Risk control | Judge proof |
|---|---:|---:|---:|---:|---:|
| cross-agent authority | high | medium | high | high | high |
| versioned policy | medium | low | high | high | high |
| source ledger | high | low | medium | high | high |
| decision lineage | high | medium | high | medium | high |
| shadow mode | high | high potential | high | high | high |
| honest authority stats | medium | high | medium | — | high |
| ANSEM-funded run | medium | high potential | high | — | high |
| paid x402 underwriting | high potential | high potential | high | — | high |

## Current truth boundary

P11.1 code does **not** prove:

- external-agent adoption
- unique users/agents
- realised trading performance
- on-chain Alpha Scout volume
- tokenization/eligibility completion
- ANSEM-funded usage
- paid x402 underwriting revenue
- live production deployment of these new P11.1 endpoints

These remain runtime/submission gates. The next visual pass stays blocked until at least one real external/shadow underwriting decision is captured.
