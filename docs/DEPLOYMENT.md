# Deployment

Alpha Scout uses Cloudflare Pages for the Vite frontend and Convex for backend state and authority APIs.

## Cloudflare Pages

Recommended settings:

- framework: Vite
- production branch: `master`
- build output: `dist`
- build command:

```bash
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

`public/_redirects` preserves SPA routes such as `/proof` on direct navigation. `public/_headers` provides conservative browser security headers.

## Convex

The browser needs only:

```text
VITE_CONVEX_URL=https://<deployment>.convex.cloud
```

Backend secrets belong in the Convex deployment environment:

```text
HELIUS_API_KEY
HELIUS_WEBHOOK_SECRET
JUPITER_API_KEY
CLAWPUMP_API_KEY
AUTHORITY_API_KEY   # optional access control for underwriting mutations
```

Never expose backend secrets through `VITE_*` variables.

## Runtime capture

After a public deployment is reachable:

```bash
PUBLIC_URL=https://<project>.pages.dev \
CONVEX_HTTP_URL=https://<deployment>.convex.site \
DEPLOYED_COMMIT_SHA=$(git rev-parse HEAD) \
npm run capture:runtime
```

The capture probes:

- frontend `/`;
- frontend `/proof`;
- Convex `/healthz`;
- ClawPump platform health as a non-critical external observation.

The result is written to `evidence/runtime/LATEST.json` with status, latency, response size and body hash.

## Current public preview

The currently validated preview is:

- frontend: `https://f87de3e2.alpha-scout-clawrena.pages.dev`
- proof room: `https://f87de3e2.alpha-scout-clawrena.pages.dev/proof`
- Convex HTTP: `https://grandiose-poodle-700.convex.site`

This URL is a validated public preview. The repository does not describe it as final production routing.

## Truth boundary

Runtime reachability proves that deployed endpoints respond. It does not by itself prove a profitable strategy, a real trade, a live token, or verified on-chain volume.

The canonical authority evidence is stored separately under `evidence/canonical-run/`.
