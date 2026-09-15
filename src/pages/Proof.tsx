import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatSol, shorten, timeAgo } from "../lib/format";

type ReceiptRow = {
  _id: string;
  executionMode: "paper" | "onchain";
  decision: "execute" | "reject" | "skip" | "prepare";
  createdAt: number;
  tokenMint: string;
  score?: number;
  reasons: string[];
  unknowns: string[];
  riskBudgetSol?: number;
  txSignature?: string;
};

const realFailures = [
  { code: "RF-01", title: "LIBRA · Feb 2025", body: "Creator-linked liquidity withdrawals and broad trader losses show why launch momentum cannot be execution authority by itself.", href: "https://www.reuters.com/world/americas/crypto-worth-99-million-withdrawn-milei-backed-libra-token-researchers-say-2025-02-20/", lesson: "Ownership, liquidity and UNKNOWN evidence need veto power." },
  { code: "RF-02", title: "Pump.fun · May 2024", body: "A privileged-access exploit led the venue to halt trading, proving that provider health is a separate risk surface from token quality.", href: "https://www.theblock.co/news/regulation/2024-05-16-pump-fun-post-mortem-295029", lesson: "Fresh evidence + live provider preflight are required before value movement." },
];

export default function Proof() {
  const data = useQuery(api.queries.portfolio.dashboard);
  const stats = useQuery(api.queries.public.publicStats);
  if (data === undefined || data === null) return <div className="fw-page"><div className="fw-wrap fw-meta">Opening evidence room…</div></div>;

  const receipts = (data.decisionReceipts ?? []) as ReceiptRow[];
  const verifiedVolume = stats?.verifiedOnchainVolumeSol ?? 0;
  const pendingVolume = stats?.pendingOnchainVolumeSol ?? 0;
  const proofState = receipts.length > 0 ? "RECEIPTS PRESENT" : "NO RUNTIME CLAIM";

  return (
    <div className="fw-page">
      <div className="fw-wrap">
        <header className="fw-head">
          <div className="fw-head-copy"><div className="fw-index">04</div><div><div className="fw-kicker">EVIDENCE ROOM / RECEIPTS</div><h1>Every claim has to survive the record.</h1><p>Observed facts, unknowns, decisions and execution states stay separate. A convincing story is not a substitute for a receipt.</p></div></div>
          <div className="fw-head-state"><div><span>Rule</span><b>FAIL-CLOSED</b></div><div><span>Receipts</span><b>{receipts.length}</b></div><div><span>State</span><b>{proofState}</b></div></div>
        </header>

        <section className="fw-proof-banner"><div className="fw-proof-banner-main"><div className="fw-label">CLAIM AUTHORITY</div><h2>No receipt → no claim.</h2><p>Verified on-chain volume requires an on-chain execution mode, a stored transaction signature and an independently persisted confirmation slot. Pending submission is not collapsed into success.</p></div><div className="fw-proof-banner-state"><div><b>{receipts.length > 0 ? "RECORDED" : "LOCKED"}</b><span>{receipts.length > 0 ? "EVIDENCE EXISTS" : "AWAITING RUNTIME"}</span></div></div></section>

        <section className="fw-strip"><StatusStat label="Verified on-chain" value={formatSol(verifiedVolume)} note="signature + confirmation" /><StatusStat label="Pending on-chain" value={formatSol(pendingVolume)} note="submitted, not proved" /><StatusStat label="Paper volume" value={formatSol(data.portfolio?.paperVolumeSol ?? 0)} note="simulation only" /><StatusStat label="Decision receipts" value={String(receipts.length)} note="reasoning trail" /></section>

        <section className="fw-boundary"><Boundary label="01 / OBSERVED" title="Facts enter" body="Live Jupiter price/liquidity, Solana owner concentration, launch timestamp and provider request IDs." /><Boundary label="02 / UNKNOWN" title="Unknown can veto" body="Missing holder or liquidity evidence, stale receipts and unhealthy execution providers keep authority locked." /><Boundary label="03 / PROVED" title="Claims leave" body="Only separately verified execution evidence can become verified on-chain volume." /></section>

        <div className="fw-sheet mt-[18px]">
          <div className="fw-sheet-head"><div className="fw-sheet-title"><span className="fw-sheet-no">R</span><div><h2>Decision receipt ledger</h2><p>The negative path remains visible instead of being cleaned up for the demo.</p></div></div><span className="fw-badge">{receipts.length} RECENT</span></div>
          {receipts.length === 0 ? <div className="fw-empty"><div className="fw-empty-inner"><div className="fw-empty-mark">Ø</div><div className="fw-kicker">EMPTY IS HONEST</div><h3 className="mt-2">No runtime decision has been recorded yet.</h3><p>Run the live scanner and one agent cycle. Rejects, skips and paper entries appear here without inventing activity or converting UNKNOWN into PASS.</p></div></div>
          : <><div className="fw-ledger-head"><span>Observed</span><span>Decision</span><span>Evidence / reason</span><span>Budget</span></div><div className="fw-ledger">{receipts.map((r) => <div key={r._id} className="fw-ledger-row"><span className="font-mono text-[9px] text-ink-faint">{timeAgo(r.createdAt)}</span><span><span className={`fw-state ${r.decision === "reject" ? "fw-state--flag" : r.decision === "execute" ? "fw-state--pass" : "fw-state--unknown"}`}>{r.decision.toUpperCase()}</span><span className="block mt-1 font-mono text-[8px] text-ink-faint">{r.executionMode.toUpperCase()}</span></span><span className="min-w-0"><span className="flex items-baseline gap-2"><b className="text-[12px]">SCORE {r.score ?? "—"}/100</b><span className="font-mono text-[9px] text-ink-faint">{shorten(r.tokenMint)}</span></span><span className="block mt-1 text-[11px] text-ink-mid leading-snug">{r.reasons.join(" · ") || "No reason recorded"}</span>{r.unknowns.length > 0 && <span className="block mt-1 text-[10px] text-[#b63d36]">UNKNOWN → {r.unknowns.join(", ")}</span>}{r.txSignature && <span className="block mt-1 font-mono text-[9px] text-ink-faint">TX {shorten(r.txSignature)}</span>}</span><span className="font-mono text-[10px] text-right">{r.riskBudgetSol !== undefined ? formatSol(r.riskBudgetSol) : "—"}</span></div>)}</div></>}
        </div>

        <section className="fw-cases">{realFailures.map((failure) => <a key={failure.code} href={failure.href} target="_blank" rel="noreferrer" className="fw-case"><div className="fw-case-no">{failure.code}</div><div className="fw-case-body"><div className="fw-label">EXTERNAL FAILURE PRECEDENT</div><h3>{failure.title}</h3><p>{failure.body}</p><strong>Design consequence → {failure.lesson}</strong><div className="mt-3 font-mono text-[8px] uppercase tracking-[.08em] text-ink-faint">SOURCE ↗ / precedent, not Alpha Scout performance</div></div></a>)}</section>

        <footer className="fw-footer-rule"><span>observed ≠ inferred</span><span>pending ≠ verified</span><span>rejects stay in record</span><span>real failure &gt; fake success</span></footer>
      </div>
    </div>
  );
}

function Boundary({ label, title, body }: { label: string; title: string; body: string }) { return <div className="fw-boundary-cell"><div className="fw-label">{label}</div><h3>{title}</h3><p>{body}</p></div>; }
function StatusStat({ label, value, note }: { label: string; value: string; note: string }) { return <div className="fw-stat"><span className="fw-label">{label}</span><strong>{value}</strong><small>{note}</small></div>; }
