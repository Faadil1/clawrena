# Real Failure Evidence — why Alpha Scout must know when not to trade

Canonical rule: **Real failure > fake success.** A failure, rejection, degraded provider, stale receipt, or UNKNOWN result is evidence. It must remain visible rather than being rewritten as success.

This document anchors Alpha Scout in two real incidents. They are not backtests and are not presented as Alpha Scout trades. They are external evidence for product requirements.

## Case A — LIBRA collapse, February 2025

### 1. Signal positive / opportunity

Memecoin launches can create enormous attention, liquidity and short-lived price discovery. A launch agent therefore has a real opportunity to reduce reaction time and continuously inspect evidence that a human may miss.

### 2. Concrete negative event

Reuters reported that eight wallets linked to the creator of LIBRA withdrew about **$99 million** from the token's liquidity pool. Reuters also reported the token fell by more than **95%** after its surge. CoinDesk, citing Nansen on-chain analysis, reported that **86% of traders lost money, totalling $251 million**.

### 3. Observable impact

- concentrated creator-linked activity was economically material;
- most observed traders lost money;
- the collapse happened on the same kind of fast, attention-driven launch surface an autonomous trader is tempted to chase.

### 4. Design implication

`new mint + rising price` is not authority to trade. Ownership concentration, liquidity, provenance and unresolved unknowns must be allowed to veto execution. Related token accounts must be considered at the economic-owner level rather than treated as independent wallets.

### 5. Alpha Scout mitigation

- Pump launch detection requires official `create` / `create_v2` instruction discriminators;
- sampled token accounts are aggregated by economic owner and Pump custody is classified separately;
- unknown holder concentration or liquidity fails closed;
- deterministic evidence score gates entry;
- every reject remains a decision receipt;
- a strategy receipt cannot authorize execution indefinitely: P3 adds a short execution-evidence TTL.

### Sources

- Reuters, 2025-02-20: https://www.reuters.com/world/americas/crypto-worth-99-million-withdrawn-milei-backed-libra-token-researchers-say-2025-02-20/
- Reuters, 2025-02-21: https://www.reuters.com/technology/politician-linked-meme-coins-backfire-after-libra-scandal-2025-02-21/
- CoinDesk / Nansen, 2025-02-20: https://www.coindesk.com/markets/2025/02/20/libra-memecoin-fiasco-destroyed-usd251m-in-investor-wealth-research-shows

## Case B — Pump.fun privileged-access exploit, 16 May 2024

### 1. Signal positive / opportunity

Pump.fun is a high-throughput launch venue and therefore a valuable discovery source for a launch agent.

### 2. Concrete negative event

Pump.fun said a former employee used privileged access and flash loans in an exploit. The platform reported about **12,300 SOL / $1.9 million** was misappropriated. Trading was halted while the platform upgraded its contracts.

### 3. Observable impact

- approximately $1.9 million of liquidity was affected;
- trading was halted;
- the failure came from the venue/control plane, not from a token's ordinary market score.

### 4. Design implication

A token can look acceptable while the execution venue or provider is degraded. Asset evidence alone is insufficient. Execution authority must include provider health and evidence freshness.

### 5. Alpha Scout mitigation

P3 adds an explicit last-mile authority gate:

- a live ClawPump provider preflight must succeed;
- the linked remote agent must still exist;
- the decision receipt must be fresh;
- critical evidence cannot still be UNKNOWN;
- failure of any condition creates an on-chain-mode **REJECT** receipt instead of silently disappearing;
- prepared unsigned transactions remain `PREPARE`, never `EXECUTE`.

### Source

- The Block, 2024-05-16/17: https://www.theblock.co/news/regulation/2024-05-16-pump-fun-post-mortem-295029

## Counter-case requirement

The canonical demo is invalid if it only shows a successful path. It must show at least one real runtime negative path such as:

- missing liquidity -> `REJECT`;
- unknown economic-owner concentration -> `REJECT`;
- stale passing receipt -> execution authority `REJECT`;
- ClawPump preflight unavailable / linked agent missing -> execution authority `REJECT`;
- unsigned transaction -> `PREPARE`, verified volume unchanged;
- drawdown threshold reached -> agent `HALTED` and explicit acknowledgement required.

The repository fixture under `evidence/negative-path/` is test input only. It is deliberately labelled **NOT RUNTIME EVIDENCE**. Submission proof must be captured from a real run.
