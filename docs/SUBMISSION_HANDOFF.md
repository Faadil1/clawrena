# Alpha Scout — Submission Handoff

This document is the public-safe handoff for the final AnsemHack / ClawPump submission.
It intentionally excludes internal research, strategy notes, private handovers, personal data, and secrets.

## Project identity

- **Name:** Alpha Scout
- **Preferred ticker:** `$ASCOUT`
- **Repository:** https://github.com/Faadil1/clawrena
- **Validated public preview:** https://f87de3e2.alpha-scout-clawrena.pages.dev
- **Proof Room:** https://f87de3e2.alpha-scout-clawrena.pages.dev/proof
- **Authority policy:** https://grandiose-poodle-700.convex.site/authority-policy
- **Authority OpenAPI:** https://grandiose-poodle-700.convex.site/authority-openapi

### One-line submission copy

> Alpha Scout is an Evidence Underwriter and Execution Authority for autonomous capital on Solana: it independently verifies launch and market evidence, preserves critical UNKNOWNs, and refuses value movement when evidence is insufficient.

## What is already ready

- Judge-facing `/proof` workstation
- Live Convex authority backend
- Real negative-path underwriting receipt
- `REFUSED` authority decision
- Evidence score `30/100`
- Replay key `AS1-51fff2964ef6c06d`
- Replay consistency `MATCH`
- `valueMovement = false`
- Responsive desktop/mobile proof experience
- Reduced-motion support
- Submission-ready public repository
- Judge video package generated separately from the public repo

## Truth boundaries to preserve

Do not weaken these in the submission copy, X post, demo, or token page:

- `OBSERVED ≠ INFERRED`
- `UNKNOWN ≠ PASS`
- `QUALIFIED ≠ AUTHORIZED`
- `PREPARED ≠ SUBMITTED`
- `SUBMITTED ≠ VERIFIED ONCHAIN`
- `REPLAY MATCH ≠ CRYPTOGRAPHIC ATTESTATION`
- caller metadata ≠ verified identity
- request activity ≠ unique users, trading volume, or realised performance

The current trading harness remains **PAPER**. Do not claim a live Alpha Scout token, verified on-chain trading volume, holder yield, buybacks, governance, or creator-fee distribution until there is a real receipt proving it.

## Opeyemi — external submission responsibilities

Please own the external eligibility/account side with credentials you control. Do not depend on another person's login, lost session, or private account.

1. Create or control the required ClawPump / AnsemHack account.
2. Register **Alpha Scout** for the event.
3. Preserve `$ASCOUT` if the platform allows it. If an existing registration or ticker conflict blocks it, report the exact platform state instead of silently changing project identity.
4. Create/control the X account used for the entry.
5. Publish the official AnsemHack/ClawPump entry post and tag `@clawpumptech`.
6. Follow `@clawpumptech` from the same account used for the entry.
7. Tokenize Alpha Scout through ClawPump only when the launch details and cost are accepted.
8. Return the durable receipts listed below before final submission.

### Receipts to return

- AnsemHack / ClawPump entry URL
- X post URL
- X handle used for the submission
- confirmation that the submission account follows `@clawpumptech`
- ClawPump token page URL
- token mint address
- launch transaction signature
- any final submission URL / confirmation page

Do not mark an item complete from a screenshot alone when a durable URL, mint, or transaction signature exists.

## Video package

The final media is intentionally kept out of the public Git repository to avoid repository bloat.
The project owner will provide these deliverables separately:

- `alpha-scout-judge-demo-remotion.mp4` — primary judge video
- `alpha-scout-proof-tour-hyperframes.mp4` — real Proof Room walkthrough
- `alpha-scout-clean-browser-recording.mp4` — clean product recording
- `alpha-scout-captions.srt`
- `alpha-scout-captions.json`
- `alpha-scout-voiceover-ai33.mp3`
- thumbnail / proof still

Use the **Remotion judge demo** as the primary submission video unless the submission form explicitly asks for a raw product walkthrough.

## Final repo sync

If your working repository is `opeblow/clawrena`, sync it by fast-forward from the submission-ready upstream:

```bash
git remote add faadil https://github.com/Faadil1/clawrena.git  # skip if already present
git fetch faadil
git checkout master
git merge --ff-only faadil/master
git push origin master
```

Do **not** restore removed internal research, Winning Intelligence material, private handovers, local evidence scratch files, or personal/work data.

## Local verification before submission

```bash
npm ci
npm run verify:integrity
npm run test:logic
npm run typecheck
npm run lint
npm run build
```

Then smoke-test:

- `/` loads successfully
- `/proof` loads successfully
- Proof Room resolves the stored receipt
- `REFUSED` is visible
- `30/100` is visible
- replay result shows `MATCH`
- value movement remains `NONE` / `false`

## Submission copy guardrails

Safe claims:

- real Pump launch evidence was underwritten
- the authority decision was `REFUSED`
- the Evidence Passport is stored and replayable
- the replay key recomputes to `MATCH`
- no value moved for the canonical refusal
- the caller context is declared, not cryptographically proven

Do not claim:

- guaranteed profitability
- autonomous live trading already occurred
- verified on-chain volume without signature + independent confirmation
- a live token before the tokenization receipt exists
- creator-fee revenue as holder yield
- replay consistency as cryptographic identity proof

## Final submission checklist

- [ ] Repo synced to the current public `master`
- [ ] Live/preview URL placed in the submission form
- [ ] Proof Room URL included where judges can find it quickly
- [ ] Primary judge video uploaded
- [ ] Registration receipt captured
- [ ] X entry post published
- [ ] `@clawpumptech` followed
- [ ] Tokenization receipt captured
- [ ] Token mint captured
- [ ] Launch transaction signature captured
- [ ] Final submission confirmation captured
- [ ] No secret, API key, personal file path, internal research, or private work data added to the repo

If any hard receipt is missing, keep that item explicitly incomplete rather than inferring success.
