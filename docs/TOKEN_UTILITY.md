# Token Utility — Agent Treasury, Not Fake Holder Benefits

Status: **P5 BUILT FOR OBSERVABILITY · TOKEN LAUNCH STILL EXTERNAL/PENDING**

Official source: https://clawpump.tech/docs

## Mechanical truth

ClawPump documents the pump.fun creator-fee split as:

- **75% → agent creator / registered payout wallet**
- **25% → ClawPump platform treasury**

ClawPump also exposes a public read-only fee ledger:

`GET https://clawpump.tech/api/fees/earnings?agentId=<agent-id>`

with `totalEarned`, `totalSent`, `totalPending`, `totalHeld`, and recent distributions.

## What Alpha Scout now builds on top

P5 adds **Agent Treasury observability**. For the linked ClawPump agent, Alpha Scout can read the public creator-fee ledger and show the actual economic state — including an honest zero.

The judge-facing mechanism is therefore:

`TOKEN TRADING → CLAWPUMP CREATOR FEES → AGENT PAYOUT/TREASURY → OBSERVABLE ECONOMIC RECEIPT`

That is a real platform mechanism plus a real product surface, not a hypothetical governance slide.

## Current utility boundary

### BUILT / allowed wording

- “Alpha Scout observes the linked agent's ClawPump creator-fee treasury.”
- “ClawPump documents a 75% creator share for token trading fees.”
- “Token activity can produce an observable operating treasury for the linked agent.”
- “The UI reports earned, sent, pending and held creator fees from the public ledger.”

### NOT BUILT / prohibited wording

- holders receive the 75% creator share;
- holder revenue sharing;
- governance rights;
- buybacks/burns;
- guaranteed yield or appreciation;
- creator fees are automatically spent on data, inference or trading;
- the Alpha Scout token is live before the actual tokenization receipt exists.

## Bounded roadmap

A later version may give the agent an explicit, auditable treasury spending policy for approved operating costs such as data/inference or x402 services. That remains **ROADMAP** until a real spend authority, cap, receipt and accounting path are implemented.

The treasury must never silently become paper trading capital. Economic fee observations and trading capital remain separate ledgers.

## Demo scene

1. Open `/agent`.
2. Show the linked ClawPump agent id.
3. Click **Observe creator fees**.
4. Show the actual fee ledger, even if all values are zero.
5. State: “This is creator/agent treasury evidence. We are not promising holder revenue share.”
6. Return to `/proof` to show that economic incentives still do not bypass evidence/risk authority.

## Judge answer

**Why does the token exist?**

The token is not decorative points or a fabricated governance layer. On ClawPump/pump.fun, trading activity can create creator fees for the agent. Alpha Scout exposes that treasury as evidence. The next bounded step is to let the agent spend only from an explicit operating policy with receipts; that automated spending is not claimed today.
