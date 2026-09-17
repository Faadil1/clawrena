# Real failure evidence — why Alpha Scout must know when not to trade

**Real failure > fake success.** A refusal, degraded provider, stale receipt, or critical `UNKNOWN` is evidence. It stays visible instead of being rewritten as success.

These external incidents shaped Alpha Scout's product requirements. They are not Alpha Scout trades or backtests.

## LIBRA collapse — February 2025

Reuters reported that eight wallets linked to the creator of LIBRA withdrew about **$99 million** from the token's liquidity pool, and that the token fell by more than **95%** after its surge. CoinDesk, citing Nansen analysis, reported that **86% of traders lost money, totalling $251 million**.

### Design implication

A new mint and rising price are not authority to trade.

Ownership concentration, liquidity, provenance and unresolved unknowns must be allowed to veto progression. Related token accounts must be considered at the economic-owner level rather than treated as independent wallets.

### Alpha Scout response

- Pump launch detection requires official `create` / `create_v2` instruction discriminators.
- Token accounts are aggregated by economic owner where possible.
- Unknown holder concentration or liquidity fails closed.
- Deterministic evidence gates decide whether a candidate qualifies.
- Refusals remain stored as decision receipts.
- A passing receipt expires before last-mile execution.

Sources:

- Reuters, 2025-02-20: https://www.reuters.com/world/americas/crypto-worth-99-million-withdrawn-milei-backed-libra-token-researchers-say-2025-02-20/
- Reuters, 2025-02-21: https://www.reuters.com/technology/politician-linked-meme-coins-backfire-after-libra-scandal-2025-02-21/
- CoinDesk / Nansen, 2025-02-20: https://www.coindesk.com/markets/2025/02/20/libra-memecoin-fiasco-destroyed-usd251m-in-investor-wealth-research-shows

## Pump.fun privileged-access exploit — 16 May 2024

Pump.fun said a former employee used privileged access and flash loans in an exploit. The platform reported about **12,300 SOL / $1.9 million** was misappropriated, and trading was halted while contracts were upgraded.

### Design implication

A token can look acceptable while the execution venue or provider is degraded. Asset evidence alone is not enough.

### Alpha Scout response

- last-mile authority requires a live provider preflight;
- the linked external agent must still exist;
- the decision receipt must still be fresh;
- critical evidence cannot remain unknown;
- a failed last-mile condition creates an explicit reject rather than disappearing;
- an unsigned transaction remains `PREPARED`, not executed.

Source:

- The Block, 2024-05-16/17: https://www.theblock.co/news/regulation/2024-05-16-pump-fun-post-mortem-295029

## Negative-path requirement

A credible authority product must show a path where capital does **not** move.

Examples include:

- missing liquidity → `REFUSED`;
- unknown economic-owner concentration → `REFUSED`;
- stale passing receipt → last-mile refusal;
- provider unavailable / linked agent missing → last-mile refusal;
- unsigned transaction → `PREPARED`, verified volume unchanged;
- risk threshold reached → agent halted pending explicit recovery.

The fixture under `evidence/negative-path/` is test input only and is deliberately labeled **NOT RUNTIME EVIDENCE**. Public proof comes from real runtime receipts under `evidence/canonical-run/`.
