import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { shorten } from "../lib/format";
import type { ShieldCheck } from "../../convex/shieldScan";

const pendingChecks = [
  ["Price verification", "Real price via Jupiter"],
  ["Owner concentration", "Public Solana token accounts"],
  ["Liquidity evidence", "Live route / pool evidence"],
  ["Wash trading", "Requires Helius streaming"],
  ["Bundling", "Requires Helius streaming"],
  ["Buy / sell restrictions", "Requires route simulation"],
] as const;

export default function Token() {
  const { mint: routeMint } = useParams();
  const [mint, setMint] = useState<string>(routeMint ?? "");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; configured?: boolean; checks?: ShieldCheck[]; flagCount?: number; token?: { name?: string; symbol?: string } | null; price?: number; error?: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const shieldScan = useAction(api.shieldScan.scan);

  const runScan = async () => {
    if (!mint.trim()) { setMessage("Enter a Solana token mint to inspect."); return; }
    setScanning(true); setMessage(null);
    try {
      const r = await shieldScan({ tokenMint: mint.trim() });
      setResult(r);
      if (r.valid && !r.configured) setMessage("Wash / bundling classifiers remain UNKNOWN until Helius streaming is configured. Public Solana + Jupiter checks remain real.");
    } catch (e) {
      setResult(null); setMessage(e instanceof Error ? e.message : "Inspection failed.");
    } finally { setScanning(false); }
  };

  const checks = result?.checks ?? null;
  const verdict = !result ? "NO SUBJECT" : !result.valid ? "INVALID" : (result.flagCount ?? 0) > 0 ? "FLAGGED" : "NO LIVE FLAG";

  return (
    <div className="fw-page">
      <div className="fw-wrap">
        <header className="fw-head">
          <div className="fw-head-copy"><div className="fw-index">05</div><div><div className="fw-kicker">INSPECTION BENCH / TOKEN EVIDENCE</div><h1>Inspect the subject. Don’t score the story.</h1><p>Each check keeps its source and epistemic state. Missing classifiers stay UNKNOWN instead of being represented as safety.</p></div></div>
          <div className="fw-head-state"><div><span>Subject</span><b>{mint ? shorten(mint) : "NONE"}</b></div><div><span>Verdict</span><b>{verdict}</b></div><div><span>Flags</span><b>{result?.flagCount ?? "—"}</b></div></div>
        </header>

        <div className="fw-inspect-bar"><input value={mint} onChange={(e) => setMint(e.target.value)} placeholder="PASTE SOLANA TOKEN MINT / BASE58" className="fw-input fw-input--mono" /><button onClick={() => void runScan()} disabled={scanning} className="fw-button fw-button--orange">{scanning ? "INSPECTING…" : "RUN EVIDENCE INSPECTION"}</button></div>
        {message && <div className="fw-note">{message}</div>}

        <div className="fw-grid-main">
          <section className="fw-sheet fw-subject">
            <div className="fw-sheet-head"><div className="fw-sheet-title"><span className="fw-sheet-no">S</span><div><h2>Subject dossier</h2><p>Token identity and observed market facts.</p></div></div><span className={`fw-badge ${result?.valid ? "fw-badge--green" : result ? "fw-badge--red" : ""}`}>{result ? (result.valid ? "OBSERVED" : "INVALID") : "AWAITING SUBJECT"}</span></div>
            {!result ? <div className="fw-empty min-h-[390px]"><div className="fw-empty-inner"><div className="fw-crosshair"><span /></div><div className="fw-kicker">NO SCAN / NO CLAIM</div><h3 className="mt-2">Place a mint on the inspection bench.</h3><p>The dossier stays blank until Alpha Scout can obtain live evidence. There is no placeholder token and no fabricated shield score.</p></div></div>
            : !result.valid ? <div className="fw-empty min-h-[390px]"><div className="fw-empty-inner"><div className="fw-empty-mark">!</div><div className="fw-kicker">SUBJECT REJECTED</div><h3 className="mt-2">The mint could not be validated.</h3><p>{result.error ?? "Invalid or unavailable token subject."}</p></div></div>
            : <><div className="fw-authority-state"><div><div className="fw-label">OBSERVED SUBJECT</div><h3>{result.token?.symbol ? `$${result.token.symbol}` : "UNKNOWN SYMBOL"}</h3><p>{result.token?.name ?? "Token metadata unavailable"} · {shorten(mint)}</p></div><div className="text-right"><div className="fw-label">JUPITER PRICE</div><div className="mt-2 font-mono text-2xl font-extrabold">{result.price !== undefined ? `$${result.price.toPrecision(6)}` : "UNKNOWN"}</div></div></div><div className="fw-row"><span>Mint</span><strong>{shorten(mint)}</strong><small>subject identifier</small></div><div className="fw-row"><span>Price</span><strong>{result.price !== undefined ? `$${result.price.toPrecision(6)}` : "UNKNOWN"}</strong><small>Jupiter live evidence</small></div><div className="fw-row"><span>Flags</span><strong>{result.flagCount ?? 0}</strong><small>observed checks only</small></div><div className="fw-row"><span>Classifier coverage</span><strong>{result.configured ? "FULL CONFIGURED SET" : "PARTIAL / UNKNOWN RETAINED"}</strong><small>no fabricated pass</small></div></>}
          </section>

          <aside className="fw-sheet">
            <div className="fw-sheet-head"><div className="fw-sheet-title"><span className="fw-sheet-no">V</span><div><h2>Veto matrix</h2><p>Any critical UNKNOWN may block authority.</p></div></div><span className="fw-badge fw-badge--orange">FAIL-CLOSED</span></div>
            {!checks ? pendingChecks.map(([label, source], index) => <VetoRow key={label} index={index + 1} label={label} source={source} status="unknown" detail="Awaiting inspection" />) : checks.map((check, index) => <VetoRow key={check.id} index={index + 1} label={check.label} source={sourceFor(check.id)} status={check.status} detail={check.detail} />)}
          </aside>
        </div>

        <section className="fw-boundary"><Boundary label="01 / SOURCE" title="Observe" body="Use live public Solana and Jupiter evidence. Provider identity remains visible." /><Boundary label="02 / STATE" title="Classify" body="PASS, FLAG and UNKNOWN are distinct. Missing evidence does not become a neutral score." /><Boundary label="03 / AUTHORITY" title="Veto" body="Inspection informs execution authority; it does not directly authorize value movement." /></section>
        <footer className="fw-footer-rule"><span>no composite safety score</span><span>unknown remains unknown</span><span>source stays attached</span><span>inspection ≠ execution</span></footer>
      </div>
    </div>
  );
}

function VetoRow({ index, label, source, status, detail }: { index: number; label: string; source: string; status: ShieldCheck["status"] | "unknown"; detail: string }) {
  const symbol = status === "pass" ? "✓" : status === "flag" ? "!" : "?";
  return <div className="fw-veto-row"><span className="fw-veto-dot">{String(index).padStart(2, "0")}</span><span className="min-w-0"><b>{label}</b><small>{source}</small><small className="text-ink-mid">{detail}</small></span><span className={`fw-state fw-state--${status}`}>{symbol} {status.toUpperCase()}</span></div>;
}
function Boundary({ label, title, body }: { label: string; title: string; body: string }) { return <div className="fw-boundary-cell"><div className="fw-label">{label}</div><h3>{title}</h3><p>{body}</p></div>; }
function sourceFor(id: string): string { if (id.toLowerCase().includes("price")) return "Jupiter live quote"; if (id.toLowerCase().includes("holder")) return "Solana token accounts"; if (id.toLowerCase().includes("liquid")) return "Jupiter / live liquidity"; if (id.toLowerCase().includes("wash") || id.toLowerCase().includes("bundl")) return "Helius classifier path"; return "live inspection"; }
