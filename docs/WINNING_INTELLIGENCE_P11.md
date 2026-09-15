# Winning Intelligence P11 — Post-Merge Requalification

Date: 2026-09-15
Base: upstream merge `171576483ff589dcf41c07f25a671134628ef073`

## Why this pass exists

PR #1 closed the original P0→P10 hardening/UI/runtime work. This pass deliberately reopens **product positioning and judge advantage**, not visual polish.

Winning Intelligence rule: start from the official rubric and map every important criterion to a feature, proof, demo scene or submission artifact. Complexity is admitted only when it materially improves sponsor alignment, judge clarity, demonstrable evidence, compliance, traction or score.

## Official judge surface

From https://clawpump.tech/ansemhack:

Overall Winner emphasizes:
- product
- traction
- token design
- how big this could get

ClawPump × pump.fun emphasizes:
- novel use of existing tech or net-new tooling on the Hermes harness
- for traders: realised performance, risk control and on-chain Solana volume

Cross-cutting signals:
- builders onboarded
- attention garnered
- $ANSEM volume / a net-new $ANSEM use case demonstrated live
- deploy early / accumulate visible history

Stream questions:
1. founder/team background
2. product/demo/problem
3. market opportunity/GTM/traction
4. token utility/roadmap/long-term vision

## Collision result

ClawPump already exposes Alpha Scanner, Meme Token Analyzer and Risk Manager community skills. Therefore “we scan launches and score risk” is not a winning category claim.

### Repositioning

Old category:

`autonomous launch trader / alpha scanner`

New category:

**Evidence Underwriter / Execution Authority for autonomous capital**

Memory sentence:

> Other agents find trades. Alpha Scout decides whether the evidence has earned permission for capital to move — and leaves a replayable receipt when it has not.

This is the product-level differentiator the next UI must express.

## P11 deltas admitted by complexity gate

### 1. Evidence Passport — BUILD

Every new decision receipt records:
- policy version
- deterministic replay key
- authority state
- explicit freshness expiry
- counterfactual conditions for reconsideration

Why admitted:
- makes claim-to-evidence linkage replayable
- strengthens judge verification
- separates Alpha Scout from generic risk scoring
- turns receipts into a reusable protocol primitive

### 2. Machine-readable authority policy — BUILD

Public `GET /authority-policy` describes:
- current policy version
- freshness window
- UNKNOWN semantics
- PAPER/PREPARE/PENDING/VERIFIED boundaries
- authority states
- critical unknowns

Why admitted:
- other agents can integrate without inferring UI semantics
- strengthens sponsor-native / agent-to-agent story
- improves technical ownership and Q&A defensibility

### 3. ClawPump/Hermes Evidence Authority skill — BUILD

Local package:
- `skills/evidence-authority/SKILL.md`
- `skills/evidence-authority/metadata.json`

Role:
- reusable authority layer complementary to Alpha Scanner, Meme Token Analyzer and Risk Manager
- preserves OBSERVED / INFERRED / UNKNOWN / PROVED distinctions
- never converts PREPARE into execution
- never fabricates replay IDs or on-chain proof

Why admitted:
- directly targets “net-new tooling on the Hermes harness”
- makes sponsor integration load-bearing rather than decorative

### 4. Counterfactual refusal — BUILD

Every reject/skip/prepare receipt can tell the operator what would need to change before authority is reconsidered.

Why admitted:
- turns refusal from defensive safety into useful product output
- improves demo clarity
- creates a stronger agent-operator loop

### 5. Competitive snapshot — BUILD

`docs/COMPETITIVE_INTELLIGENCE_2026-09-15.md`

Why admitted:
- prevents UI from optimizing toward a category already occupied by other applicants
- documents observed competitor strengths instead of relying on memory

## Rubric → capability → proof → demo

| Judge surface | P11 response | Proof | Demo moment | Status |
|---|---|---|---|---|
| Novel tooling / Hermes | Evidence Authority skill | repo skill package | import/use on linked ClawPump/Hermes agent | CODED, external import pending |
| Product | cross-agent execution authority | Evidence Passport + policy endpoint | signal reaches authority gate and is refused/authorized | CODED |
| Risk control | critical UNKNOWN veto + freshness | execution authority tests + receipts | stale/unknown evidence refuses | CODED |
| Judge verification | replay key + policy version | `/proof` + receipt fields | judge sees exact policy/replay identity | CODED |
| Traction | real users/agent calls/fees | live ledger | show real calls/usage | NOT YET |
| On-chain volume | independently confirmed trades only | tx sig + confirmation slot | verified trade receipt | NOT YET |
| Token design | creator-fee observability today; future proof budget only if built | Agent Treasury | show real token fee ledger after tokenization | PARTIAL |
| Attention | stream/X/distribution | external receipts | show reach/stream history | NOT YET |
| $ANSEM use | no defensible load-bearing use yet | none | none | NOT BUILT |

## Hidden spots found in this pass

### HS-11A — category collision

Risk: Alpha Scout sounds like capabilities ClawPump already distributes.

Response: reposition to execution authority; package it as a distinct reusable skill.

### HS-11B — receipts were not policy-replayable

Risk: if thresholds change, a historical receipt did not say which policy version created it.

Response: Evidence Passport with policy version + deterministic replay key.

### HS-11C — refusal was truthful but not operationally useful

Risk: a reject told the user why it failed but not what would need to change before reconsideration.

Response: counterfactual conditions stored with the receipt.

### HS-11D — sponsor integration remained product-local

Risk: ClawPump was an execution bridge, but Alpha Scout did not add reusable tooling back to the agent ecosystem.

Response: standalone Evidence Authority skill + machine-readable public policy.

### HS-11E — current README/runtime wording was stale

Risk: merged README still described the Vercel surface as a no-Convex review preview even though the live frontend is bound to `grandiose-poodle-700`.

Response: update README in this branch before next PR.

### HS-11F — leaderboard reality

Risk: engineering quality is not the current competitive bottleneck. Official analytics showed 154 tokenized entries and 85 generating fees; Alpha Scout was not visible by name at review time.

Response: tokenization/eligibility/live receipt/attention work remains above further cosmetic polishing.

## Not admitted in P11

These ideas were considered but rejected/deferred by the complexity gate:

- inventing a staking/yield model to imitate HyperBull
- copying SelfMade’s hardware reinvestment loop
- adding a synthetic $ANSEM mechanic only for bonus points
- building another alpha/market scanner
- adding speculative wash/bundle/honeypot classifiers without real evidence
- replacing deterministic authority with an LLM vote

## Gate result

P11 product differentiation can proceed.

The **next UI/UX pass must not begin from “trading dashboard” references**. It must begin from the category:

**Execution Authority / Evidence Underwriter / Proof-of-Authority workstation.**

Before final UI lock, capture at least one real live-market negative-path receipt and import the Evidence Authority skill into a real ClawPump/Hermes agent so the sponsor-native claim is demonstrable rather than repo-only.
