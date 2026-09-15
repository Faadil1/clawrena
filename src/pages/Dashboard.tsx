import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatSol, shorten, timeAgo } from "../lib/format";

type PositionRow = {
  _id: string;
  tokenSymbol?: string;
  tokenMint: string;
  sizeSol: number;
  pnlPct: number;
};

type TradeRow = {
  _id: string;
  direction: "buy" | "sell";
  tokenSymbol?: string;
  tokenMint: string;
  executionMode?: "paper" | "onchain";
  txSignature?: string;
  confirmationSlot?: number;
  amountSol: number;
  timestamp: number;
};

type ReceiptRow = {
  _id: string;
  decision: "execute" | "reject" | "skip" | "prepare";
  executionMode: "paper" | "onchain";
  score?: number;
  tokenMint: string;
  unknowns?: string[];
  reasons: string[];
  createdAt: number;
};

type SignalRow = {
  _id: string;
  processedAt: number;
  type: "buy" | "sell" | "warn" | "new-launch" | "alert";
  title: string;
  tokenSymbol?: string;
  detail: string;
  tokenMint: string;
  confidence: number;
};

export default function Dashboard() {
  const data = useQuery(api.queries.portfolio.dashboard);
  if (data === undefined || data === null) {
    return <div className="fw-page"><div className="fw-wrap fw-meta">Opening surveillance desk…</div></div>;
  }

  const portfolio = data.portfolio;
  const agent = data.agent;
  const receipts = (data.decisionReceipts ?? []) as ReceiptRow[];
  const positions = (data.positions ?? []) as PositionRow[];
  const trades = (data.trades ?? []) as TradeRow[];
  const signals = (data.signals ?? []) as SignalRow[];
  const latest = receipts[0];
  const authority = agent?.status === "running" ? "ARMED / PAPER" : agent?.status === "halted" ? "HALTED" : agent ? "PAUSED" : "LOCKED";
  const claim = latest ? latest.decision.toUpperCase() : "NO CLAIM";

  return (
    <div className="fw-page">
      <div className="fw-wrap">
        <header className="fw-head">
          <div className="fw-head-copy">
            <div className="fw-index">01</div>
            <div>
              <div className="fw-kicker">SURVEILLANCE DESK / SOLANA LAUNCHES</div>
              <h1>Find the launch. Prove the decision.</h1>
              <p>Alpha Scout watches new launches, investigates the evidence and keeps execution authority locked until the record is good enough to act — or refuse.</p>
            </div>
          </div>
          <div className="fw-head-state">
            <div><span>Execution</span><b>PAPER</b></div>
            <div><span>Authority</span><b>{authority}</b></div>
            <div><span>Latest claim</span><b>{claim}</b></div>
          </div>
        </header>

        <section className="fw-proof-banner">
          <div className="fw-proof-banner-main">
            <div className="fw-label">{latest ? "LATEST DECISION RECEIPT" : "CURRENT MARKET STATE"}</div>
            <h2>{latest ? decisionHeadline(latest.decision) : "Waiting for a real launch observation."}</h2>
            <p>{latest ? `${shorten(latest.tokenMint)} · ${latest.executionMode.toUpperCase()} · score ${latest.score ?? "—"}/100. ${latest.reasons[0] ?? "Receipt recorded."}` : "The desk is live, but activity is allowed to be empty. No launch candidate is inserted just to make the demo look active."}</p>
          </div>
          <div className="fw-proof-banner-state">
            <div>
              <b>{latest ? latest.decision.toUpperCase() : "LOCKED"}</b>
              <span>{latest ? `${latest.unknowns?.length ?? 0} UNKNOWN` : "NO CLAIM / NO AUTHORITY"}</span>
            </div>
          </div>
        </section>

        <section className="fw-strip">
          <StatusStat label="Paper NAV" value={formatSol(portfolio?.portfolioValue ?? 0)} note="simulated capital" />
          <StatusStat label="Realized PnL" value={formatSol(portfolio?.realizedPnl ?? 0)} note="paper only" />
          <StatusStat label="Verified volume" value={formatSol(portfolio?.verifiedOnchainVolumeSol ?? 0)} note="signature + confirmation" />
          <StatusStat label="Decision receipts" value={String(receipts.length)} note="audit trail" />
        </section>

        <div className="fw-grid-main">
          <section className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">A</span>
                <div><h2>Launch tape</h2><p>Real observations only. Open a subject to inspect it.</p></div>
              </div>
              <Link to="/signals" className="fw-badge">OPEN FULL TAPE →</Link>
            </div>
            {signals.length === 0 ? (
              <>
                <div className="fw-scanline"><span /></div>
                <div className="fw-empty">
                  <div className="fw-empty-inner">
                    <div className="fw-empty-mark">RX</div>
                    <div className="fw-kicker">SCANNER ARMED</div>
                    <h3 className="mt-2">No launch has entered the dossier yet.</h3>
                    <p>Pump create verification, price/liquidity enrichment and owner concentration remain waiting. This is an operational state, not a missing demo fixture.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="fw-tape">
                <div className="fw-tape-head"><span>Observed</span><span>Type</span><span>Finding</span><span>Mint</span><span>Conf.</span></div>
                {signals.slice(0, 7).map((signal) => (
                  <Link key={signal._id} to={`/token/${signal.tokenMint}`} className="fw-tape-row">
                    <span className="font-mono text-[9px] text-ink-faint">{timeAgo(signal.processedAt)}</span>
                    <span className={`fw-type fw-type--${signal.type}`}>{shortType(signal.type)}</span>
                    <span className="min-w-0"><b className="block truncate text-[12px]">{signal.title}{signal.tokenSymbol ? ` / $${signal.tokenSymbol}` : ""}</b><small className="block mt-1 text-[10px] text-ink-mid truncate">{signal.detail}</small></span>
                    <span className="font-mono text-[9px] text-ink-mid">{shorten(signal.tokenMint)}</span>
                    <span className="font-mono text-[12px] font-extrabold text-right">{Math.round(signal.confidence)}%</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">B</span>
                <div><h2>Evidence gate</h2><p>Latest execution authority.</p></div>
              </div>
              <span className="fw-badge fw-badge--orange">FAIL-CLOSED</span>
            </div>
            <div className="fw-body">
              <div className={`fw-authority-state !border !min-h-[120px] ${latest?.decision === "reject" ? "!bg-[#f7e7e4]" : ""}`}>
                <div>
                  <div className="fw-label">DECISION STATE</div>
                  <h3 className="!text-[28px]">{latest ? latest.decision.toUpperCase() : "NO CLAIM"}</h3>
                  <p>{latest ? `Evidence score ${latest.score ?? "—"}/100 · ${timeAgo(latest.createdAt)}` : "No launch has earned a decision yet."}</p>
                </div>
                <div className="fw-lock !w-[68px] !h-[68px]">{latest ? (latest.decision === "execute" ? "PASS" : "VETO") : "LOCK"}</div>
              </div>
            </div>
            <GateRow label="Claim" value={latest ? latest.decision.toUpperCase() : "NONE"} />
            <GateRow label="Critical unknowns" value={String(latest?.unknowns?.length ?? 0)} />
            <GateRow label="Execution mode" value={latest?.executionMode.toUpperCase() ?? "PAPER"} />
            <GateRow label="Authority" value={latest?.decision === "execute" ? "BOUNDED" : "LOCKED"} />
            <div className="fw-body pt-3">
              <Link to="/proof" className="fw-button w-full">OPEN EVIDENCE ROOM</Link>
            </div>
          </aside>
        </div>

        <div className="fw-grid-even">
          <section className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">C</span>
                <div><h2>Authority + risk</h2><p>What the agent can actually do right now.</p></div>
              </div>
              <Link to="/agent" className="fw-badge">OPEN AUTHORITY →</Link>
            </div>
            <div className="fw-row"><span>Agent</span><strong>{agent?.name ?? "NOT DEPLOYED"}</strong><small>{authority}</small></div>
            <div className="fw-row"><span>Max position</span><strong>{agent ? formatSol(agent.riskMaxPosition) : "—"}</strong><small>paper risk envelope</small></div>
            <div className="fw-row"><span>Drawdown cap</span><strong>{agent ? `${agent.riskMaxDrawdownPct}%` : "—"}</strong><small>high-water halt</small></div>
            <div className="fw-row"><span>Open paper positions</span><strong>{positions.length}</strong><small>{positions.length ? `${positions[0]?.tokenSymbol ?? "TOKEN"} ${positions[0]?.pnlPct >= 0 ? "+" : ""}${positions[0]?.pnlPct.toFixed(2)}%` : "no exposure"}</small></div>
            <div className="fw-row"><span>Observed wallet</span><strong>{portfolio?.observedWalletSol !== null && portfolio?.observedWalletSol !== undefined ? formatSol(portfolio.observedWalletSol) : "NOT OBSERVED"}</strong><small>watch-only</small></div>
          </section>

          <section className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">D</span>
                <div><h2>Execution ledger</h2><p>Paper, pending and verified never collapse.</p></div>
              </div>
              <span className="fw-badge">{trades.length} RECORDS</span>
            </div>
            {trades.length === 0 ? (
              <div className="fw-empty !min-h-[245px]">
                <div className="fw-empty-inner"><div className="fw-empty-mark">Ø</div><h3>No execution records.</h3><p>Nothing has moved. That state remains visible instead of being replaced by synthetic success.</p></div>
              </div>
            ) : (
              <>
                <div className="fw-ledger-head"><span>Observed</span><span>Mode</span><span>Subject</span><span>Amount</span></div>
                <div className="fw-ledger">
                  {trades.slice(0, 6).map((trade) => {
                    const mode = trade.executionMode === "onchain" ? (trade.txSignature && trade.confirmationSlot !== undefined ? "VERIFIED" : "PENDING") : "PAPER";
                    return (
                      <div key={trade._id} className="fw-ledger-row">
                        <span className="font-mono text-[9px] text-ink-faint">{timeAgo(trade.timestamp)}</span>
                        <span className={`fw-state ${mode === "VERIFIED" ? "fw-state--pass" : mode === "PENDING" ? "fw-state--unknown" : ""}`}>{mode}</span>
                        <span><b className="text-[11px]">{trade.direction.toUpperCase()} {trade.tokenSymbol ?? "TOKEN"}</b><small className="block mt-1 font-mono text-[9px] text-ink-faint">{shorten(trade.tokenMint)}</small></span>
                        <span className="font-mono text-[10px] text-right">{formatSol(trade.amountSol)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="fw-footer-rule">
          <span>live data may be empty</span>
          <span>unknown ≠ pass</span>
          <span>prepare ≠ execute</span>
          <span>real failure &gt; fake success</span>
        </footer>
      </div>
    </div>
  );
}

function StatusStat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="fw-stat"><span className="fw-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function GateRow({ label, value }: { label: string; value: string }) {
  return <div className="fw-row"><span>{label}</span><strong>{value}</strong><small>current state</small></div>;
}

function shortType(type: SignalRow["type"]): string {
  if (type === "new-launch") return "NEW";
  if (type === "warn") return "WARN";
  if (type === "alert") return "ALERT";
  return type.toUpperCase();
}

function decisionHeadline(decision: ReceiptRow["decision"]): string {
  if (decision === "reject") return "The system refused the trade.";
  if (decision === "execute") return "The evidence gate allowed bounded action.";
  if (decision === "prepare") return "The action was prepared, not executed.";
  return "The system abstained.";
}
