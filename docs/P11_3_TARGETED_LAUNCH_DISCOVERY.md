# P11.3 — Targeted Pump Launch Discovery

Runtime evidence on 2026-09-15 showed that scanning 300 recent transactions touching the entire Pump program still returned zero verified `create` / `create_v2` instructions. This is not evidence that no launches occurred; the program address is dominated by buy/sell and other traffic.

## Remediation

Use the Pump mint-authority PDA as the primary discovery address:

`TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM`

Official Pump documentation defines the create/create_v2 `mint_authority` account from seed `[b"mint-authority"]` under the Pump program. The derived mainnet PDA above is a stable protocol account used in token creation transactions.

Discovery order:

1. Query recent signatures that reference the mint-authority PDA.
2. Strictly re-fetch every candidate transaction.
3. Accept only transactions containing the official Pump program plus the exact `create` or `create_v2` discriminator.
4. Resolve both top-level and inner/CPI instructions.
5. If the targeted source returns no verified launch, fall back to bounded Pump-program history scanning.
6. Never treat the presence of the mint-authority account alone as proof of launch.

## Truth boundary

The mint-authority PDA is a **candidate-source optimization**, not launch authority. The transaction parser remains authoritative.

A candidate is still rejected unless:

- program id = Pump program,
- instruction discriminator = official `create` or `create_v2`,
- mint account parses as a valid Solana address.

This change improves recall without weakening provenance.
