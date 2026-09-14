# Alpha Scout

**Evidence-first autonomous launch trader for Solana.**

Alpha Scout discovers real pump.fun launches, qualifies them with live Jupiter/Solana evidence, applies deterministic risk controls, and records why it executed, rejected or skipped. The current local trading harness is explicitly **PAPER**. A separate ClawPump v1 bridge can create/link an agent, quote a swap, and build a safety-gated unsigned swap transaction. Nothing is counted as on-chain execution without a transaction signature.

## Hackathon

- AnsemHack Clawrena
- Track: ClawPump × pump.fun + Overall Winner
- Token eligibility deadline: **20 Sep 2026 · 23:59 UTC**

## Core guarantees

- Watched wallet balance never becomes paper buying power.
- Unknown liquidity or holder concentration fails closed.
- Signal execution uses an atomic lease to prevent duplicate concurrent entries.
- Paper volume and verified on-chain volume are separate metrics.
- ClawPump high-risk/unverified safety gates are not auto-bypassed.
- Every decision creates a receipt with observations, unknowns, reasons and risk budget.

## Stack

React 18 · Vite · Tailwind · Convex · Solana RPC/Helius · Jupiter · ClawPump Partner API v1

## Environment

```bash
HELIUS_API_KEY=...
HELIUS_WEBHOOK_SECRET=...
JUPITER_API_KEY=...          # optional
CLAWPUMP_API_KEY=cpk_...     # server-side only
```

## Checks

```bash
npm ci
npm run verify:integrity
npm run typecheck
npm run lint
npm run build
```

## Product surfaces

- `/dashboard` — paper portfolio + separated execution records
- `/agent` — risk controls, watch-only wallet observation, ClawPump link
- `/signals` — real launch/signal feed
- `/proof` — judge-facing decision receipts and verified-volume boundary
- `/token/:mint?` — live token shield scan

See `docs/BUILD_PLAN.md` and `docs/WINNING_DELTA.md` for the current canonical state.
