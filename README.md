# Alpha Scout

**Evidence Underwriter / Execution Authority for autonomous capital on Solana.**

Other agents can discover, analyze, recommend or trade. Alpha Scout sits between a market signal and value movement: it independently verifies launch provenance, builds an evidence record, keeps critical UNKNOWN states visible, applies a versioned deterministic policy, and records why a candidate was qualified, refused, skipped or only prepared.

The current local trading harness is explicitly **PAPER**. A separate ClawPump v1 bridge can create/link an agent, quote a swap, and build a safety-gated unsigned swap transaction. Nothing is counted as **verified on-chain volume** without on-chain execution, a transaction signature and an independently stored confirmation slot.

## Hackathon

- AnsemHack Clawrena
- Track: ClawPump × pump.fun + Overall Winner
- Token eligibility deadline: **20 Sep 2026 · 23:59 UTC**
- Winning Intelligence P11: `docs/WINNING_INTELLIGENCE_P11.md`
- P11.1 white-space: `docs/WHITE_SPACE_P11_1.md`
- Competitive snapshot: `docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md`

## Public live frontend

- **URL:** https://clawrena-alpha-scout-review.vercel.app
- **Convex:** `grandiose-poodle-700`
- **Truth boundary:** this existing frontend is live and Convex-bound, but the new P11.1 authority-network endpoints are **not production proof until separately deployed and probed**.
- **Canonical runtime target:** Cloudflare Pages + the same Convex backend, followed by runtime capture and a real live-market negative-path receipt.

## P11.1 — Authority network

Alpha Scout now treats evidence authority as an agent-to-agent product primitive rather than a trading-dashboard feature.

### Evidence Passport

New decisions carry:

- policy version (`AS-AUTHORITY-V1`)
- deterministic replay key
- policy state (`QUALIFIED`, `REFUSED`, `ABSTAINED`, `PREPARED`)
- evidence freshness expiry
- counterfactual conditions for reconsideration

`QUALIFIED` means **the Evidence Gate passed**, not that execution has been authorized. Last-mile provider/risk checks still control value movement.

### Versioned policy contract

Core thresholds, scoring bands, critical UNKNOWN states and freshness are centralized in `convex/lib/evidencePolicy.ts`. The same policy drives Evidence Gate scoring, Evidence Passports, last-mile authority and the public policy contract.

### Source ledger

Underwriting records where evidence came from and, when available, when it was observed:

- Solana Pump transaction provenance
- Jupiter Price V3 market evidence
- Solana economic-owner concentration
- transaction/block times, Solana slots and Jupiter block IDs where available

### Durable decision lineage

Cross-agent decisions are stored in `underwriting_decisions`. A later `/reunderwrite` call resolves the prior replay key server-side, refreshes the **same mint + launch signature**, and returns what changed rather than rewriting history.

### Shadow mode

Another agent can use Alpha Scout before delegating any custody:

`candidate → underwriting → QUALIFIED / REFUSED → durable receipt → zero value movement`

This allows real integration/adoption evidence without manufacturing trades.

## Agent-facing authority API

On the Convex HTTP site after P11.1 deployment:

- `GET /authority-policy` — current versioned policy + thresholds
- `GET /authority-openapi` — machine-readable integration contract
- `GET /authority-stats` — honest underwriting request activity; explicitly not unique users, volume or realised performance
- `POST /underwrite` — independently verifies Pump launch provenance + live market/holder evidence and persists a durable decision
- `POST /reunderwrite` — re-evaluates a server-stored prior decision and returns policy/evidence lineage

If `AUTHORITY_API_KEY` is configured server-side, `/underwrite` and `/reunderwrite` require `x-alpha-scout-key`. Never expose that key in browser code or prompts.

The repo also contains a reusable ClawPump/Hermes skill:

- `skills/evidence-authority/SKILL.md`
- `skills/evidence-authority/metadata.json`

This is deliberately complementary to existing discovery/analysis/risk skills. Alpha Scout's category is **execution authority**, not another scanner.

## Core guarantees

- Watched wallet balance never becomes paper buying power.
- Unknown liquidity or holder concentration fails closed.
- Launch provenance requires an official Pump `create` / `create_v2` instruction; token-balance deltas are not launch proof.
- Caller-provided scores are not underwriting authority; Alpha Scout independently re-fetches evidence.
- Signal execution uses an atomic lease to prevent duplicate concurrent entries.
- PAPER, QUALIFIED, PREPARED, pending on-chain activity and VERIFIED ONCHAIN remain distinct states/boundaries.
- ClawPump high-risk/unverified safety gates are not auto-bypassed.
- A passing receipt expires before last-mile execution; stale evidence cannot authorize value movement.
- Refusals remain in the record and say what evidence must change before reconsideration.
- Re-underwriting preserves old decisions and creates lineage rather than editing history.
- Public underwriting counts are request activity only — never unique users, trading volume or realised performance.
- Creator-fee economics come from ClawPump's public ledger; missing/invalid values fail closed rather than becoming synthetic zeroes.
- Agent Treasury is creator-fee observability, **not** a holder revenue-share/governance promise.

## Stack

React 18 · Vite · Tailwind · Convex · Solana RPC/Helius · Jupiter · ClawPump Partner API v1

## Checks

```bash
npm ci
npm run verify:integrity
npm run test:logic
npm run typecheck
npm run lint
npm run build
```

## Product surfaces

- `/dashboard` — paper portfolio + separated execution records
- `/agent` — risk controls, watch-only wallet observation, ClawPump link + observed Agent Treasury
- `/signals` — real launch/signal feed
- `/proof` — judge-facing decision receipts, Evidence Passports, real-failure grounding and verified-volume boundary
- `/token/:mint?` — live token shield scan

## Sponsor-native expansion

### $ANSEM

ClawPump officially supports ANSEM deposits into agent billing wallets. The planned, **not yet proved**, path is:

`ANSEM-funded ClawPump/Hermes agent → Evidence Authority skill → /underwrite → real QUALIFIED/REFUSED decision`

See `docs/ANSEM_AUTHORITY_DEMO.md`.

### x402

x402 itself is already used in the ecosystem, so Alpha Scout does not treat “uses x402” as differentiation. The prepared white-space is a specialized **paid Evidence Authority underwriting service**. It remains **READY TO ACTIVATE / NOT DEPLOYED / NO REVENUE CLAIM** until a real x402 settlement + authority receipt exist.

See `docs/X402_AUTHORITY_SERVICE.md`.

## Judge assurance

Canonical product cycle:

`RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A → RUNTIME → ELIGIBILITY → PROMOTE`

Start with:

- `state/CURRENT.yaml`
- `docs/WINNING_INTELLIGENCE_P11.md`
- `docs/WHITE_SPACE_P11_1.md`
- `docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md`
- `docs/ANSEM_AUTHORITY_DEMO.md`
- `docs/X402_AUTHORITY_SERVICE.md`
- `docs/JUDGE_ASSURANCE_P3.md`
- `docs/REAL_FAILURE_EVIDENCE.md`
- `docs/RUBRIC_EVIDENCE_MATRIX.md`
- `docs/CLAIM_LEDGER.md`
- `docs/GATE_7_PROMOTE.md`

`evidence/canonical-run/STATUS.json` deliberately stays **PENDING_REAL_RUNTIME_CAPTURE** until a real runtime negative-path receipt exists. Test fixtures must never be presented as submission proof.

`npm run gate:submission` remains the final machine-readable Gate 7 check and is expected to fail until eligibility receipts, public runtime evidence and the canonical live run are actually captured.
