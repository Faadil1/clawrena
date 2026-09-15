# Alpha Scout

**Evidence-first autonomous launch trader for Solana.**

Alpha Scout discovers real pump.fun launches, qualifies them with live Jupiter/Solana evidence, applies deterministic risk controls, and records why it executed, rejected or skipped. The current local trading harness is explicitly **PAPER**. A separate ClawPump v1 bridge can create/link an agent, quote a swap, and build a safety-gated unsigned swap transaction. Nothing is counted as **verified on-chain volume** without an on-chain execution row, a transaction signature and an independently stored confirmation slot.

## Hackathon

- AnsemHack Clawrena
- Track: ClawPump × pump.fun + Overall Winner
- Token eligibility deadline: **20 Sep 2026 · 23:59 UTC**

## Core guarantees

- Watched wallet balance never becomes paper buying power.
- Unknown liquidity or holder concentration fails closed.
- Signal execution uses an atomic lease to prevent duplicate concurrent entries.
- PAPER, pending on-chain activity and VERIFIED ONCHAIN volume are separate metrics.
- ClawPump high-risk/unverified safety gates are not auto-bypassed.
- Every decision creates a receipt with observations, unknowns, reasons and risk budget.
- A passing strategy receipt expires before last-mile execution; stale evidence cannot authorize value movement.
- ClawPump quote/build requires a live provider + linked-agent preflight. Failure is recorded as a REJECT receipt.
- External incidents and test fixtures are explicitly separated from Alpha Scout runtime evidence.

## Stack

React 18 · Vite · Tailwind · Convex · Solana RPC/Helius · Jupiter · ClawPump Partner API v1

## Environment

See `.env.example`. Browser code receives only `VITE_CONVEX_URL`; deploy keys and provider credentials stay server/build-side.

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
- `/agent` — risk controls, watch-only wallet observation, ClawPump link
- `/signals` — real launch/signal feed
- `/proof` — judge-facing decision receipts, real-failure grounding and verified-volume boundary
- `/token/:mint?` — live token shield scan

## Judge assurance

Canonical product cycle:

`RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A → RUNTIME → ELIGIBILITY → PROMOTE`

Start with:

- `state/CURRENT.yaml`
- `docs/JUDGE_ASSURANCE_P3.md`
- `docs/REAL_FAILURE_EVIDENCE.md`
- `docs/RUBRIC_EVIDENCE_MATRIX.md`
- `docs/CLAIM_LEDGER.md`
- `docs/DEMO_QA_GATE_6_75.md`
- `docs/COLLISION_AGENT_ADVANTAGE.md`
- `docs/TRACE_GATE_6_5.md`
- `docs/P4_RUNTIME_SUBMISSION.md`
- `docs/DEPLOYMENT_CLOUDFLARE_CONVEX.md`
- `docs/GATE_7_PROMOTE.md`

## Runtime proof

After a real deployment, capture reachability evidence with:

```bash
PUBLIC_URL=https://<project>.pages.dev \
CONVEX_HTTP_URL=https://<deployment>.convex.site \
DEPLOYED_COMMIT_SHA=$(git rev-parse HEAD) \
npm run capture:runtime
```

`evidence/canonical-run/STATUS.json` deliberately stays **PENDING_REAL_RUNTIME_CAPTURE** until a real runtime negative-path receipt exists. Test fixtures must never be presented as submission proof.

`npm run gate:submission` is the final machine-readable Gate 7 check; it is expected to fail until eligibility receipts, public runtime evidence and the canonical live run are actually captured.
