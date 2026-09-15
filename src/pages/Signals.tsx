import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { timeAgo, shorten } from "../lib/format";

type Filter = "all" | "buy" | "sell" | "warn" | "new-launch" | "alert";
type SignalType = "buy" | "sell" | "warn" | "new-launch" | "alert";
type SignalRow = {
  _id: string;
  processedAt: number;
  type: SignalType;
  title: string;
  tokenSymbol?: string;
  detail: string;
  tokenMint: string;
  confidence: number;
  payload?: { mcap?: number };
};

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All observations" },
  { id: "new-launch", label: "New launches" },
  { id: "warn", label: "Warnings" },
  { id: "alert", label: "Alerts" },
  { id: "buy", label: "Buy signals" },
  { id: "sell", label: "Sell signals" },
];

export default function Signals() {
  const [filter, setFilter] = useState<Filter>("all");
  const signals = useQuery(api.queries.signals.signals, { type: filter === "all" ? undefined : filter, limit: 30 });
  const rows = (signals ?? []) as SignalRow[];

  return (
    <div className="fw-page">
      <div className="fw-wrap">
        <header className="fw-head">
          <div className="fw-head-copy">
            <div className="fw-index">03</div>
            <div><div className="fw-kicker">LAUNCH TAPE / LIVE OBSERVATIONS</div><h1>Watch the market before claiming alpha.</h1><p>The tape records only observed launch events and derived signal states. Empty is a valid state; nothing is seeded to make the product look busy.</p></div>
          </div>
          <div className="fw-head-state"><div><span>Transport</span><b>CONVEX LIVE</b></div><div><span>Network</span><b>SOLANA</b></div><div><span>Rows</span><b>{signals === undefined ? "…" : rows.length}</b></div></div>
        </header>

        <div className="fw-filterbar" role="tablist" aria-label="Launch tape filters">
          {filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`fw-filter ${filter === item.id ? "fw-filter--active" : ""}`}>{item.label}</button>)}
          <div className="ml-auto hidden md:flex items-center px-4 gap-2 text-[9px] font-mono uppercase tracking-[.1em] text-ink-mid"><span className="w-2 h-2 rounded-full bg-up animate-pulse" />scanner transport live</div>
        </div>

        {signals === undefined ? <div className="fw-tape"><div className="fw-empty"><div className="fw-empty-inner"><div className="fw-empty-mark">…</div><h3>Opening scanner channel</h3><p>Waiting for Convex to return the observation tape.</p></div></div></div>
        : rows.length === 0 ? <div className="fw-tape"><div className="fw-scanline"><span /></div><div className="fw-empty"><div className="fw-empty-inner"><div className="fw-empty-mark">RX</div><div className="fw-kicker">SCANNER LISTENING</div><h3 className="mt-2">No qualifying observation on this channel.</h3><p>A blank tape means exactly that. Alpha Scout will not insert demo tokens or synthetic confidence scores to create activity.</p><div className="mt-6 border border-[#c8ccc0] text-left"><Channel label="Pump create instruction" state="LISTENING" /><Channel label="Launch verification" state="FAIL-CLOSED" /><Channel label="Price / liquidity enrichment" state="ON OBSERVATION" /><Channel label="Evidence claim" state="NONE" /></div></div></div></div>
        : <div className="fw-tape"><div className="fw-tape-head"><span>Observed</span><span>Type</span><span>Subject / finding</span><span>Mint</span><span>Conf.</span></div>{rows.map((signal) => <Link key={signal._id} to={`/token/${signal.tokenMint}`} className="fw-tape-row"><span className="font-mono text-[9px] text-ink-faint">{timeAgo(signal.processedAt)}</span><span className={`fw-type fw-type--${signal.type}`}>{shortType(signal.type)}</span><span className="min-w-0"><span className="flex items-baseline gap-2 min-w-0"><b className="truncate text-[13px]">{signal.title}</b>{signal.tokenSymbol && <span className="font-mono text-[10px] text-ink-faint">${signal.tokenSymbol}</span>}</span><span className="block mt-1 text-[11px] text-ink-mid leading-snug truncate">{signal.detail}</span>{signal.payload?.mcap !== undefined && <span className="block mt-1 font-mono text-[9px] text-ink-faint">MCAP {formatMoney(signal.payload.mcap)}</span>}</span><span className="font-mono text-[9px] text-ink-mid">{shorten(signal.tokenMint)}</span><span className="font-mono text-[12px] font-extrabold text-right">{Math.round(signal.confidence)}%</span></Link>)}</div>}

        <section className="fw-boundary"><Boundary label="01 / DISCOVER" title="Observe" body="A real Pump create instruction is verified before it becomes a launch candidate." /><Boundary label="02 / INVESTIGATE" title="Enrich" body="Price, liquidity and economic-owner evidence are fetched from live sources." /><Boundary label="03 / QUALIFY" title="Claim or refuse" body="Critical unknowns keep execution authority locked. Confidence is not permission." /></section>
        <footer className="fw-footer-rule"><span>real observations only</span><span>no seeded candidates</span><span>unknown ≠ safe</span><span>open a row to inspect evidence</span></footer>
      </div>
    </div>
  );
}

function Channel({ label, state }: { label: string; state: string }) { return <div className="fw-row"><span>{label}</span><strong>{state}</strong><small>live channel</small></div>; }
function Boundary({ label, title, body }: { label: string; title: string; body: string }) { return <div className="fw-boundary-cell"><div className="fw-label">{label}</div><h3>{title}</h3><p>{body}</p></div>; }
function shortType(type: SignalType): string { if (type === "new-launch") return "NEW"; if (type === "warn") return "WARN"; if (type === "alert") return "ALERT"; return type.toUpperCase(); }
function formatMoney(n: number): string { if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`; return `$${n.toFixed(0)}`; }
