# Claim Ledger

This is the canonical boundary between what Alpha Scout may say publicly and what remains roadmap/unproven.

| Claim | Status | Evidence | Allowed wording |
|---|---|---|---|
| Discovers real Pump launches | BUILT | official Pump `create/create_v2` discriminator parsing | “Discovers verified Pump create transactions.” |
| Uses live market evidence | BUILT | Jupiter + Solana RPC paths | “Qualifies candidates from live observable data.” |
| Holder risk considers economic owners | BUILT, SAMPLED | owner aggregation of largest sampled accounts | “Aggregates sampled large token accounts by economic owner.” Never “full holder census.” |
| Unknown critical evidence blocks entry | BUILT | evidence gate + logic tests | “UNKNOWN is not PASS.” |
| Prevents duplicate concurrent entries | BUILT | `(agentId, signalId)` leases + run token | “Concurrent cycles cannot independently consume the same signal for one agent.” |
| Has real drawdown protection | BUILT for paper ledger | persisted equity high-water mark | “Paper risk engine halts on high-water drawdown.” |
| Records failures | BUILT | decision receipts include reject/skip/prepare | “Rejects stay in the evidence record.” |
| Venue/provider degradation can veto value movement | BUILT in P3 for ClawPump last mile | live agent-catalogue preflight + execution-authority gate | “ClawPump preparation fails closed when the provider/linked agent preflight is unhealthy.” |
| Evidence cannot be reused forever | BUILT in P3 | execution receipt TTL | “Execution requires fresh evidence.” |
| Executes verified on-chain trades | NOT YET COMPLETE | unsigned build only | Say “prepares safety-gated swaps”; do not say “executes on-chain” until sign/submit/confirm is built. |
| Verified on-chain volume | MEASUREMENT BUILT; CURRENT VALUE MAY BE ZERO | requires onchain mode + tx signature | Report the actual current number, including zero. |
| Realised trading performance | UNPROVEN | no confirmed live performance series | Do not claim alpha/performance. |
| “Finds alpha before it moves” | PROHIBITED UNTIL PROVEN | no realised benchmark | Use “evidence-first launch trader/investigator.” |
| Wash-trading detection | UNKNOWN / NOT IMPLEMENTED | shield reports UNKNOWN | Never claim classifier exists. |
| Bundle detection | UNKNOWN / NOT IMPLEMENTED | shield reports UNKNOWN | Never claim classifier exists. |
| Honeypot classifier | UNKNOWN / NOT IMPLEMENTED | shield reports UNKNOWN | Never claim classifier exists. |
| Perps / prediction-market execution | NOT BUILT | none | Roadmap only. |
| AI is the sole risk authority | FALSE BY DESIGN | deterministic gates own authority | Say “agent proposes/operates; deterministic evidence and risk gates authorize.” |
| User traction | UNPROVEN | none in repo | Do not invent users. |
| Token-holder revenue share/governance | NOT BUILT | none | Do not advertise. |

## Claim-lock gate

Before README, X post, demo narration or submission copy changes:

1. locate the row;
2. verify status/evidence still matches runtime;
3. use allowed wording;
4. if a claim is new, add it here before publishing it.
