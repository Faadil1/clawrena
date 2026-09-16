import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./proof.css";

const CANONICAL_REPLAY_KEY = "AS1-51fff2964ef6c06d";
const CANONICAL_SESSION_ID = "94b94917-ff0d-4697-b0fd-5ca7d687f3a0";

export default function Proof() {
  const [replayInput, setReplayInput] = useState(CANONICAL_REPLAY_KEY);
  const [replayKey, setReplayKey] = useState(CANONICAL_REPLAY_KEY);
  const receipt = useQuery(api.underwriting.verifyReceipt, { replayKey });
  const stats = useQuery(api.queries.public.publicStats);

  const submitReplay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = replayInput.trim();
    if (next) setReplayKey(next);
  };

  const hasReceipt = Boolean(receipt?.ok);
  const caller = hasReceipt ? receipt?.caller : null;
  const sources = hasReceipt && Array.isArray(receipt?.sourceLedger) ? receipt.sourceLedger : [];
  const blockers = hasReceipt ? receipt?.blockers ?? [] : [];
  const unknowns = hasReceipt ? receipt?.unknowns ?? [] : [];
  const match = hasReceipt && receipt?.replayConsistency === "MATCH";

  return (
    <div className="pa-page">
      <header className="pa-topbar">
        <Link to="/" className="pa-brand" aria-label="Alpha Scout home">
          <img src="/alpha-scout.svg" alt="" />
          <span><b>ALPHA SCOUT</b><small>PROOF OF AUTHORITY</small></span>
        </Link>
        <div className="pa-topbar-center" aria-label="Proof mode">
          <span className="pa-live-dot" /> LIVE RECEIPT / CONVEX
          <i />
          <span>FAIL-CLOSED</span>
        </div>
        <div className="pa-topbar-actions">
          <Link to="/" className="pa-plain-link">Overview</Link>
          <Link to="/dashboard" className="pa-desk-link">Open desk <span>→</span></Link>
        </div>
      </header>

      <main className="pa-frame">
        <section className="pa-hero">
          <div className="pa-hero-copy">
            <div className="pa-eyebrow"><span>CASE 01</span> EXTERNAL AGENT AUTHORITY RECEIPT</div>
            <h1>The evidence said <em>no.</em><br />Capital stayed put.</h1>
            <p>
              A separate Claude Code agent called Alpha Scout against a real Pump launch. Alpha Scout independently verified the evidence,
              refused the request, persisted the caller context, and reproduced the same Evidence Passport on replay.
            </p>
            <div className="pa-hero-rules">
              <span>REFUSED = VALID OUTCOME</span>
              <span>QUALIFIED ≠ AUTHORIZED</span>
              <span>VALUE MOVED = 0</span>
            </div>
          </div>

          <aside className={`pa-verdict ${hasReceipt ? "is-loaded" : "is-loading"}`}>
            <div className="pa-verdict-label">AUTHORITY DECISION</div>
            <div className="pa-verdict-word">{receipt === undefined ? "CHECKING" : hasReceipt ? receipt.policyState : "NO RECEIPT"}</div>
            <div className="pa-verdict-score">
              <span>Evidence score</span>
              <b>{hasReceipt ? `${receipt.score ?? "—"}/100` : "—"}</b>
            </div>
            <div className="pa-stamp" aria-hidden="true">{hasReceipt ? receipt.policyState : "UNVERIFIED"}</div>
            <div className="pa-verdict-foot">
              <span>VALUE MOVEMENT</span>
              <b>{hasReceipt && receipt.valueMovement === false ? "NONE" : "—"}</b>
            </div>
          </aside>
        </section>

        <section className="pa-proofline" aria-label="Cross-system proof chain">
          <ProofStep no="01" label="REQUESTER" value="Claude Code / headless" detail={caller?.runId ? short(caller.runId, 8, 6) : short(CANONICAL_SESSION_ID, 8, 6)} state="OBSERVED" />
          <ProofStep no="02" label="UNDERWRITE" value={hasReceipt ? `HTTP receipt · ${receipt.policyState}` : "Awaiting receipt"} detail="real Pump mint + create signature" state={hasReceipt ? "RECORDED" : "PENDING"} />
          <ProofStep no="03" label="PASSPORT" value={hasReceipt ? receipt.replayKey : CANONICAL_REPLAY_KEY} detail={hasReceipt ? `policy ${receipt.policyVersion}` : "deterministic audit identifier"} state={hasReceipt ? "STORED" : "PENDING"} mono />
          <ProofStep no="04" label="CONSISTENCY" value={receipt === undefined ? "CHECKING" : match ? "MATCH" : "UNVERIFIED"} detail="recomputed from stored envelope" state={match ? "PROVED" : "PENDING"} emphasis />
        </section>

        <section className="pa-grid pa-grid--primary">
          <article className="pa-sheet pa-receipt">
            <SheetHead index="A" eyebrow="LIVE EVIDENCE PASSPORT" title="Refusal docket" status={match ? "MATCH" : "CHECKING"} tone={match ? "good" : "neutral"} />
            {receipt === undefined ? (
              <LoadingBlock text="Reading the stored Evidence Passport…" />
            ) : !hasReceipt ? (
              <div className="pa-empty">
                <b>Receipt unavailable</b>
                <p>{receipt?.error ?? "No stored underwriting decision matched this replay key."}</p>
              </div>
            ) : (
              <div className="pa-receipt-body">
                <div className="pa-receipt-id">
                  <span>REPLAY KEY</span>
                  <strong>{receipt.replayKey}</strong>
                  <small>Deterministic audit identifier — not a cryptographic signature.</small>
                </div>
                <div className="pa-docket-grid">
                  <Docket label="Policy state" value={receipt.policyState} tone="red" />
                  <Docket label="Policy" value={receipt.policyVersion} />
                  <Docket label="Score" value={`${receipt.score ?? "—"}/100`} />
                  <Docket label="Replay" value={receipt.replayConsistency} tone={match ? "green" : "red"} />
                  <Docket label="Policy current" value={receipt.policyIsCurrent ? "YES" : "NO"} />
                  <Docket label="Value movement" value={receipt.valueMovement === false ? "NONE" : "UNEXPECTED"} tone={receipt.valueMovement === false ? "green" : "red"} />
                </div>
                <div className="pa-blocker-zone">
                  <div className="pa-mini-label">WHY AUTHORITY STOPPED</div>
                  {blockers.length > 0 ? blockers.map((blocker, index) => (
                    <div className="pa-blocker" key={blocker}><span>{String(index + 1).padStart(2, "0")}</span><b>{blocker}</b><i>VETO</i></div>
                  )) : <div className="pa-blocker pa-blocker--clear"><span>00</span><b>No blockers recorded</b><i>CLEAR</i></div>}
                </div>
                <div className="pa-counterfactual">
                  <div className="pa-mini-label">COUNTERFACTUAL / TO RECONSIDER</div>
                  <p>{unknowns.length > 0 ? `Resolve critical UNKNOWN evidence: ${unknowns.join(", ")}. Then re-run the gate against fresh evidence; do not rewrite this receipt.` : "No critical UNKNOWN is recorded on this receipt."}</p>
                </div>
              </div>
            )}
          </article>

          <article className="pa-sheet pa-requester">
            <SheetHead index="B" eyebrow="REQUEST LINEAGE" title="Who asked for authority?" status="DECLARED" tone="orange" />
            <div className="pa-requester-body">
              <div className="pa-agent-mark"><span>EXT</span><b>CLAUDE<br />CODE</b></div>
              <dl className="pa-kv">
                <KeyValue label="Platform" value={caller?.platform ?? "claude-code"} />
                <KeyValue label="Agent ID" value={caller?.agentId ?? "claude-code-headless"} />
                <KeyValue label="Run / session" value={caller?.runId ?? CANONICAL_SESSION_ID} mono />
                <KeyValue label="Skill" value={caller?.skillSlug ?? "evidence-authority"} />
                <KeyValue label="Identity semantics" value={caller?.identitySemantics ?? "DECLARED_EXTERNAL_CONTEXT"} mono />
              </dl>
              <div className="pa-boundary-note">
                <b>DECLARED ≠ VERIFIED IDENTITY</b>
                <p>Alpha Scout persists the external caller context and matches it back to the external session transcript. It does not claim cryptographic agent identity.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="pa-sheet pa-ledger-sheet">
          <SheetHead index="C" eyebrow="SOURCE LEDGER" title="What Alpha Scout actually observed" status={`${sources.length} SOURCES`} tone="neutral" />
          <div className="pa-ledger-head"><span>Source</span><span>Status</span><span>Clock / slot</span><span>Reference</span></div>
          <div className="pa-ledger-body">
            {sources.length === 0 ? <LoadingBlock text="Waiting for source lineage…" compact /> : sources.map((source: Record<string, unknown>, index: number) => {
              const status = String(source.status ?? "UNKNOWN");
              return (
                <div className="pa-ledger-row" key={`${String(source.source)}-${index}`}>
                  <div><span className="pa-source-no">0{index + 1}</span><b>{sourceName(String(source.source ?? "unknown"))}</b><small>{String(source.source ?? "unknown")}</small></div>
                  <div><span className={`pa-source-state ${status === "OBSERVED" ? "is-observed" : "is-unknown"}`}>{status}</span></div>
                  <div className="pa-mono-stack"><b>{source.slot ? `slot ${String(source.slot)}` : source.blockId ? `block ${String(source.blockId)}` : "no chain clock"}</b><small>{source.observedAt ? formatTime(Number(source.observedAt)) : "—"}</small></div>
                  <div className="pa-mono-stack"><b>{source.reference ? short(String(source.reference), 10, 8) : "—"}</b><small>{source.blockTime ? `chain ${formatTime(Number(source.blockTime))}` : status === "UNKNOWN" ? "evidence unavailable" : "live observation"}</small></div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="pa-grid pa-grid--secondary">
          <article className="pa-sheet pa-verifier">
            <SheetHead index="D" eyebrow="REPLAY VERIFIER" title="Check any Evidence Passport" status={match ? "LIVE" : "READY"} tone={match ? "good" : "neutral"} />
            <form className="pa-verify-form" onSubmit={submitReplay}>
              <label htmlFor="replay-key">Replay key</label>
              <div><input id="replay-key" value={replayInput} onChange={(event) => setReplayInput(event.target.value)} spellCheck={false} aria-label="Replay key" /><button type="submit">VERIFY RECEIPT</button></div>
            </form>
            <div className={`pa-verify-result ${match ? "is-match" : ""}`}>
              <span>{receipt === undefined ? "…" : match ? "✓" : "?"}</span>
              <div><b>{receipt === undefined ? "Recomputing stored envelope" : match ? "REPLAY CONSISTENCY: MATCH" : "NO MATCH CONFIRMED"}</b><p>{match ? `${receipt?.recomputedReplayKey} reproduces the stored identifier under ${receipt?.policyVersion}.` : "Verification is deterministic consistency only; it is not live market revalidation or cryptographic attestation."}</p></div>
            </div>
            <p className="pa-verifier-foot">Verification reads the stored decision envelope. It does not refresh market evidence and does not authorize execution.</p>
          </article>

          <article className="pa-sheet pa-activity">
            <SheetHead index="E" eyebrow="AUTHORITY ACTIVITY" title="Runtime, without vanity metrics" status="REQUEST COUNTS" tone="neutral" />
            <div className="pa-activity-grid">
              <Activity label="Decision rows" value={stats?.underwritingDecisions} note="stored underwriting history" />
              <Activity label="Refused" value={stats?.underwritingRefused} note="valid authority outcomes" />
              <Activity label="Qualified" value={stats?.underwritingQualified} note="not execution authorization" />
              <Activity label="Attributed rows" value={stats?.externallyAttributedUnderwritingRequests} note="not unique agents/users" />
            </div>
            <div className="pa-activity-boundary"><span>VERIFIED ON-CHAIN VOLUME</span><b>{stats ? `${stats.verifiedOnchainVolumeSol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL` : "…"}</b><small>Requires on-chain mode + tx signature + confirmation slot. Underwriting requests are not trading volume.</small></div>
          </article>
        </section>

        <section className="pa-proof-boundaries">
          <div><span>PROVED</span><b>External agent reached Alpha Scout</b><p>Auditable Bash tool trace, one real POST, durable decision row, identical external session ID stored as caller.runId, and receipt replay MATCH.</p></div>
          <div><span>NOT CLAIMED</span><b>No fake identity or performance</b><p>Caller metadata is declared context, replay MATCH is not cryptographic attestation, and request counts are neither unique users nor realized trading performance.</p></div>
          <div><span>STILL SEPARATE</span><b>ClawPump-native autonomous proof</b><p>The ClawPump skill is installed on a real agent, but its chat lacked auditable HTTP and its autonomous runner required a positive budget. That path remains unproved.</p></div>
        </section>

        <footer className="pa-footer">
          <div><img src="/alpha-scout.svg" alt="" /><span><b>ALPHA SCOUT</b><small>Evidence Underwriter / Execution Authority</small></span></div>
          <p>Observed ≠ inferred · qualified ≠ authorized · pending ≠ verified · real failure &gt; fake success</p>
          <span className="pa-footer-status"><i /> PROOF ROOM LIVE</span>
        </footer>
      </main>
    </div>
  );
}

function ProofStep({ no, label, value, detail, state, mono = false, emphasis = false }: { no: string; label: string; value: string; detail: string; state: string; mono?: boolean; emphasis?: boolean }) {
  return <div className={`pa-proofstep ${emphasis ? "is-emphasis" : ""}`}><span className="pa-proofstep-no">{no}</span><div><small>{label}</small><b className={mono ? "is-mono" : ""}>{value}</b><p>{detail}</p></div><i>{state}</i></div>;
}

function SheetHead({ index, eyebrow, title, status, tone }: { index: string; eyebrow: string; title: string; status: string; tone: "good" | "orange" | "neutral" }) {
  return <header className="pa-sheet-head"><span className="pa-sheet-index">{index}</span><div><small>{eyebrow}</small><h2>{title}</h2></div><b className={`pa-sheet-status is-${tone}`}>{status}</b></header>;
}

function Docket({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" }) {
  return <div className={`pa-docket ${tone ? `is-${tone}` : ""}`}><span>{label}</span><b>{value}</b></div>;
}

function KeyValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt>{label}</dt><dd className={mono ? "is-mono" : ""}>{value}</dd></div>;
}

function Activity({ label, value, note }: { label: string; value: number | undefined; note: string }) {
  return <div><span>{label}</span><b>{value === undefined ? "…" : value}</b><small>{note}</small></div>;
}

function LoadingBlock({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={`pa-loading ${compact ? "is-compact" : ""}`}><span /><b>{text}</b></div>;
}

function short(value: string, head = 10, tail = 8) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function sourceName(source: string) {
  if (source === "solana-pump-transaction") return "Pump launch provenance";
  if (source === "jupiter-price-v3") return "Jupiter market evidence";
  if (source === "solana-owner-concentration") return "Owner concentration";
  return source;
}

function formatTime(value: number) {
  return new Date(value).toISOString().replace("T", " ").replace(".000Z", "Z");
}
