# Rubric → Execution → Evidence Matrix

Source of truth checked 2026-09-15: https://clawpump.tech/ansemhack and https://clawpump.tech/docs

The official ClawPump × pump.fun award rewards **novel use / net-new tooling**, and for traders specifically **realised performance, risk control, and on-chain volume on Solana**. The overall winner additionally considers **product, traction, token design, and potential**. Platform-level scoring also surfaces builders onboarded, on-chain volume, attention, $ANSEM volume and early deployment.

| Rubric / question | Alpha Scout answer | Current proof | Gate before final submission |
|---|---|---|---|
| Product | Evidence-first launch investigation + execution authority, not a blind sniper | `/proof`, decision receipts, evidence gate | Public runtime + canonical run |
| Novel tooling | Refusal/proof plane + deterministic authority boundary around an agent runtime | `decision_receipts`, `executionAuthority.ts`, claim leases | Demonstrate as reusable ClawPump skill if time allows |
| Risk control | Fail-closed unknowns, economic-owner concentration, high-water drawdown, stale-evidence/provider kill switch | logic tests + receipts | Capture live reject + live halt/refusal receipt |
| Realised performance | No fabricated claim | claim ledger says **UNPROVEN** | Requires real executed/confirmed sample and realised PnL |
| On-chain volume | Only confirmed signature-backed rows count | public stats boundary | Complete sign/submit/confirm; otherwise claim 0 verified volume |
| Traction | No fabricated users or adoption | zeros remain zeros | Real users/agent runs/token activity only |
| Token design | Creator-fee-backed Agent Treasury observability, not fake governance | official 75/25 ClawPump mechanism + `treasuryStatus` + `/agent` treasury card | Tokenization receipt + show real ledger; automated treasury spending remains roadmap |
| Potential | Trust/evidence layer can generalize beyond pump launches | architecture + proof plane | Explain expansion without claiming it is already shipped |
| Attention | Build-in-public is explicitly rewarded | none yet | X entry receipt, clips/stream, reachable project account |
| Deploy early | Earlier live history is rewarded | runtime config ready, public capture pending | Deploy preview/runtime as soon as credentials exist |
| Stream Q1 team | Collaboration can be explained simply | team roster external | Lock 20–30 second founder/team answer |
| Stream Q2 product/problem/demo | Real failure → refusal → safe preparation → proof | P3 demo narrative | Record canonical real run |
| Stream Q3 market/GTM/traction | Agents need evidence/authority as capital becomes autonomous | competition snapshot | Distinguish thesis from current traction |
| Stream Q4 token/roadmap/vision | Token trading can create creator fees for the agent; Alpha Scout exposes the treasury honestly | `docs/TOKEN_UTILITY.md`, public earnings endpoint, treasury UI | Do not claim holder revenue share; launch receipt must exist before saying token is live |

## Eligibility gate — hard stop

All three are required by **20 Sep 2026 23:59 UTC**:

1. team registered;
2. project X post + follow requirement completed;
3. token live on an eligible launch path.

Repository code cannot prove these external actions. Store receipts/links in `evidence/eligibility/STATUS.json` when Opeyemi confirms them.

## Judge-performance rule

Every important sentence in the pitch must map to one of:

`SOURCE → OBSERVATION → DECISION → RECEIPT → DEMO SURFACE`

If the chain breaks, downgrade the wording or remove the claim.
