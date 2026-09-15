# Alpha Scout

**Evidence Underwriter / Execution Authority for autonomous capital on Solana.**

Other agents can discover, analyze, recommend or trade. Alpha Scout sits between a market signal and value movement: it independently verifies launch provenance, builds an evidence record, keeps critical UNKNOWN states visible, applies deterministic policy gates, and records why a candidate was qualified, refused, skipped or only prepared.

The current local trading harness is explicitly **PAPER**. A separate ClawPump v1 bridge can create/link an agent, quote a swap, and build a safety-gated unsigned swap transaction. Nothing is counted as **verified on-chain volume** without on-chain execution, a transaction signature and an independently stored confirmation slot.

## Hackathon

- AnsemHack Clawrena
- Track: ClawPump × pump.fun + Overall Winner
- Token eligibility deadline: **20 Sep 2026 · 23:59 UTC**
- Winning Intelligence P11: `docs/WINNING_INTELLIGENCE_P11.md`
- Competitive snapshot: `docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md`

## Public live frontend

- **URL:** https://clawrena-alpha-scout-review.vercel.app
- **Convex:** `grandiose-poodle-700`
- **Identity:** approved forensic judge home + hawk-eye crest
- **Truth boundary:** the frontend is live and Convex-bound, but it is **not canonical runtime evidence** until the Convex HTTP health probe and a real live-market negative-path receipt are captured.
- **Canonical runtime target:** Cloudflare Pages + the same Convex backend, followed by `capture:runtime` and the live negative-path receipt.

## P11 — Proof-of-Authority primitive

New decision receipts carry an **Evidence Passport**:

- versioned policy (`AS-AUTHORITY-V1`)
- deterministic replay key
- policy state (`QUALIFIED`, `REFUSED`, `ABSTAINED`, `PREPARED`)
- evidence freshness expiry
- counterfactual conditions for reconsideration

`QUALIFIED` explicitly means **the evidence gate passed**, not that execution has been authorized. The separate last-mile risk/provider preflight still controls value movement.

The Convex HTTP site exposes two agent-facing contracts:

- `GET /authority-policy` — current machine-readable policy semantics
- `POST /underwrite` — independently verifies Pump launch provenance from a mint + launch signature, fetches live market/holder evidence, then returns `QUALIFIED` or `REFUSED` with an Evidence Passport. It never signs, submits or moves value.

The repo also includes a reusable ClawPump/Hermes skill:

- `skills/evidence-authority/SKILL.md`
- `skills/evidence-authority/metadata.json`

This is deliberately complementary to ClawPump's existing Alpha Scanner, Meme Token Analyzer and Risk Manager skills. Alpha Scout's category is **execution authority**, not another scanner.

## Core guarantees

- Watched wallet balance never becomes paper buying power.
- Unknown liquidity or holder concentration fails closed.
- Launch provenance requires an official Pump `create` / `create_v2` instruction; token-balance deltas are not launch proof.
- Signal execution uses an atomic lease to prevent duplicate concurrent entries.
- PAPER, QUALIFIED, PREPARED, pending on-chain activity and VERIFIED ONCHAIN remain distinct states/boundaries.
- ClawPump high-risk/unverified safety gates are not auto-bypassed.
- Every new decision creates a versioned receipt with observations, unknowns, reasons, risk budget and Evidence Passport metadata.
- A passing strategy receipt expires before last-mile execution; stale evidence cannot authorize value movement.
- ClawPump quote/build requires a live provider + linked-agent preflight. Failure is recorded as a REJECT receipt.
- Creator-fee economics are read from ClawPump's public ledger; missing/invalid values fail closed rather than becoming synthetic zeroes.
- Agent Treasury is creator-fee observability, **not** a holder revenue-share/governance promise.
- External incidents and test fixtures are explicitly separated from Alpha Scout runtime evidence.
- A refusal remains in the evidence record and includes what would need to change before the evidence is reconsidered.

## Stack

React 18 · Vite · Tailwind · Convex · Solana RPC/Helius · Jupiter · ClawPump Partner API v1

## Environment

See `.env.example`. Browser code receives only `VITE_CONVEX_URL`; deploy keys and provider credentials stay server/build-side.

If `VITE_CONVEX_URL` is absent, the frontend renders an explicit review/deployment state instead of crashing or fabricating live data. Supplying a real Convex URL switches the same build to the authenticated application.

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
- Convex HTTP `GET /authority-policy` — public machine-readable policy contract
- Convex HTTP `POST /underwrite` — live cross-agent evidence underwriting, no value movement

## $ANSEM demo path

ClawPump officially supports ANSEM deposits into agent billing wallets. P11 documents a **planned, not yet claimed** demo in `docs/ANSEM_AUTHORITY_DEMO.md`:

`ANSEM-funded ClawPump/Hermes agent → Evidence Authority skill → Alpha Scout /underwrite → real QUALIFIED/REFUSED result`

Do not describe Alpha Scout as “ANSEM-powered” until the billing/run receipts exist.

## Judge assurance

Canonical product cycle:

`RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A → RUNTIME → ELIGIBILITY → PROMOTE`

Start with:

- `state/CURRENT.yaml`
- `docs/WINNING_INTELLIGENCE_P11.md`
- `docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md`
- `docs/ANSEM_AUTHORITY_DEMO.md`
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

`evidence/canonical-run/STATUS.json` deliberately stays **PENDING_REAL_RUNTIME_CAPTURE** until a real runtime negative-path receipt exists. Test fixtures must never be presented as submission proof.

`npm run gate:submission` is the final machine-readable Gate 7 check; it is expected to fail until eligibility receipts, public runtime evidence and the canonical live run are actually captured.
