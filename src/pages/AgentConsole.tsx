import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardBadge, EmptyState } from "../components/ui";
import { formatSol, shorten } from "../lib/format";

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

  const [wallet, setWalletInput] = useState("");
  const [name, setName] = useState("Alpha Scout");
  const [auto, setAuto] = useState(true);
  const [maxPos, setMaxPos] = useState(2);
  const [maxDD, setMaxDD] = useState(10);
  const [depositAmt, setDepositAmt] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (data === undefined || data === null) return <div className="p-8 text-sm text-ink-mid">Loading agent…</div>;
  const { user, agent, portfolio } = data;

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
      return "Risk parameters updated.";
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
      return status === "running" ? "Agent started." : "Agent paused.";
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

  async function task(fn: () => Promise<string>) {
    setBusy(true);
    setMsg(null);
    try { setMsg(await fn()); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto grid lg:grid-cols-3 gap-5 items-start">
      <div className="lg:col-span-2 flex flex-col gap-5">
        <Card title="Agent state" badge={<div className="flex gap-2"><PaperPill /><CardBadge>{agent?.status ?? "not deployed"}</CardBadge></div>} bodyClassName="p-5">
          {agent ? (
            <div className="text-sm text-ink-mid leading-relaxed">
              <b className="text-ink">{agent.name}</b> · local risk engine · max {formatSol(agent.riskMaxPosition)} per position · drawdown cap {agent.riskMaxDrawdownPct}%.
              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                <Tag>{agent.clawPumpAgentId ? `ClawPump linked ${shorten(agent.clawPumpAgentId)}` : "ClawPump not linked"}</Tag>
                <Tag>{portfolio?.observedWalletSol !== null && portfolio?.observedWalletSol !== undefined ? `watch balance ${formatSol(portfolio.observedWalletSol)}` : "wallet not observed"}</Tag>
                <Tag>paper cash {formatSol(portfolio?.cashSol ?? 0)}</Tag>
              </div>
            </div>
          ) : <EmptyState title="No agent" hint="Attach a watch-only Solana address, deploy the local agent, then optionally link a ClawPump agent." />}
        </Card>

        <Card title="Decision policy" badge={<CardBadge>evidence first</CardBadge>} bodyClassName="p-5">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Policy title="Observe" body="Price, liquidity, holder concentration and launch age come from live sources." />
            <Policy title="Refuse unknown" body="Unknown liquidity or holder concentration blocks entry instead of being treated as safe." />
            <Policy title="Prove" body="Every execute/reject/skip creates a receipt. Unsigned ClawPump swaps never count as on-chain volume." />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card title="Deploy local agent" bodyClassName="p-5 flex flex-col gap-3">
          {!user?.walletAddress && <input value={wallet} onChange={(e) => setWalletInput(e.target.value)} placeholder="Watch-only Solana address" className="px-4 py-3 rounded-lg bg-surface border border-line text-[13px] font-mono" />}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" className="px-4 py-3 rounded-lg bg-surface border border-line text-[13px]" />
          <label className="flex items-center justify-between text-sm"><span>Auto trading (paper)</span><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /></label>
          <button disabled={busy || Boolean(agent)} onClick={() => void deploy()} className="px-5 py-3 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50">{agent ? "Deployed" : "Deploy"}</button>
        </Card>

        <Card title="Funding boundary" badge={<CardBadge>PAPER ≠ WALLET</CardBadge>} bodyClassName="p-5 flex flex-col gap-3">
          <p className="text-[12px] text-ink-mid">Manual deposit adds paper cash. Wallet observation is read-only and never increases buying power.</p>
          <form onSubmit={(e) => void paperDeposit(e)} className="flex gap-2">
            <input type="number" min="0.1" step="0.1" value={depositAmt} onChange={(e) => setDepositAmt(Number(e.target.value))} className="min-w-0 flex-1 px-3 py-2.5 rounded-lg border border-line bg-surface font-mono" />
            <button disabled={busy} className="px-4 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold">Paper deposit</button>
          </form>
          {user?.walletAddress && <button disabled={busy} onClick={() => void observe()} className="px-4 py-2.5 rounded-lg border border-line text-xs font-semibold">Observe wallet balance</button>}
        </Card>

        {agent && <Card title="Risk & runtime" bodyClassName="p-5 flex flex-col gap-3">
          <label className="text-xs font-semibold">Max position SOL<input type="number" value={maxPos} onChange={(e) => setMaxPos(Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 rounded-lg border border-line bg-surface font-mono" /></label>
          <label className="text-xs font-semibold">Max drawdown %<input type="number" value={maxDD} onChange={(e) => setMaxDD(Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 rounded-lg border border-line bg-surface font-mono" /></label>
          <button disabled={busy} onClick={() => void saveRisk()} className="px-4 py-2.5 rounded-lg border border-line text-xs font-semibold">Save risk</button>
          <button disabled={busy} onClick={() => void toggle()} className="px-4 py-2.5 rounded-lg bg-accent text-white text-xs font-semibold">{agent.status === "halted" ? "Acknowledge risk halt" : agent.status === "running" ? "Pause" : "Start"}</button>
          <button disabled={busy} onClick={() => void runCycle()} className="px-4 py-2.5 rounded-lg border border-line text-xs font-semibold">Run cycle now</button>
          <button disabled={busy || Boolean(agent.clawPumpAgentId)} onClick={() => void linkClawPump()} className="px-4 py-2.5 rounded-lg border border-accent text-accent text-xs font-semibold">{agent.clawPumpAgentId ? "ClawPump linked" : "Link ClawPump agent"}</button>
        </Card>}

        {msg && <div className="rounded-lg bg-accent-light text-accent px-4 py-3 text-[13px] font-medium">{msg}</div>}
      </div>
    </div>
  );
}

function PaperPill() { return <span className="rounded bg-[#FFF4E0] border border-accent/40 text-accent text-[9px] font-bold px-1.5 py-0.5 tracking-wide">PAPER</span>; }
function Tag({ children }: { children: ReactNode }) { return <span className="rounded-md border border-line bg-surface px-2 py-1">{children}</span>; }
function Policy({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-line bg-surface p-4"><div className="font-bold text-ink">{title}</div><div className="text-ink-mid mt-1 text-[13px] leading-relaxed">{body}</div></div>; }
