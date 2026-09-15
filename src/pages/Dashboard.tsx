import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatSol, shorten, timeAgo } from "../lib/format";

type PositionRow = {
  _id: string;
  tokenSymbol?: string;
  tokenMint: string;
  currentPrice: number;
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
    return <div className="ops-canvas p-8 text-xs font-mono uppercase tracking-wider text-ink-mid">Connecting surveillance desk…</div>;
  }

  const portfolio = data.portfolio;
  const agent = data.agent;
  const receipts = (data.decisionReceipts ?? []) as ReceiptRow[];
  const positions = (data.positions ?? []) as PositionRow[];
  const trades = (data.trades ?? []) as TradeRow[];
  const signals = (data.signals ?? []) as SignalRow[];
  const latestReceipt = receipts[0];
  const authority = agent?.status === "running" ? "ARMED / PAPER" : agent?.status === "halted" ? "HALTED" : agent ? "PAUSED" : "NOT DEPLOYED";

  return (
    <div className="ops-canvas">
      <div className="ops-page">
        <section className="ops-hero">
          <div>
            <div className="ops-kicker">SURVEILLANCE DESK / SOLANA LAUNCHES</div>
            <h1>Alpha Scout</h1>
            <p>Discover → investigate → qualify → execute / refuse → prove.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ops-chip ops-chip--paper">PAPER ENGINE</span>
            <span className={`ops-chip ${agent?.status === "halted" ? "ops-chip--danger" : ""}`}>{authority}</span>
            <Link to="/proof" className="ops-primary-action">OPEN PROOF ↗</Link>
          </div>
        </section>

        <section className="ops-metric-strip">
          <Metric label="Paper NAV" value={formatSol(portfolio?.portfolioValue ?? 0)} sub="simulated capital" />
          <Metric label="Realized PnL" value={formatSol(portfolio?.realizedPnl ?? 0)} sub="paper only" />
          <Metric label="Verified volume" value={formatSol(portfolio?.verifiedOnchainVolumeSol ?? 0)} sub="sig + confirmation" />
          <Metric label="Decision receipts" value={String(receipts.length)} sub="immutable reasoning trail" />
        </section>

        <div className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.8fr)] gap-4">
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-head">
              <div>
                <span className="ops-panel-index">01</span>
                <div>
                  <h2>Launch Tape</h2>
                  <p>Real observations only. No seeded candidates.</p>
                </div>
              </div>
              <Link to="/signals" className="ops-link">OPEN TAPE →</Link>
            </div>

            {signals.length === 0 ? (
              <ScannerIdle />
            ) : (
              <div className="divide-y divide-[#D7DAD0]">
                {signals.slice(0, 7).map((signal) => (
                  <div key={signal._id} className="ops-tape-row">
                    <div className="ops-tape-time">{timeAgo(signal.processedAt)}</div>
                    <div className={`ops-signal-code ops-signal-code--${signal.type}`}>{shortType(signal.type)}</div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <b className="truncate">{signal.title}</b>
                        {signal.tokenSymbol && <span className="font-mono text-[10px] text-ink-faint">${signal.tokenSymbol}</span>}
                      </div>
                      <div className="ops-tape-detail">{signal.detail}</div>
                      <div className="font-mono text-[10px] text-ink-faint mt-1">{shorten(signal.tokenMint)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold">{Math.round(signal.confidence)}%</div>
                      <div className="ops-tape-caption">CONF.</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ops-panel ops-gate-panel">
            <div className="ops-panel-head">
              <div>
                <span className="ops-panel-index">02</span>
                <div>
                  <h2>Evidence Gate</h2>
                  <p>Latest decision authority.</p>
                </div>
              </div>
              <span className="ops-mono-label">FAIL-CLOSED</span>
            </div>

            <div className="p-5 sm:p-6 flex flex-col gap-5">
              <div className={decisionStateClass(latestReceipt?.decision)}>
                <span>{decisionLabel(latestReceipt?.decision)}</span>
                <b>{latestReceipt?.score !== undefined ? `${Math.round(latestReceipt.score)}/100` : "—"}</b>
              </div>

              {latestReceipt ? (
                <>
                  <div>
                    <div className="ops-mono-label mb-2">SUBJECT</div>
                    <div className="font-mono text-sm font-semibold">{shorten(latestReceipt.tokenMint)}</div>
                    <div className="text-xs text-ink-mid mt-1">{timeAgo(latestReceipt.createdAt)} · {latestReceipt.executionMode.toUpperCase()}</div>
                  </div>
                  <GateRow label="Unknowns" value={String(latestReceipt.unknowns?.length ?? 0)} tone={(latestReceipt.unknowns?.length ?? 0) > 0 ? "warn" : "ok"} />
                  <div>
                    <div className="ops-mono-label mb-2">WHY</div>
                    <div className="space-y-2">
                      {latestReceipt.reasons.slice(0, 4).map((reason) => (
                        <div key={reason} className="ops-reason-row"><span>↳</span><span>{reason}</span></div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <GateRow label="Claim" value="NONE" />
                  <GateRow label="Liquidity" value="WAITING" />
                  <GateRow label="Owner concentration" value="WAITING" />
                  <GateRow label="Execution authority" value="LOCKED" tone="warn" />
                  <p className="text-xs leading-relaxed text-ink-mid pt-2">No decision exists yet. The desk stays locked until a real launch observation produces enough evidence to qualify or refuse.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid xl:grid-cols-[1.05fr_.95fr] gap-4">
          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-head">
              <div>
                <span className="ops-panel-index">03</span>
                <div>
                  <h2>Authority & Risk</h2>
                  <p>What the agent is actually allowed to do.</p>
                </div>
              </div>
              <Link to="/agent" className="ops-link">CONTROL →</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-b border-[#D7DAD0]">
              <AuthorityCell label="Agent" value={agent?.name ?? "Not deployed"} />
              <AuthorityCell label="State" value={authority} />
              <AuthorityCell label="Max position" value={agent ? formatSol(agent.riskMaxPosition) : "—"} />
              <AuthorityCell label="Drawdown cap" value={agent ? `${agent.riskMaxDrawdownPct}%` : "—"} />
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-5">
              <div>
                <div className="ops-section-label">OPEN PAPER POSITIONS / {positions.length}</div>
                {positions.length === 0 ? (
                  <CompactEmpty title="NONE OPEN" text="No capital is exposed. A position appears only after evidence and paper risk both pass." />
                ) : (
                  <div className="divide-y divide-[#D7DAD0]">
                    {positions.slice(0, 4).map((position) => (
                      <div key={position._id} className="py-3 grid grid-cols-[1fr_auto] gap-3 text-xs">
                        <div>
                          <b>{position.tokenSymbol ?? "TOKEN"}</b>
                          <div className="font-mono text-[10px] text-ink-faint mt-1">{shorten(position.tokenMint)}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div>{formatSol(position.sizeSol)}</div>
                          <div className={position.pnlPct >= 0 ? "text-up" : "text-down"}>{position.pnlPct >= 0 ? "+" : ""}{position.pnlPct.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="ops-section-label">FUNDING BOUNDARY</div>
                <div className="ops-boundary-block">
                  <BoundaryRow label="Paper cash" value={formatSol(portfolio?.cashSol ?? 0)} />
                  <BoundaryRow label="Observed wallet" value={portfolio?.observedWalletSol !== null && portfolio?.observedWalletSol !== undefined ? formatSol(portfolio.observedWalletSol) : "NOT OBSERVED"} />
                  <BoundaryRow label="On-chain authority" value="SEPARATELY GATED" />
                </div>
                <p className="text-[11px] text-ink-mid leading-relaxed mt-3">Observed wallet balance never becomes paper buying power. A prepared on-chain action is not verified volume.</p>
              </div>
            </div>
          </section>

          <section className="ops-panel overflow-hidden">
            <div className="ops-panel-head">
              <div>
                <span className="ops-panel-index">04</span>
                <div>
                  <h2>Receipt Ledger</h2>
                  <p>Execution states stay separated.</p>
                </div>
              </div>
              <span className="ops-mono-label">AUDIT TRAIL</span>
            </div>

            {trades.length === 0 ? (
              <div className="p-5">
                <CompactEmpty title="NO EXECUTION RECORDS" text="Paper, pending on-chain and independently confirmed records will appear here without collapsing their states." />
              </div>
            ) : (
              <div className="divide-y divide-[#D7DAD0]">
                {trades.slice(0, 6).map((trade) => {
                  const mode = trade.executionMode === "onchain"
                    ? (trade.txSignature && trade.confirmationSlot !== undefined ? "VERIFIED" : "PENDING")
                    : "PAPER";
                  return (
                    <div key={trade._id} className="ops-ledger-row">
                      <div className="font-mono text-[10px] text-ink-faint">{timeAgo(trade.timestamp)}</div>
                      <div>
                        <b className="text-xs">{trade.direction.toUpperCase()} {trade.tokenSymbol ?? "TOKEN"}</b>
                        <div className="font-mono text-[10px] text-ink-faint mt-1">{shorten(trade.tokenMint)}</div>
                      </div>
                      <span className={`ops-ledger-mode ops-ledger-mode--${mode.toLowerCase()}`}>{mode}</span>
                      <div className="text-right font-mono text-xs">{formatSol(trade.amountSol)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="ops-footer-note">
          <span>LIVE DATA IS ALLOWED TO BE EMPTY.</span>
          <span>UNKNOWN ≠ PASS.</span>
          <span>PREPARE ≠ EXECUTE.</span>
          <span>REAL FAILURE &gt; FAKE SUCCESS.</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="ops-metric">
      <div className="ops-metric-label">{label}</div>
      <div className="ops-metric-value">{value}</div>
      <div className="ops-metric-sub">{sub}</div>
    </div>
  );
}

function ScannerIdle() {
  const channels = [
    ["Pump create", "LISTENING"],
    ["Jupiter price / liquidity", "WAITING"],
    ["Economic owner concentration", "WAITING"],
    ["Evidence claim", "NO CLAIM"],
  ];
  return (
    <div className="p-5 sm:p-6">
      <div className="ops-listening-bar"><span /></div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="ops-section-label">SCANNER ARMED</div>
          <h3 className="text-lg font-extrabold mt-1">Waiting for a real launch observation.</h3>
        </div>
        <span className="ops-chip">NO SYNTHETIC ROWS</span>
      </div>
      <div className="border border-[#D7DAD0] divide-y divide-[#D7DAD0]">
        {channels.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-xs">
            <span className="text-ink-mid">{label}</span>
            <span className="font-mono text-[10px] tracking-wider font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GateRow({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#D7DAD0] pb-3 text-xs">
      <span className="text-ink-mid">{label}</span>
      <b className={`font-mono text-[10px] tracking-wider ${tone === "ok" ? "text-up" : tone === "warn" ? "text-down" : "text-ink"}`}>{value}</b>
    </div>
  );
}

function AuthorityCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border-r last:border-r-0 border-[#D7DAD0] min-w-0">
      <div className="ops-mono-label">{label}</div>
      <div className="font-mono text-xs font-bold mt-2 truncate">{value}</div>
    </div>
  );
}

function BoundaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b last:border-b-0 border-[#D7DAD0] text-xs">
      <span className="text-ink-mid">{label}</span>
      <b className="font-mono text-[10px] tracking-wide text-right">{value}</b>
    </div>
  );
}

function CompactEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-3 border-l-2 border-accent pl-4 py-1">
      <div className="font-mono text-[11px] font-bold tracking-wider">{title}</div>
      <div className="text-xs text-ink-mid leading-relaxed mt-1 max-w-xl">{text}</div>
    </div>
  );
}

function shortType(type: SignalRow["type"]): string {
  if (type === "new-launch") return "NEW";
  if (type === "buy") return "BUY";
  if (type === "sell") return "SELL";
  if (type === "warn") return "WARN";
  return "ALERT";
}

function decisionLabel(decision?: ReceiptRow["decision"]): string {
  if (decision === "execute") return "QUALIFIED";
  if (decision === "reject") return "REFUSED";
  if (decision === "skip") return "ABSTAIN";
  if (decision === "prepare") return "PREPARED";
  return "NO CLAIM";
}

function decisionStateClass(decision?: ReceiptRow["decision"]): string {
  if (decision === "execute") return "ops-decision-state ops-decision-state--ok";
  if (decision === "reject") return "ops-decision-state ops-decision-state--reject";
  if (decision === "skip") return "ops-decision-state ops-decision-state--skip";
  if (decision === "prepare") return "ops-decision-state ops-decision-state--prepare";
  return "ops-decision-state ops-decision-state--idle";
}
