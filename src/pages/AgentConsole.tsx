import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatSol, shorten } from "../lib/format";

type TreasuryView = {
  source: "clawpump_public_fee_ledger";
  sourceUrl: string;
  observedAt: number;
  agentId: string;
  creatorFeeSharePct: 75;
  totalEarned: number;
  totalSent: number;
  totalPending: number;
  totalHeld: number;
  recentDistributionCount: number;
  holderRevenueShare: false;
  automatedTreasurySpending: false;
};

export default function AgentConsole() {
  const data = useQuery(api.queries.portfolio.dashboard);
  const setWallet = useMutation(api.users.setWallet);
  const deployAgent = useMutation(api.agents.deployAgent);
  const setAgentState = useMutation(api.agents.setAgentState);
  const acknowledgeRiskHalt = useMutation(api.agents.acknowledgeRiskHalt);
  const updateRisk = useMutation(api.agents.updateAgentRisk);
  const depositSol = useMutation(api.portfolio.depositSol);
  const observeBalance = useAction(api.wallet.importWalletBalance);
  const runNow = useAction(api.runAgent.runNow);
  const syncClawPump = useAction(api.clawPump.syncAgent);
  const loadTreasury = useAction(api.clawPump.treasuryStatus);

  const [wallet, setWalletInput] = useState("");
  const [name, setName] = useState("Alpha Scout");
  const [auto, setAuto] = useState(true);
  const [maxPos, setMaxPos] = useState(2);
  const [maxDD, setMaxDD] = useState(10);
  const [depositAmt, setDepositAmt] = useState(1);
  const [treasury, setTreasury] = useState<TreasuryView | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (data === undefined || data === null) {
    return <div className="fw-page"><div className="fw-wrap fw-meta">Connecting authority room…</div></div>;
  }

  const { user, agent, portfolio } = data;
  const authority = agent?.status === "running" ? "ARMED / PAPER" : agent?.status === "halted" ? "HALTED" : agent ? "PAUSED" : "LOCKED";
  const clawPumpState = agent?.clawPumpAgentId ? "LINKED" : "NOT LINKED";

  const paperDeposit = async (event: FormEvent) => {
    event.preventDefault();
    await task(async () => {
      await depositSol({ amountSol: Number(depositAmt) });
      return `Added ${formatSol(Number(depositAmt))} to PAPER cash only.`;
    });
  };

  const observe = async () => {
    await task(async () => {
      const r = await observeBalance();
      return `Observed ${formatSol(r.balanceSol)} at ${shorten(r.walletAddress)}. Watch-only: 0 SOL was credited to paper cash.`;
    });
  };

  const deploy = async () => {
    await task(async () => {
      if (!user?.walletAddress) {
        if (!wallet.trim()) throw new Error("Attach a Solana address first");
        await setWallet({ walletAddress: wallet.trim() });
      }
      await deployAgent({ name, autoTrading: auto });
      return "Local Alpha Scout agent deployed in PAPER mode.";
    });
  };

  const saveRisk = async () => {
    if (!agent) return;
    await task(async () => {
      await updateRisk({ agentId: agent.id, riskMaxPosition: Number(maxPos), riskMaxDrawdownPct: Number(maxDD) });
      return "Risk envelope updated.";
    });
  };

  const toggle = async () => {
    if (!agent) return;
    await task(async () => {
      if (agent.status === "halted") {
        await acknowledgeRiskHalt({ agentId: agent.id, acknowledgement: "I understand the risk halt" });
        return "Risk halt acknowledged. Agent moved to paused; start it explicitly when ready.";
      }
      const status = agent.status === "running" ? "paused" : "running";
      await setAgentState({ agentId: agent.id, status });
      return status === "running" ? "Paper authority armed." : "Authority paused.";
    });
  };

  const runCycle = async () => {
    await task(async () => {
      const r = await runNow();
      return `Cycle ${r.outcome}: ${r.positionsProcessed ?? 0} checked, ${r.tradesExecuted ?? 0} paper execution(s).`;
    });
  };

  const linkClawPump = async () => {
    await task(async () => {
      const r = await syncClawPump();
      return `ClawPump agent ${r.existing ? "already linked" : "created and linked"}: ${r.id}. Live swaps still require signature + confirmation.`;
    });
  };

  const refreshTreasury = async () => {
    await task(async () => {
      const r = await loadTreasury();
      setTreasury(r as TreasuryView);
      return `Observed ClawPump creator-fee ledger for ${shorten(r.agentId)}.`;
    });
  };

  async function task(fn: () => Promise<string>) {
    setBusy(true);
    setMsg(null);
    try { setMsg(await fn()); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="fw-page">
      <div className="fw-wrap">
        <header className="fw-head">
          <div className="fw-head-copy">
            <div className="fw-index">02</div>
            <div>
              <div className="fw-kicker">AUTHORITY ROOM / AGENT + RISK</div>
              <h1>What is this agent allowed to do?</h1>
              <p>Execution authority is assembled from identity, risk, fresh evidence and provider state. No single signal can move value by itself.</p>
            </div>
          </div>
          <div className="fw-head-state">
            <div><span>Execution</span><b>PAPER</b></div>
            <div><span>Authority</span><b>{authority}</b></div>
            <div><span>ClawPump</span><b>{clawPumpState}</b></div>
          </div>
        </header>

        <section className="fw-strip">
          <StatusStat label="Observed wallet" value={portfolio?.observedWalletSol !== null && portfolio?.observedWalletSol !== undefined ? formatSol(portfolio.observedWalletSol) : "NOT OBSERVED"} note="read-only observation" />
          <StatusStat label="Paper cash" value={formatSol(portfolio?.cashSol ?? 0)} note="simulation buying power" />
          <StatusStat label="Max position" value={agent ? formatSol(agent.riskMaxPosition) : "—"} note="risk ceiling" />
          <StatusStat label="Drawdown cap" value={agent ? `${agent.riskMaxDrawdownPct}%` : "—"} note="high-water halt" />
        </section>

        <div className="fw-grid-main">
          <div className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">A</span>
                <div><h2>Authority chain</h2><p>Observation → veto → proof. Failure at any stage stops the path.</p></div>
              </div>
              <span className={`fw-badge ${agent?.status === "halted" ? "fw-badge--red" : "fw-badge--orange"}`}>FAIL-CLOSED</span>
            </div>

            <div className="fw-authority-state">
              <div>
                <div className="fw-label">CURRENT AUTHORITY STATE</div>
                <h3>{agent ? authority : "NO AGENT / NO AUTHORITY"}</h3>
                <p>{agent ? `${agent.name} exists locally, but its execution envelope remains paper-only unless every downstream authority check is satisfied.` : "A watch-only identity may be observed, but nothing is authorized until a local agent and explicit risk envelope exist."}</p>
              </div>
              <div className="fw-lock">{agent ? (agent.status === "running" ? "ARMED" : "LOCKED") : "LOCKED"}</div>
            </div>

            <div className="fw-chain">
              <ChainStep code="01 / OBSERVE" title="Live evidence" body="Price, liquidity, economic-owner concentration and launch age come from live sources." />
              <ChainStep code="02 / VETO" title="Refuse unknown" body="Unknown or stale critical evidence is a blocking state, not a low-confidence pass." />
              <ChainStep code="03 / PROVE" title="Receipt first" body="Execute, reject, skip and prepare remain separate. Unsigned or unconfirmed actions never become verified volume." />
            </div>

            <div className="fw-sheet-head">
              <div className="fw-sheet-title">
                <span className="fw-sheet-no">B</span>
                <div><h2>Economic boundary</h2><p>What can be observed is not automatically spendable.</p></div>
              </div>
              <span className="fw-badge">PAPER ≠ WALLET</span>
            </div>
            <div className="fw-row"><span>Watch-only address</span><strong>{user?.walletAddress ? shorten(user.walletAddress) : "NOT ATTACHED"}</strong><small>observation only</small></div>
            <div className="fw-row"><span>Observed balance</span><strong>{portfolio?.observedWalletSol !== null && portfolio?.observedWalletSol !== undefined ? formatSol(portfolio.observedWalletSol) : "UNKNOWN"}</strong><small>never credits paper cash</small></div>
            <div className="fw-row"><span>Paper capital</span><strong>{formatSol(portfolio?.cashSol ?? 0)}</strong><small>manual simulation deposit</small></div>
            <div className="fw-row"><span>On-chain authority</span><strong>SEPARATELY GATED</strong><small>prepare ≠ execute</small></div>
          </div>

          <aside className="fw-sheet">
            <div className="fw-sheet-head">
              <div className="fw-sheet-title"><span className="fw-sheet-no">C</span><div><h2>Control rail</h2><p>Explicit operator actions only.</p></div></div>
              <span className="fw-badge">{busy ? "BUSY" : "READY"}</span>
            </div>

            <div className="fw-control">
              <div className="fw-control-head"><b>Identity + local agent</b><span>{agent ? "DEPLOYED" : "STEP 01"}</span></div>
              {!user?.walletAddress && <input value={wallet} onChange={(e) => setWalletInput(e.target.value)} placeholder="Watch-only Solana address" className="fw-input fw-input--mono" />}
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" className="fw-input mt-2" />
              <label className="mt-3 flex items-center justify-between text-[11px]"><span>Auto trading / paper</span><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /></label>
              <button disabled={busy || Boolean(agent)} onClick={() => void deploy()} className="fw-button fw-button--orange w-full mt-3">{agent ? "LOCAL AGENT DEPLOYED" : "DEPLOY LOCAL AGENT"}</button>
            </div>

            <div className="fw-control">
              <div className="fw-control-head"><b>Funding boundary</b><span>PAPER ONLY</span></div>
              <form onSubmit={(e) => void paperDeposit(e)} className="fw-inline">
                <input type="number" min="0.1" step="0.1" value={depositAmt} onChange={(e) => setDepositAmt(Number(e.target.value))} className="fw-input fw-input--mono" />
                <button disabled={busy} className="fw-button">ADD PAPER</button>
              </form>
              {user?.walletAddress && <button disabled={busy} onClick={() => void observe()} className="fw-button fw-button--line w-full mt-2">OBSERVE WALLET BALANCE</button>}
            </div>

            {agent && <div className="fw-control">
              <div className="fw-control-head"><b>Risk envelope</b><span>STEP 02</span></div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-semibold">MAX POSITION / SOL<input type="number" value={maxPos} onChange={(e) => setMaxPos(Number(e.target.value))} className="fw-input fw-input--mono mt-1" /></label>
                <label className="text-[10px] font-semibold">MAX DRAWDOWN / %<input type="number" value={maxDD} onChange={(e) => setMaxDD(Number(e.target.value))} className="fw-input fw-input--mono mt-1" /></label>
              </div>
              <button disabled={busy} onClick={() => void saveRisk()} className="fw-button fw-button--line w-full mt-2">COMMIT RISK ENVELOPE</button>
            </div>}

            {agent && <div className="fw-control">
              <div className="fw-control-head"><b>Runtime authority</b><span>STEP 03</span></div>
              <div className="grid grid-cols-2 gap-2">
                <button disabled={busy} onClick={() => void toggle()} className={`fw-button ${agent.status === "halted" ? "fw-button--danger" : ""}`}>{agent.status === "halted" ? "ACK HALT" : agent.status === "running" ? "PAUSE" : "ARM PAPER"}</button>
                <button disabled={busy} onClick={() => void runCycle()} className="fw-button fw-button--line">RUN ONE CYCLE</button>
              </div>
              <button disabled={busy || Boolean(agent.clawPumpAgentId)} onClick={() => void linkClawPump()} className="fw-button fw-button--line w-full mt-2">{agent.clawPumpAgentId ? "CLAWPUMP LINKED" : "LINK CLAWPUMP AGENT"}</button>
            </div>}

            {msg && <div className="fw-action-message">{msg}</div>}
          </aside>
        </div>

        <section className="fw-sheet mt-[18px]">
          <div className="fw-sheet-head">
            <div className="fw-sheet-title"><span className="fw-sheet-no">D</span><div><h2>Agent Treasury</h2><p>Observed creator-fee ledger only.</p></div></div>
            <span className={`fw-badge ${treasury ? "fw-badge--green" : ""}`}>{treasury ? "OBSERVED" : agent?.clawPumpAgentId ? "AVAILABLE" : "NOT LINKED"}</span>
          </div>
          {treasury ? <>
            <div className="fw-treasury">
              <TreasuryCell label="Earned" value={formatSol(treasury.totalEarned)} />
              <TreasuryCell label="Sent" value={formatSol(treasury.totalSent)} />
              <TreasuryCell label="Pending" value={formatSol(treasury.totalPending)} />
              <TreasuryCell label="Held" value={formatSol(treasury.totalHeld)} />
            </div>
            <div className="fw-body flex items-start justify-between gap-5 flex-wrap">
              <p className="max-w-3xl text-[11px] leading-relaxed text-ink-mid">ClawPump documents a {treasury.creatorFeeSharePct}% creator share for token trading fees. This surface observes the linked agent's public fee ledger and does <b>not</b> claim holder revenue share, governance, buybacks, yield or automated treasury spending.</p>
              <button disabled={busy} onClick={() => void refreshTreasury()} className="fw-button fw-button--line">REFRESH LEDGER</button>
            </div>
          </> : <div className="fw-empty"><div className="fw-empty-inner"><div className="fw-empty-mark">T</div><h3>{agent?.clawPumpAgentId ? "Ledger not observed yet" : "No linked ClawPump identity"}</h3><p>{agent?.clawPumpAgentId ? "Read the public creator-fee ledger. A zero balance is still valid evidence." : "Link the agent first. The treasury surface stays empty rather than fabricating token economics."}</p>{agent?.clawPumpAgentId && <button disabled={busy} onClick={() => void refreshTreasury()} className="fw-button mt-4">OBSERVE CREATOR FEES</button>}</div></div>}
        </section>

        <footer className="fw-footer-rule"><span>Unknown ≠ pass</span><span>Watch-only ≠ buying power</span><span>Prepare ≠ execute</span><span>Real failure &gt; fake success</span></footer>
      </div>
    </div>
  );
}

function StatusStat({ label, value, note }: { label: string; value: string; note: string }) { return <div className="fw-stat"><span className="fw-label">{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function ChainStep({ code, title, body }: { code: string; title: string; body: string }) { return <div className="fw-chain-step"><div className="fw-meta">{code}</div><h4>{title}</h4><p>{body}</p></div>; }
function TreasuryCell({ label, value }: { label: string; value: string }) { return <div className="fw-treasury-cell"><span>{label}</span><b>{value}</b></div>; }
