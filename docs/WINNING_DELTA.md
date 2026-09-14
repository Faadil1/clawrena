# Alpha Scout — Winning Delta P0→P2

This delta turns the existing launch scanner/paper harness into an evidence-first system designed to be judge-verifiable.

## Hidden spots closed

### 1. Wallet-import inflation

The previous flow compared a live wallet balance to remaining `cashSol`. After paper capital was invested, re-importing the same unchanged wallet could top `cashSol` back up, making represented capital exceed the observed wallet balance.

**Fix:** wallet reads now write only `observedWalletSol` + timestamp. They never touch `cashSol`, `investedSol`, or deposits.

### 2. Claim drift

Paper trades, unimplemented deep shield checks, perps and token-holder benefits were described as already live.

**Fix:** landing/dashboard distinguish PAPER, PREPARED and VERIFIED ONCHAIN. Unknown checks remain unknown.

### 3. Weak alpha semantics

A new launch previously entered with fixed confidence after only minimal gates.

**Fix:** `evaluateLaunchEvidence()` scores only live price, liquidity, holder concentration, freshness and optional bounded momentum. Critical unknowns block entry.

### 4. Duplicate-entry race

`actedOn` was set only after position creation, so concurrent cycles could race.

**Fix:** `claimSignal` is an atomic lease acquired before decision/execution; stale leases expire.

### 5. Proof plane

Every entry decision now emits a structured receipt with OBSERVED / UNKNOWN / REASONS / risk budget / execution mode.

### 6. ClawPump integration

The bridge uses the official Partner API v1:

- `POST /agents`
- `POST /swap/quote`
- `POST /swap/execute`

`/swap/execute` is treated as **transaction preparation**, because it returns an unsigned transaction. Alpha Scout does not mark or count it as executed until signature and independent confirmation are available.

## Recommended demo sequence

1. Open `/proof` and show zero verified volume.
2. Trigger a real scanner observation.
3. Run an agent cycle.
4. Show either a deterministic reject with unknown/blocker reasons or a paper entry with evidence score and risk budget.
5. Link the ClawPump agent.
6. Prepare a ClawPump quote/build for an evidence-qualified mint.
7. Show the PREPARE receipt and explain why it still does not count as volume.
8. If the signing path is completed, sign/submit, independently verify the Solana signature, then show verified volume increase.
