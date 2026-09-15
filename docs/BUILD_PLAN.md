# ALPHA SCOUT — Winning Build Plan

> **Hackathon:** AnsemHack Clawrena · Solana  
> **Eligibility token deadline:** **20 Sep 2026 · 23:59 UTC**  
> **Track:** ClawPump × pump.fun + Overall Winner  
> **Product state:** evidence-first paper engine + safety-gated ClawPump execution bridge; no on-chain volume is called verified without a transaction signature **and** independently stored confirmation.

## North star

Alpha Scout is not "a bot that buys every fresh launch." It is an autonomous launch-investigation and execution system that can answer:

1. What did the agent observe?
2. What remains unknown?
3. Why did it execute, reject, or skip?
4. What risk budget was authorized?
5. Was execution paper, submitted/pending, merely prepared, or independently verified on-chain?

The winning loop is:

`DISCOVER → CLAIM → INVESTIGATE → QUALIFY → EXECUTE/REFUSE → PROVE`

## P0 — correctness and honesty

- [x] Wallet balance is watch-only and cannot create paper buying power.
- [x] Paper, pending on-chain and independently verified on-chain metrics are distinct.
- [x] Verified on-chain volume requires `executionMode=onchain`, a transaction signature **and** a stored confirmation slot.
- [x] Landing claims match what is actually built.
- [x] New-launch confidence is no longer a fixed invented number; evidence score is computed after live checks.
- [x] ClawPump v1 adapter exists for agent creation, swap quote and unsigned swap build.
- [x] ClawPump high-risk/unverified gates are never auto-acknowledged.

## P1 — runtime hardening

- [x] Atomic signal claim lease prevents duplicate concurrent entries.
- [x] Critical unknown liquidity/holder evidence fails closed.
- [x] Agent risk loop reduced from 15 minutes to 1 minute.
- [x] Scanner fallback reduced from 60 minutes to 5 minutes; Helius webhook remains preferred.
- [x] Drawdown halt requires explicit acknowledgement before restart.
- [x] CI adds integrity gates before typecheck/lint/build.

## P2 — judge proof plane

- [x] `decision_receipts` table records observations, unknowns, reasons, score, risk budget, execution mode, provider request id and optional transaction signature.
- [x] `/proof` renders recent receipts and separates paper, pending on-chain and verified on-chain volume.
- [x] ClawPump swap build records `PREPARE`, not `EXECUTE`, because the v1 endpoint returns an unsigned transaction.
- [ ] Add wallet signing/submit flow or a supported ClawPump server-side execution primitive, independently verify confirmation, then insert/update an on-chain trade row with signature + confirmation slot.
- [ ] Launch/tokenize project on ClawPump by 20 Sep 2026 23:59 UTC.
- [ ] Attach live project URL + reachable X account to hackathon entry.
- [ ] Capture at least one verified live execution receipt for the demo if risk budget permits.

## P3 — judge assurance / real failure

- [x] External real failures are stored separately from runtime proof.
- [x] Rubric → evidence matrix and public Claim Ledger are canonical.
- [x] Stored execution authority expires stale strategy evidence.
- [x] ClawPump exact linked-agent preflight can veto quote/build.
- [x] Provider/freshness failures persist a REJECT receipt.
- [x] Negative-path fixture is labelled non-runtime evidence.
- [x] Gate 6.75 demo/Q&A and TRACE 6.5 packet are present.
- [x] Canonical CURRENT/HANDOVER state is present.

## P4 — runtime / submission readiness

- [x] Cloudflare Pages assets-only configuration is versioned.
- [x] SPA deep-link fallback exists for `/proof` and other React Router paths.
- [x] Convex deploy-key build contract is documented.
- [x] Runtime capture script records reachable URLs, response hashes, latency and provider health without inventing success.
- [x] Eligibility requirements are tracked as external receipts.
- [x] `npm run gate:submission` blocks promotion while eligibility/runtime/canonical-run evidence is incomplete.
- [ ] Deploy branch preview to Cloudflare Pages + Convex preview.
- [ ] Run `npm run capture:runtime` against the actual public URLs.
- [ ] Capture one real live-market REJECT or UNKNOWN decision receipt.
- [ ] Verify all three official eligibility receipts.
- [ ] Run TRACE Gate 6.5 on the deployed desktop/mobile runtime.

## Environment boundary

Browser-visible:

```text
VITE_CONVEX_URL
```

Build/CI secret:

```text
CONVEX_DEPLOY_KEY
```

Convex backend secrets:

```text
HELIUS_API_KEY
HELIUS_WEBHOOK_SECRET
JUPITER_API_KEY        # optional
CLAWPUMP_API_KEY
```

Never expose `CONVEX_DEPLOY_KEY` or provider credentials through a `VITE_` variable.

## Deployment / promotion gate

A release is submission-ready only when:

- production dependency high/critical audit gate passes;
- `npm run verify:integrity` passes;
- `npm run test:logic` passes;
- `npm run typecheck` passes;
- `npm run lint` passes;
- `npm run build` passes;
- Convex target deploy/codegen succeeds;
- Cloudflare frontend and `/proof` are publicly reachable;
- `evidence/runtime/LATEST.json` comes from the deployed endpoints;
- a real negative-path receipt exists in the canonical run;
- eligibility receipt ledger is VERIFIED;
- verified on-chain volume remains zero for unsigned or unconfirmed activity;
- `npm run gate:submission` passes;
- human evidence review approves Gate 7 PROMOTE.
