# ALPHA SCOUT — Winning Build Plan

> **Hackathon:** AnsemHack Clawrena · Solana  
> **Eligibility token deadline:** **20 Sep 2026 · 23:59 UTC**  
> **Track:** ClawPump × pump.fun + Overall Winner  
> **Product state:** evidence-first paper engine + safety-gated ClawPump execution bridge; no on-chain volume is claimed without a confirmed transaction signature.

## North star

Alpha Scout is not "a bot that buys every fresh launch." It is an autonomous launch-investigation and execution system that can answer:

1. What did the agent observe?
2. What remains unknown?
3. Why did it execute, reject, or skip?
4. What risk budget was authorized?
5. Was execution paper, merely prepared, or independently verified on-chain?

The winning loop is:

`DISCOVER → CLAIM → INVESTIGATE → QUALIFY → EXECUTE/REFUSE → PROVE`

## P0 — correctness and honesty

- [x] Wallet balance is watch-only and cannot create paper buying power.
- [x] Paper vs on-chain execution is explicit in schema and metrics.
- [x] Verified on-chain volume requires `executionMode=onchain` **and** a transaction signature.
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
- [x] `/proof` renders recent receipts and separates paper from verified on-chain volume.
- [x] ClawPump swap build records `PREPARE`, not `EXECUTE`, because the v1 endpoint returns an unsigned transaction.
- [ ] Add wallet signing/submit flow or a supported ClawPump server-side execution primitive, then independently verify the Solana signature before inserting an on-chain trade row.
- [ ] Launch/tokenize project on ClawPump by 20 Sep 2026 23:59 UTC.
- [ ] Attach live project URL + reachable X account to hackathon entry.
- [ ] Capture at least one verified live execution receipt for the demo if risk budget permits.

## Required environment variables

```bash
HELIUS_API_KEY=...
HELIUS_WEBHOOK_SECRET=...
JUPITER_API_KEY=...          # optional higher limits
CLAWPUMP_API_KEY=cpk_...     # server-side only
```

Never expose `CLAWPUMP_API_KEY` to Vite/client code.

## Deployment gate

A release is submission-ready only when:

- `npm run verify:integrity` passes
- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes
- Convex Cloud deploy/codegen succeeds
- `/proof` renders real receipts
- verified on-chain volume remains zero unless a confirmed signature exists
