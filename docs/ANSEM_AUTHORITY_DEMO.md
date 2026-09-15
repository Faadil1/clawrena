# $ANSEM-Funded Evidence Authority Demo

Status: **PLANNED / NOT YET DEMONSTRATED**

Official ClawPump documentation states that an agent billing wallet can be funded with SOL, USDC, CLAW or **ANSEM** and use those credits for model/agent requests. The Clawrena rubric separately gives bonus credit for a net-new $ANSEM use case demonstrated live.

Sources:
- https://clawpump.tech/guide
- https://clawpump.tech/ansemhack

## Thesis

Do not invent an $ANSEM staking/yield mechanic for Alpha Scout.

Use $ANSEM as the operating budget for **evidence underwriting**:

`ANSEM-funded ClawPump/Hermes agent → Evidence Authority skill → Alpha Scout /underwrite → QUALIFIED or REFUSED → downstream action only if last-mile gates pass`

This makes $ANSEM pay for a real agentic service: deciding whether evidence is good enough for autonomous capital to continue.

## Why this is stronger than decorative token utility

- $ANSEM is consumed through an official ClawPump billing path.
- the paid activity supports a load-bearing product function rather than a cosmetic badge.
- the result is independently inspectable as an Evidence Passport / underwriting response.
- a `REFUSED` result is still a successful service outcome; activity is not fabricated to make the demo look good.

## Required live proof before claiming this use case

1. A real ClawPump/Hermes agent with the Evidence Authority custom skill enabled.
2. Its billing wallet visibly funded with ANSEM.
3. A real agent request/run that invokes Alpha Scout underwriting.
4. Alpha Scout returns a real `QUALIFIED` or `REFUSED` decision against a verified Pump launch signature.
5. The agent's usage/billing history shows the ANSEM-funded request path.
6. Preserve screenshots/receipts/IDs in `evidence/ansem/`.

Until all six exist, submission wording must say **planned live demo**, not “ANSEM-powered” or “ANSEM-funded.”

## Demo script if proof is complete

> “Alpha Scout is the evidence underwriter between agents and capital. This Hermes agent is funded with ANSEM. It pays for the underwriting run, sends a real Pump launch to Alpha Scout, and receives a replayable policy verdict. Today the result is REFUSED because the evidence is incomplete. No trade is fabricated. $ANSEM funded a real decision that prevented unjustified capital movement.”

## Rejection criteria

Do not use this demo if:
- ANSEM funding cannot be proved,
- the custom skill was not actually active,
- the launch is a fixture rather than a real verified Pump create/create_v2 transaction,
- the response is hand-authored rather than returned by the runtime,
- or a downstream trade is claimed without signature + independent confirmation.
