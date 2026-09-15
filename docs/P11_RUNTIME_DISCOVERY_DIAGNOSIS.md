# P11 runtime discovery diagnosis — 2026-09-15

Observed runtime result on `grandiose-poodle-700`:

- Convex `/healthz` reachable.
- `AS-AUTHORITY-V1` policy reachable and machine-readable.
- `/authority-openapi` reachable.
- Authority stats reachable.
- `scanner/discoverNow` returned `configured=false`, `searchedSignatureLimit=60`, `verified=0`.
- Runtime proof correctly returned `FAILED_CLOSED`; no synthetic Pump launch was substituted.

## Diagnosis

The authority runtime itself is live. The current blocker is discovery recall, not policy or HTTP reachability.

The discovery implementation had two recall weaknesses:

1. It inspected only top-level transaction instructions. A Pump create/create_v2 instruction reached through CPI can appear in Solana `meta.innerInstructions`, so a valid launch could be missed.
2. It searched a single recent signature window. Pump is high-volume, so a bounded paginated window is needed to find sparse create/create_v2 instructions without turning discovery into an unbounded crawl.

## Remediation

P11.2 runtime discovery adds:

- top-level **and inner-instruction** Pump create/create_v2 verification;
- bounded pagination over recent Pump signatures;
- bounded parallel transaction verification;
- explicit discovery diagnostics: signatures searched, pages searched, verification errors, whether a dedicated RPC is configured;
- preservation of fail-closed semantics: zero verified launches remains a valid refusal to fabricate evidence.

This change improves recall only. It does **not** weaken launch provenance, Evidence Gate thresholds, or the rule that `QUALIFIED != execution authorization`.
