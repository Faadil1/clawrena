import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardBadge, EmptyState } from "../components/ui";
import { formatSol, shorten, timeAgo } from "../lib/format";

export default function Proof() {
  const data = useQuery(api.queries.portfolio.dashboard);
  const stats = useQuery(api.queries.public.publicStats);
  if (data === undefined || data === null) return <div className="p-8 text-sm text-ink-mid">Loading proof plane…</div>;

  const receipts = data.decisionReceipts ?? [];
  const verifiedVolume = stats?.verifiedOnchainVolumeSol ?? 0;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto flex flex-col gap-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Live Proof</div>
        <h1 className="text-3xl font-extrabold mt-1">What the agent knew, refused, and executed.</h1>
        <p className="text-ink-mid mt-2 max-w-3xl">Every entry decision separates observed evidence, unknowns, reasons and execution mode. Only confirmed on-chain trades with a transaction signature count toward verified volume.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Verified on-chain volume" value={formatSol(verifiedVolume)} />
        <Stat label="Paper volume" value={formatSol(data.portfolio?.paperVolumeSol ?? 0)} />
        <Stat label="Decision receipts" value={String(receipts.length)} />
      </div>

      <Card title="Execution boundary" badge={<CardBadge>FAIL CLOSED</CardBadge>} bodyClassName="p-5">
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <Boundary title="OBSERVED" body="Live Jupiter price/liquidity, Solana holder concentration, launch timestamp and provider request ids." />
          <Boundary title="UNKNOWN" body="Unknown holder or liquidity evidence blocks entry. An unsigned ClawPump swap remains unexecuted." />
          <Boundary title="PROVED" body="On-chain volume requires executionMode=onchain plus an independently stored transaction signature." />
        </div>
      </Card>

      <Card title="Decision receipts" badge={<CardBadge>{receipts.length} recent</CardBadge>}>
        {receipts.length === 0 ? (
          <EmptyState icon="✓" title="No receipts yet" hint="Run the scanner and an agent cycle. Rejects and paper entries will appear here without inventing activity." />
        ) : (
          <div className="divide-y divide-line">
            {receipts.map((r) => (
              <div key={r._id} className="p-5 grid lg:grid-cols-[140px_1fr_120px] gap-4 items-start">
                <div>
                  <div className="text-[11px] font-bold uppercase text-ink-faint">{r.executionMode}</div>
                  <div className={`text-sm font-bold mt-1 ${r.decision === "reject" ? "text-down" : r.decision === "execute" ? "text-up" : "text-accent"}`}>{r.decision.toUpperCase()}</div>
                  <div className="text-[11px] text-ink-faint mt-1">{timeAgo(r.createdAt)}</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-ink-mid">{shorten(r.tokenMint)}</div>
                  <div className="text-sm font-semibold mt-1">Evidence score {r.score ?? "—"}/100</div>
                  <div className="text-[13px] text-ink-mid mt-2">{r.reasons.join(" · ") || "No reason recorded"}</div>
                  {r.unknowns.length > 0 && <div className="text-[12px] text-accent mt-2">Unknown: {r.unknowns.join(", ")}</div>}
                </div>
                <div className="text-right text-[12px] text-ink-faint">
                  {r.riskBudgetSol !== undefined ? formatSol(r.riskBudgetSol) : "—"}
                  {r.txSignature && <div className="font-mono mt-1">{shorten(r.txSignature)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Boundary({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-line bg-surface p-4"><div className="text-[11px] font-bold text-accent">{title}</div><p className="text-ink-mid mt-2 leading-relaxed">{body}</p></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card p-5"><div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div><div className="font-mono text-2xl font-bold mt-2">{value}</div></div>;
}
