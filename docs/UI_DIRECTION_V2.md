# UI Direction V2 — Surveillance Desk

## Why the first direction was wrong

The previous dashboard expressed Alpha Scout as a conventional SaaS admin surface: stat cards, large empty cards, ambiguous icon-only navigation, and a detached proof CTA. That visual grammar understated the product thesis.

Alpha Scout is not primarily a portfolio dashboard. It is an **evidence-gated autonomous launch trader**. The interface should therefore make the control loop visible before the accounting layer:

`DISCOVER → INVESTIGATE → QUALIFY → EXECUTE / REFUSE → PROVE`

## Canonical visual direction

**Market surveillance desk × forensic evidence board × execution authority console.**

Light, operational and tactile — not dark/navy terminal cosplay, not generic fintech SaaS, and not decorative sci-fi.

### Domain-native primitives

1. **Launch Tape** — the live observation stream is the primary object above the fold.
2. **Evidence Gate** — the selected/latest decision exposes score, unknowns and refusal reasons.
3. **Authority Rail** — paper/on-chain boundary, agent state, risk caps and wallet authority are always visible.
4. **Receipt Ledger** — execution/proof records read like an audit trail, not activity-feed decoration.
5. **Compact accounting strip** — NAV/PnL/verified volume remain available but are supporting metrics, not the hero.

### Empty-state rule

An empty runtime must look **armed and waiting**, not unfinished. Empty states should expose which evidence channels are listening and which authority remains locked. No synthetic market rows are permitted.

### Motion grammar

- TARGET: scanner/listening indicator
- TRIGGER: mounted idle scanner / new observation
- MOTION: restrained sweep or brief pulse
- TIMING: slow ambient sweep; short data-arrival pulse
- EXIT/RETURN: settles immediately after update
- INPUT PARITY: no information depends on hover
- REDUCED MOTION: all sweeps/pulses disabled via `prefers-reduced-motion`

## Current implementation scope

V2 first pass changes the application shell and `/dashboard` only. It intentionally preserves Convex behavior, evidence semantics, execution boundaries and public claims. Once the direction is visually approved, the same grammar should extend to `/signals`, `/agent`, `/proof` and `/token`.
