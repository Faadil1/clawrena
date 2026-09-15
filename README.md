# Alpha Scout

**Evidence-first autonomous launch trader for Solana.**

Alpha Scout discovers real pump.fun launches, qualifies them with live Jupiter/Solana evidence, applies deterministic risk controls, and records why it executed, rejected or skipped. The current local trading harness is explicitly **PAPER**. A separate ClawPump v1 bridge can create/link an agent, quote a swap, and build a safety-gated unsigned swap transaction. Nothing is counted as **verified on-chain volume** without an on-chain execution row, a transaction signature and an independently stored confirmation slot.

## Hackathon

- AnsemHack Clawrena
- Track: ClawPump × pump.fun + Overall Winner
- Token eligibility deadline: **20 Sep 2026 · 23:59 UTC**

## Public review preview

- **Review URL:** https://clawrena-alpha-scout-review.vercel.app
- **Source:** `winning-delta-p0-p2` / PR #1
- **CI:** upstream run #18 passed security, integrity, logic, typecheck, lint and build
- **Truth boundary:** this public URL is deliberately a **review preview** while Convex is not connected. It is not canonical runtime evidence and does not claim live market activity, eligibility, tokenization or on-chain execution.
- **Canonical runtime target:** Cloudflare Pages + a real Convex deployment, followed by `capture:runtime` and a live negative-path receipt.

## Core guarantees

- Watched wallet balance never becomes paper buying power.
- Unknown liquidity or holder concentration fails closed.
- Signal execution uses an atomic lease to prevent duplicate concurrent entries.
- PAPER, pending on-chain activity and VERIFIED ONCHAIN volume are separate metrics.
- ClawPump high-risk/unverified safety gates are not auto-bypassed.
- Every decision creates a receipt with observations, unknowns, reasons and risk budget.
- A passing strategy receipt expires before last-mile execution; stale evidence cannot authorize value movement.
- ClawPump quote/build requires a live provider + linked-agent preflight. Failure is recorded as a REJECT receipt.
- Creator-fee economics are read from ClawPump's public ledger; missing/invalid values fail closed rather than becoming synthetic zeroes.
- Agent Treasury is creator-fee observability, **not** a holder revenue-share/governance promise.
- External incidents and test fixtures are explicitly separated from Alpha Scout runtime evidence.

## Stack

React 18 · Vite · Tailwind · Convex · Solana RPC/Helius · Jupiter · ClawPump Partner API v1

## Environment

See `.env.example`. Browser code receives only `VITE_CONVEX_URL`; deploy keys and provider credentials stay server/build-side.

If `VITE_CONVEX_URL` is absent, the frontend now renders an explicit review/deployment state instead of crashing or fabricating live data. Supplying a real Convex URL switches the same build to the authenticated application.

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
- `docs/TOKEN_UTILITY.md`
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

`evidence/runtime/REVIEW_PREVIEW.json` records the public review-preview deployment separately from canonical runtime evidence.

`evidence/canonical-run/STATUS.json` deliberately stays **PENDING_REAL_RUNTIME_CAPTURE** until a real runtime negative-path receipt exists. Test fixtures must never be presented as submission proof.

`npm run gate:submission` is the final machine-readable Gate 7 check; it is expected to fail until eligibility receipts, public runtime evidence and the canonical live run are actually captured.
