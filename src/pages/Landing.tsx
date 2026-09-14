import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

export default function Landing() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const stats = useQuery(api.queries.public.publicStats);
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signUp");

  const openAuth = (mode: "signIn" | "signUp") => { setAuthMode(mode); setAuthOpen(true); };

  return (
    <div className="bg-white text-ink min-h-screen">
      <nav className="flex items-center justify-between px-4 sm:px-8 lg:px-10 py-5 border-b border-line">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-accent text-white font-extrabold flex items-center justify-center">A</div><div><div className="font-bold">Alpha Scout</div><div className="text-[10px] text-ink-faint uppercase tracking-wider">evidence-first</div></div></div>
        {isAuthenticated ? <Link to="/dashboard" className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">Dashboard →</Link> : <button onClick={() => openAuth("signIn")} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">Get started</button>}
      </nav>

      <header className="max-w-[1180px] mx-auto px-4 sm:px-8 py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex px-3 py-1.5 rounded-full bg-accent-light text-accent text-xs font-bold mb-5">SOLANA LAUNCH INTELLIGENCE · FAIL CLOSED</div>
          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold leading-[1.02] tracking-tight">Discover. Investigate. <span className="text-accent">Trade only what you can prove.</span></h1>
          <p className="text-lg text-ink-mid leading-relaxed mt-6 max-w-[620px]">Alpha Scout watches real pump.fun launches, qualifies them with live market and holder evidence, refuses critical unknowns, and records a receipt for every execute, reject or skip. The local harness is paper mode; ClawPump on-chain swaps are prepared separately and count only after signature and confirmation.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            {isAuthenticated ? <Link to="/dashboard" onClick={() => void ensureUser()} className="px-7 py-3.5 rounded-xl bg-accent text-white font-semibold">Open Alpha Scout</Link> : <button onClick={() => openAuth("signUp")} className="px-7 py-3.5 rounded-xl bg-accent text-white font-semibold">Create account</button>}
            {isAuthenticated && <Link to="/proof" className="px-7 py-3.5 rounded-xl border border-line font-semibold">View Live Proof</Link>}
          </div>
          <div className="grid grid-cols-3 gap-5 mt-10 max-w-[580px]">
            <Metric label="Verified on-chain volume" value={stats ? `${stats.verifiedOnchainVolumeSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL` : "…"} />
            <Metric label="Paper executions" value={stats ? String(stats.paperTrades) : "…"} />
            <Metric label="Agents deployed" value={stats ? String(stats.agentsDeployed) : "…"} />
          </div>
        </div>

        <div className="rounded-3xl border border-line shadow-[0_30px_70px_-30px_rgba(16,20,32,.3)] overflow-hidden">
          <div className="px-5 py-4 bg-surface border-b border-line flex justify-between items-center"><span className="font-mono text-xs text-ink-faint">decision_receipt/latest</span><span className="text-[10px] font-bold text-up">● PROOF PLANE</span></div>
          <div className="p-6 flex flex-col gap-4">
            <ProofRow k="OBSERVED" v="Jupiter price · liquidity · Solana holders · launch age" />
            <ProofRow k="UNKNOWN" v="Unknown liquidity or holder concentration blocks entry" />
            <ProofRow k="DECISION" v="EXECUTE / REJECT / SKIP with deterministic score + reasons" />
            <ProofRow k="EXECUTION" v="PAPER unless a signed, confirmed Solana transaction exists" />
            <div className="rounded-xl bg-accent-light border border-accent/30 p-4 text-sm text-accent font-semibold">No decorative PnL chart. No seeded activity. No paper volume presented as on-chain volume.</div>
          </div>
        </div>
      </header>

      <section className="bg-surface border-y border-line px-4 sm:px-8 py-16">
        <div className="max-w-[1180px] mx-auto grid md:grid-cols-3 gap-5">
          <Feature title="Alpha Evidence Engine" body="Scores only evidence the runtime can verify now: price, liquidity, holder concentration, freshness and bounded momentum. It does not pretend to predict guaranteed alpha." />
          <Feature title="Atomic signal claims" body="A transactional lease prevents concurrent cron/run-now cycles from opening the same launch twice. Stale claims expire safely." />
          <Feature title="ClawPump safety bridge" body="Uses the official v1 agent/swap APIs. High-risk and unverified-token acknowledgements stay false. Unsigned swap builds remain PREPARED, not EXECUTED." />
          <Feature title="Watch-only wallet boundary" body="Reading an attached wallet can never create paper buying power. Re-observing the same balance cannot inflate the portfolio." />
          <Feature title="One-minute risk loop" body="Stop-loss, take-profit and drawdown controls no longer wait fifteen minutes; webhook discovery remains primary with a five-minute reconciliation scan." />
          <Feature title="Judge-verifiable receipts" body="Every decision stores observations, unknowns, reasons, risk budget, mode and provider request IDs so a judge can inspect why the agent acted or refused." />
        </div>
      </section>

      <footer className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8 flex flex-wrap justify-between gap-3 text-sm text-ink-faint"><span>Alpha Scout · AnsemHack Clawrena 2026</span><span>Solana · ClawPump · pump.fun · Jupiter · Helius · Convex</span></footer>

      {authOpen && <AuthDialog mode={authMode} onClose={() => setAuthOpen(false)} onModeChange={setAuthMode} onSuccess={() => { setAuthOpen(false); navigate("/dashboard"); }} signIn={signIn} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><div className="font-mono text-xl sm:text-2xl font-extrabold">{value}</div><div className="text-[11px] text-ink-faint mt-1">{label}</div></div>; }
function ProofRow({ k, v }: { k: string; v: string }) { return <div className="grid grid-cols-[90px_1fr] gap-4 border-b border-line pb-4 last:border-0"><span className="text-[11px] font-bold text-accent">{k}</span><span className="text-sm text-ink-mid">{v}</span></div>; }
function Feature({ title, body }: { title: string; body: string }) { return <div className="bg-white border border-line rounded-2xl p-6"><h3 className="font-bold text-lg">{title}</h3><p className="text-sm text-ink-mid mt-2 leading-relaxed">{body}</p></div>; }

function AuthDialog({ mode, onClose, onModeChange, onSuccess, signIn }: {
  mode: "signIn" | "signUp";
  onClose: () => void;
  onModeChange: (mode: "signIn" | "signUp") => void;
  onSuccess: () => void;
  signIn: ReturnType<typeof useAuthActions>["signIn"];
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPending(true); setError(null);
    try { await signIn("password", { flow: mode, email: email.trim(), password }); onSuccess(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Authentication failed."); }
    finally { setPending(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white border border-line p-7" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex justify-between gap-4 mb-6"><div><div className="text-xs font-bold text-accent">ALPHA SCOUT</div><h2 className="text-2xl font-extrabold mt-1">{mode === "signUp" ? "Create your account" : "Welcome back"}</h2></div><button onClick={onClose} className="text-2xl text-ink-faint">×</button></div>
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <label className="text-sm font-semibold">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-surface px-4 py-3 font-normal" /></label>
          <label className="text-sm font-semibold">Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-surface px-4 py-3 font-normal" /></label>
          {error && <p className="rounded-lg bg-down-bg px-4 py-3 text-sm text-down">{error}</p>}
          <button disabled={pending} className="rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Connecting…" : mode === "signUp" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-mid">{mode === "signUp" ? "Already have an account?" : "New to Alpha Scout?"} <button type="button" onClick={() => onModeChange(mode === "signUp" ? "signIn" : "signUp")} className="font-semibold text-accent">{mode === "signUp" ? "Sign in" : "Create one"}</button></p>
      </div>
    </div>
  );
}
