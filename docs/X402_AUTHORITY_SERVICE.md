# x402 Evidence Authority Service

Status: **READY TO ACTIVATE / NOT DEPLOYED / NO REVENUE CLAIM**

ClawPump supports x402-backed public agent services. x402 by itself is not differentiated in Clawrena; projects already use it. The narrower Alpha Scout opportunity is to sell a specific agentic primitive: **independent evidence underwriting before autonomous capital moves**.

Official references:

- https://clawpump.tech/docs
- https://clawpump.tech/developers

## Service thesis

A downstream agent should be able to pay for a decision that is useful even when the result is `REFUSED`.

Proposed paid product:

`x402 payment → Evidence Authority agent → Alpha Scout /underwrite → durable Evidence Passport → QUALIFIED | REFUSED`

The paid unit is **underwriting**, not a promise of profit, a trade signal, or access to guaranteed execution.

## What can be sold honestly

- independent Pump launch provenance verification
- live evidence refresh
- versioned deterministic policy application
- source ledger
- Evidence Passport
- counterfactual refusal conditions
- later `/reunderwrite` lineage check

## What must never be sold/claimed

- guaranteed alpha
- guaranteed fraud/rug detection
- guaranteed execution
- guaranteed profitability
- fake holder revenue share
- fake realised performance
- PREPARED as executed
- request counts as users or trading volume

## Suggested initial x402 service

Name:

**Alpha Scout Evidence Underwrite**

Input:

```json
{
  "tokenMint": "<solana-mint>",
  "launchSignature": "<pump-create-transaction-signature>"
}
```

Output:

- policy version
- replay key
- `QUALIFIED` or `REFUSED`
- source ledger
- score
- unknowns
- blockers
- counterfactuals
- freshness expiry
- `valueMovement: false`

## Activation proof gate

Do not describe this as a paid service until all are captured:

1. real ClawPump agent/service configured with x402 pricing;
2. real external/public service endpoint;
3. HTTP 402/payment quote evidence;
4. real settlement/payment evidence;
5. agent run actually invokes Alpha Scout Evidence Authority;
6. durable Alpha Scout underwriting decision exists;
7. payment/request/decision identifiers are reconciled in an evidence bundle.

After these seven items exist, create `evidence/x402/` receipts and update the claim ledger.

## Strategic advantage

A paid refusal is meaningful. The service succeeds when it prevents unjustified progression as well as when evidence qualifies. That makes revenue/activity less dependent on manufacturing trades for a demo.

## Complexity gate

Do **not** build custom settlement infrastructure inside Alpha Scout while ClawPump already provides the x402 service layer. Alpha Scout should own the evidence policy, receipts and lineage; ClawPump should remain the payment/agent-service rail unless a concrete platform limitation is proven.
