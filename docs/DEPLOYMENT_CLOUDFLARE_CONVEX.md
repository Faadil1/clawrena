# Cloudflare Pages + Convex deployment runbook

This is the preferred public-runtime path for Alpha Scout. It keeps the Vite frontend on Cloudflare Pages while Convex remains the backend/runtime authority.

## 1. Cloudflare Pages project

Connect the repository/branch in Cloudflare Pages.

- Framework: Vite
- Production branch: `master` after Opeyemi merges the PR
- Preview branch: `winning-delta-p0-p2` while review is open
- Build output directory: `dist`
- Build command:

```bash
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

`wrangler.toml` is intentionally minimal and contains no secrets.

## 2. Required Cloudflare secret

Set only:

```text
CONVEX_DEPLOY_KEY=<deployment-scoped deploy key>
```

Use a **preview deploy key** for branch previews and the production deploy key only for the production branch. Never prefix secrets with `VITE_`.

## 3. Convex backend environment

Set these in the target Convex deployment, not in Cloudflare frontend variables:

```text
HELIUS_API_KEY
HELIUS_WEBHOOK_SECRET
JUPITER_API_KEY        # optional
CLAWPUMP_API_KEY
```

The browser only needs `VITE_CONVEX_URL`, which the Convex deploy command injects into the build.

## 4. SPA routing

`public/_redirects` keeps React Router routes such as `/proof` reachable on direct navigation. `public/_headers` adds conservative security headers without a CSP that could accidentally break Convex/Auth before browser validation.

## 5. Real runtime capture

After Cloudflare and Convex are reachable:

```bash
PUBLIC_URL=https://<project>.pages.dev \
CONVEX_HTTP_URL=https://<deployment>.convex.site \
DEPLOYED_COMMIT_SHA=$(git rev-parse HEAD) \
npm run capture:runtime
```

The script probes:

1. `/`
2. `/proof`
3. Convex `/healthz`
4. ClawPump platform health

It stores response status, latency, body hash and timestamp in `evidence/runtime/LATEST.json`. It never invents success.

**Important:** this proves reachability only. It does not complete `evidence/canonical-run/STATUS.json`.

## 6. Canonical negative path

With the deployed app:

1. sign in;
2. run the scanner against real Pump observations;
3. run one agent cycle;
4. select a real `REJECT`/`UNKNOWN` receipt produced from live evidence;
5. record its receipt id, launch signature, timestamp and screenshot/video hash in `evidence/canonical-run/STATUS.json`;
6. leave rejected/unknown facts in the record.

A synthetic fixture may demonstrate behavior, but it must never be used as submission evidence.

## 7. Gate 7

When eligibility and runtime evidence are populated:

```bash
npm run gate:submission
```

A non-zero exit means PROMOTE remains blocked.
