# P4 — Runtime & Submission Readiness

P4 closes the gap between a green repository and a judge-verifiable public entry.

## Canonical cycle extension

`RUBRIC → PAIN → PROBLEM → DIFFERENTIATOR → EXECUTION → EVIDENCE → STORY → DEMO → Q&A → RUNTIME → ELIGIBILITY → PROMOTE`

P4 does **not** change the core trading thesis. It makes the existing P0–P3 claims deployable and auditable.

## Added gates

1. **Deployment Gate** — Cloudflare Pages + Convex have a reproducible configuration.
2. **Runtime Reachability Gate** — public frontend, `/proof`, and Convex health must be probed from the deployed runtime.
3. **Eligibility Receipt Gate** — registration, X/follow and tokenization are tracked as external receipts, never assumed.
4. **Canonical Negative Path Gate** — at least one refusal/UNKNOWN receipt must come from a real runtime observation.
5. **Promotion Gate** — `npm run gate:submission` stays red until hard blockers are actually verified.

## Truth boundary

The ClawPump Partner API currently builds an unsigned transaction for `/swap/execute`; Alpha Scout therefore keeps that REST path at `PREPARE`. ClawPump also exposes an MCP `swap_execute` tool capable of wallet execution, but hosted integration/signing authority must be proven in the target runtime before Alpha Scout may count it as execution.

No implementation path gets to bypass:

`fresh evidence → deterministic authority → value movement → signature → independent confirmation → VERIFIED`

## Evidence files

- `evidence/eligibility/STATUS.json`
- `evidence/runtime/LATEST.json`
- `evidence/canonical-run/STATUS.json`

These are intentionally separate. Eligibility is not runtime proof; runtime reachability is not a canonical negative-path receipt; a transaction signature without confirmation is not verified volume.
