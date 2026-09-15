# Gate 6.75 — Demo Narrative + Adversarial Q&A

## Memory sentence

**Alpha Scout is an autonomous launch trader that can prove why it traded — and, more importantly, why it refused.**

## Canonical demo sequence

Target: 3–5 minutes for an async video; expandable to the official 15-minute stream format.

1. **Pain, 20s** — show one sourced LIBRA fact: creator-linked liquidity withdrawal + broad trader losses. Do not dramatize beyond the source.
2. **Product thesis, 15s** — “new token” is not execution authority. Alpha Scout separates OBSERVED / UNKNOWN / DECISION / EXECUTION.
3. **Real discovery, 30s** — scanner resolves a Pump create transaction by official discriminator.
4. **Negative path, 45s** — choose a live candidate that genuinely lacks critical evidence, or intentionally allow a passing receipt to expire. Show `REJECT` and unchanged verified volume.
5. **Positive bounded path, 45s** — show a fresh candidate that passes the deterministic evidence gate and opens a PAPER position, or use a passing stored receipt for ClawPump quote/build.
6. **Execution authority, 45s** — live provider preflight + receipt TTL. Build unsigned swap. Show status `PREPARE`, with wallet signature and Solana confirmation still UNKNOWN.
7. **Proof, 30s** — `/proof`: negative receipt still present; paper/verified volumes separate.
8. **If live signing is complete, 30s** — sign, submit, independently confirm, then and only then show verified volume changing.
9. **Close, 15s** — “We do not make the agent sound safer than it is. The evidence boundary is the product.”

## Required canonical-run artifacts

- timestamp + deployed commit SHA;
- source launch signature;
- decision receipt id;
- reject/UNKNOWN receipt id;
- provider request id for PREPARE;
- tx signature + confirmation slot only if actual live execution occurs;
- screen recording link/hash;
- public runtime URL;
- no secrets.

`evidence/canonical-run/STATUS.json` remains PENDING until these are captured from reality.

## Adversarial Q&A

### “Why is this AI? Most safety decisions are deterministic.”
That is intentional. The agent can orchestrate research, objectives and actions, but capital authority should not depend on an LLM assertion. Deterministic evidence/risk gates are the authority boundary. The agent is load-bearing for operation; it is not allowed to self-certify risk.

### “Why not just use a cron and rules?”
For the current narrow launch loop, many safety checks should indeed be deterministic. The product advantage is the reusable agent workflow around discovery, investigation, evidence receipts, provider execution and future skills—not pretending a model is necessary for arithmetic. If the agent layer adds no demonstrable adaptive behavior by final demo, we should describe it honestly as agent-orchestrated rather than claim magical AI alpha.

### “Can a client send score=100 and force a swap?”
No. ClawPump quote/build requires a stored receipt belonging to the same local agent. P3 also requires that receipt to be fresh and the provider/linked agent to pass a live preflight.

### “What if Jupiter or Solana RPC is down?”
Critical market/holder evidence becomes unknown and entry fails closed. Missing data is not converted into a pass.

### “What if ClawPump is degraded after the strategy approved the token?”
P3 checks the live provider/linked-agent state immediately before quote/build. Failure creates a visible on-chain-mode rejection receipt.

### “What if the data was true two hours ago?”
A strategy receipt is not perpetual execution authority. P3 expires the execution receipt after a short TTL and requires fresh evidence.

### “Are wash trading, bundling and honeypots detected?”
Not yet. Those checks remain UNKNOWN. The claim ledger explicitly prohibits describing them as implemented classifiers.

### “What is your actual on-chain volume?”
Whatever the verified metric says at demo time, including zero. Alpha Scout only counts rows with on-chain mode and a transaction signature, and final live flow should additionally persist independent confirmation.

### “What proves this is different from other Clawrena traders?”
The crowded space already has many trader/agent projects, and Anima has adjacent risk/wallet/swap semantics. Alpha Scout's differentiation is the evidence/authority layer: structured refusal receipts, fresh-evidence execution authority, deterministic risk vetoes and an explicit distinction between recommendation, preparation and verified execution.

### “Does the LIBRA incident prove Alpha Scout would have prevented losses?”
No. It proves the failure mode is real. We use it to justify requirements. We do not claim a counterfactual win without a historical replay/backtest that uses data available at the time.

### “Does the Pump.fun 2024 exploit mean Pump.fun is unsafe today?”
No. It demonstrates that venue/control-plane failures are a real class of risk. The design implication is to include venue/provider health in execution authority rather than assume the venue can never degrade.

### “Why should judges care if the bot refuses?”
Because risk control is explicitly part of the trader rubric. A refusal backed by evidence is more valuable than fabricated volume or an unverified trade claim.
