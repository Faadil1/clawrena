import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardBadge, EmptyState, Pnl } from "../components/ui";
import { formatSol, formatPrice, shorten, timeAgo } from "../lib/format";

type PositionRow = { _id: string; tokenSymbol?: string; tokenMint: string; currentPrice: number; sizeSol: number; pnlPct: number };
type TradeRow = { _id: string; direction: "buy" | "sell"; tokenSymbol?: string; tokenMint: string; executionMode?: "paper" | "onchain"; txSignature?: string; confirmationSlot?: number; amountSol: number; timestamp: number };
type ReceiptRow = { _id: string; decision: "execute" | "reject" | "skip" | "prepare"; score?: number; tokenMint: string; reasons: string[] };

export default function Dashboard() {
  const data = useQuery(api.queries.portfolio.dashboard);
  if (data === undefined || data === null) return <div className="p-8 text-sm text-ink-mid">Loading portfolio…</div>;
  const portfolio = data.portfolio;
  const receipts = (data.decisionReceipts ?? []) as ReceiptRow[];
  const positions = (data.positions ?? []) as PositionRow[];
  const trades = (data.trades ?? []) as TradeRow[];
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="text-2xl font-extrabold">Alpha Scout</h1><p className="text-sm text-ink-mid">Paper engine with a separately gated ClawPump on-chain bridge.</p></div>
        <Link to="/proof" className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">Open Live Proof →</Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Paper portfolio" value={formatSol(portfolio?.portfolioValue ?? 0)} sub="not on-chain capital" />
        <Stat label="Paper realized PnL" value={formatSol(portfolio?.realizedPnl ?? 0)} sub="simulated execution" />
        <Stat label="Verified on-chain volume" value={formatSol(portfolio?.verifiedOnchainVolumeSol ?? 0)} sub="signature + confirmation required" />
        <Stat label="Decision receipts" value={String(receipts.length)} sub="execute · reject · skip · prepare" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card title="Open paper positions" badge={<CardBadge>{positions.length}</CardBadge>}>
            {positions.length === 0 ? <EmptyState title="No paper positions" hint="A position appears only after a real launch observation passes the evidence gate and paper risk budget." /> : (
              <div className="divide-y divide-line">{positions.map((p: PositionRow) => <div key={p._id} className="p-4 grid grid-cols-[1fr_100px_100px_90px] gap-3 text-sm items-center"><div><b>{p.tokenSymbol ?? "Token"}</b><div className="font-mono text-[11px] text-ink-faint">{shorten(p.tokenMint)} · PAPER</div></div><span className="font-mono">{formatPrice(p.currentPrice)}</span><span>{formatSol(p.sizeSol)}</span><Pnl value={p.pnlPct} /></div>)}</div>
            )}
          </Card>
          <Card title="Recent execution records" badge={<CardBadge>{trades.length}</CardBadge>}>
            {trades.length === 0 ? <EmptyState title="No execution records" hint="Paper, pending on-chain and independently confirmed records are deliberately separated." /> : <div className="divide-y divide-line">{trades.slice(0, 8).map((t: TradeRow) => {
              const mode = t.executionMode === "onchain"
                ? (t.txSignature && t.confirmationSlot !== undefined ? "ONCHAIN VERIFIED" : "ONCHAIN PENDING")
                : "PAPER";
              return <div key={t._id} className="p-4 flex items-center justify-between gap-4 text-sm"><div><b>{t.direction.toUpperCase()} {t.tokenSymbol ?? "Token"}</b><div className="text-[11px] text-ink-faint font-mono">{shorten(t.tokenMint)} · {mode}</div></div><div className="text-right"><div className="font-mono">{formatSol(t.amountSol)}</div><div className="text-[11px] text-ink-faint">{timeAgo(t.timestamp)}</div></div></div>;
            })}</div>}
          </Card>
        </div>
        <Card title="Latest decisions" badge={<CardBadge>{receipts.length}</CardBadge>}>
          {receipts.length === 0 ? <EmptyState title="No decisions yet" hint="Run an agent cycle to generate proof receipts." /> : <div className="divide-y divide-line">{receipts.slice(0, 8).map((r: ReceiptRow) => <div key={r._id} className="p-4"><div className="flex justify-between gap-2"><b className="text-sm">{r.decision.toUpperCase()}</b><span className="font-mono text-xs">{r.score ?? "—"}/100</span></div><div className="font-mono text-[11px] text-ink-faint mt-1">{shorten(r.tokenMint)}</div><div className="text-[12px] text-ink-mid mt-2 line-clamp-2">{r.reasons.join(" · ")}</div></div>)}</div>}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className="card p-5"><div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div><div className="font-mono text-2xl font-bold mt-2">{value}</div><div className="text-[11px] text-ink-faint mt-1">{sub}</div></div>; }
