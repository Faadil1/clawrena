# Gate 7 — PROMOTE checklist

Gate 7 is a **release authority gate**, not a confidence score. A single required blocker keeps the verdict at `NO_PROMOTE`.

## Product and build

- [x] P0 correctness / claim honesty
- [x] P1 runtime hardening
- [x] P2 proof plane
- [x] P3 judge assurance / real-failure grounding
- [x] Upstream CI green: security → integrity → logic → typecheck → lint → build
- [x] PAPER / PENDING ONCHAIN / VERIFIED ONCHAIN are distinct
- [x] verified on-chain metric requires signature **and** confirmation slot
- [x] critical UNKNOWN fails closed
- [x] stale execution authority fails closed
- [x] provider degradation can deny last-mile preparation

## P4 runtime/submission readiness

- [x] Cloudflare Pages SPA configuration
- [x] Convex deploy-key contract documented
- [x] runtime reachability capture script
- [x] eligibility receipt ledger
- [x] machine-readable submission gate
- [ ] public runtime captured from deployed endpoints
- [ ] real negative-path receipt captured from live market evidence
- [ ] canonical run evidence updated without synthetic proof

## External eligibility — hard blockers

Official source: `https://clawpump.tech/ansemhack`

Deadline: **2026-09-20 23:59 UTC**

- [ ] official team registration receipt VERIFIED
- [ ] X announcement receipt + reachable project account + @clawpumptech follow VERIFIED
- [ ] live ClawPump token / token URL / mint VERIFIED

Do not infer completion from a conversation or screenshot without storing the actual receipt/link.

## Competition / judge-facing proof

Current official scoring rewards product quality, traction/token design/potential for the overall award, plus observable builders onboarded, real on-chain volume, attention, $ANSEM usage and early deployment. The stream format is 15 minutes around team, product/demo/problem, market/GTM/traction, and token utility/roadmap.

- [ ] demo can explain the product in <30 seconds
- [ ] real failure → design implication → mitigation is visible
- [ ] one live refusal/UNKNOWN path is shown before any success path
- [ ] no alpha/performance claim without realised benchmark evidence
- [ ] Q&A packet survives “why AI?”, “why not rules?”, “what if provider fails?”, “what is actually on-chain?”
- [ ] token utility is concrete and not invented for judging

## On-chain execution

A verified live trade is strategically valuable but **not allowed to be fabricated**.

If live execution is attempted, require all of:

- fresh passing decision receipt;
- provider/agent preflight;
- explicit risk budget;
- actual submission;
- transaction signature;
- independent Solana confirmation slot;
- recorded receipt and provider request id.

Otherwise report `0 VERIFIED ONCHAIN` and keep `PREPARE`/`PENDING` truthful.

## Authority

Run:

```bash
npm run gate:submission
```

Only a PASS plus human review of the canonical evidence bundle may move the project to `PROMOTE`.
