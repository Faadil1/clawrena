# Token utility — Agent Treasury, not invented holder benefits

Alpha Scout treats token utility as an observable economic mechanism, not a reason to manufacture governance or yield claims.

## Mechanical truth

ClawPump documents the pump.fun creator-fee split as:

- **75% → agent creator / registered payout wallet**
- **25% → ClawPump platform treasury**

ClawPump also exposes a public read-only fee ledger:

`GET https://clawpump.tech/api/fees/earnings?agentId=<agent-id>`

with values such as `totalEarned`, `totalSent`, `totalPending`, `totalHeld`, and recent distributions.

## Alpha Scout behavior

Alpha Scout exposes **Agent Treasury observability** for a linked ClawPump agent.

The product can read the public creator-fee ledger and show the actual economic state, including an honest zero.

The judge-facing mechanism is:

`TOKEN ACTIVITY → CLAWPUMP CREATOR FEES → AGENT PAYOUT/TREASURY → OBSERVABLE ECONOMIC RECEIPT`

This treasury stays separate from PAPER trading capital and from execution authority.

## Allowed wording

- “Alpha Scout observes the linked agent's ClawPump creator-fee treasury.”
- “ClawPump documents a 75% creator share for token trading fees.”
- “Token activity can produce an observable operating treasury for the linked agent.”
- “The UI reports earned, sent, pending and held creator-fee state from the public ledger.”

## NOT BUILT / prohibited wording

- holders receive the 75% creator share;
- holder revenue sharing;
- governance rights;
- buybacks / burns;
- guaranteed yield or appreciation;
- creator fees are automatically spent on data, inference or trading;
- the Alpha Scout token is live before an actual tokenization receipt exists.

## Bounded roadmap

A later version may allow the agent to spend from an explicit operating policy for approved costs such as data, inference, or x402 services.

That would require an implemented spend authority, cap, receipt and accounting path. It is not claimed today.

## Product path

1. Open `/agent`.
2. Inspect the linked ClawPump agent id.
3. Observe creator fees.
4. Show the actual ledger state, even if all values are zero.
5. Return to `/proof` to show that economic incentives still do not bypass evidence or risk authority.

The central boundary remains: **creator-fee observability is not holder revenue share and is not permission to move trading capital.**
