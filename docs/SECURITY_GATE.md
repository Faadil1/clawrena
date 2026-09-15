# Dependency Security Gate

Canonical rule: security warnings are evidence, not console noise.

## Current observation

During upstream CI run **#11** on 2026-09-15, `npm ci` reported **4 known vulnerabilities across the full installed dependency tree: 3 moderate and 1 high**. The run still passed integrity, logic, typecheck, lint and build because npm's install warning is not itself a CI gate.

Alpha Scout therefore does **not** claim “zero dependency vulnerabilities.”

## P3 security policy

The CI now separates two questions:

1. **Production/runtime dependency gate — blocking**  
   `npm audit --omit=dev --audit-level=high` must pass. A high/critical advisory in runtime dependencies blocks the build.

2. **Full dependency-tree audit — evidence preserving**  
   `npm audit --audit-level=high || true` prints the complete audit, including build/dev tooling, into the immutable workflow log. It is temporarily non-blocking so an unrelated dev-tool major upgrade cannot silently force a risky hackathon-time migration.

This is not an exemption from remediation. Any high advisory in tooling must be classified and upgraded or explicitly carried as documented technical debt before final production promotion.

## Gate semantics

- `RUNTIME_HIGH_OR_CRITICAL` → BLOCK.
- `DEV_TOOL_HIGH` → RECORD + ASSESS + PATCH when compatible; Gate 7 cannot call the dependency tree clean while it remains.
- `MODERATE` → RECORD + prioritize by exploitability/surface.
- Never run `npm audit fix --force` blindly in CI.
- Any dependency change must rerun integrity, logic, typecheck, lint and build.

## Evidence

- Upstream PR: https://github.com/opeblow/clawrena/pull/1
- First fully green pre-security-gate workflow: run `34925686416` / run #11.
- Security-gated workflow result: pending at the time this file is introduced; update this record from the actual GitHub Actions run rather than guessing.
