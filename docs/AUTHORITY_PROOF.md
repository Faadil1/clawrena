# Authority proof

Alpha Scout's strongest public proof is a real negative-path authority decision, not a manufactured trade.

## What happened

A separate external agent called Alpha Scout against a real Pump launch. Alpha Scout independently re-fetched the evidence, applied the current policy, persisted the decision, and later recomputed the same Evidence Passport identifier.

Result:

- authority decision: `REFUSED`
- evidence score: `30/100`
- replay key: `AS1-51fff2964ef6c06d`
- replay consistency: `MATCH`
- critical unknown: `largest-holder concentration`
- blocker: `holder concentration unknown`
- additional blocker: `launch signal older than six hours`
- value movement: `false`

The canonical receipt is stored in `evidence/canonical-run/EXTERNAL-AGENT-AUTHORITY-2026-09-16.json`.

## Source lineage

The underwriting record preserves three evidence classes:

1. Pump/Solana launch provenance — observed;
2. Jupiter market evidence — observed;
3. Solana economic-owner concentration — unknown when the required observation could not be established.

The policy refuses when a critical unknown remains unresolved.

## Replay meaning

`MATCH` means the stored underwriting envelope deterministically recomputes to the same replay key under the recorded policy version.

It does **not** mean:

- cryptographic attestation;
- live market revalidation;
- verified caller identity;
- execution authorization;
- a transaction occurred.

## Caller attribution

The stored caller context records that the request came from an external Claude Code process. That metadata is declared context and is deliberately marked as **not cryptographic identity proof**.

## Value boundary

Underwriting itself never moves value.

A future qualified decision would still need a fresh receipt, live provider preflight, risk-budget checks, actual submission, transaction signature and independent confirmation before Alpha Scout could count activity as verified on-chain.

## Judge path

Open the public [`/proof`](https://f87de3e2.alpha-scout-clawrena.pages.dev/proof) surface and verify:

- the authority decision;
- evidence score;
- value movement;
- requester → underwrite → passport → consistency chain;
- blockers and unknowns;
- source ledger;
- replay result;
- truth-boundary statements.

Public runtime reachability is captured in `evidence/runtime/LATEST.json`. The earlier real negative-path authority receipt is stored in `evidence/canonical-run/AUTHORITY-REFUSAL-2026-09-16.json`.
