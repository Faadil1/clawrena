import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import "./landing.css";

const pipeline = [
  ["01", "Discover", "listen"],
  ["02", "Claim", "lease"],
  ["03", "Investigate", "evidence"],
  ["04", "Qualify", "veto"],
  ["05", "Execute / Refuse", "authority"],
  ["06", "Prove", "receipt"],
] as const;

const records = [
  ["01", "Observe the launch", "Only verified Pump create instructions enter the dossier. Token balance deltas are not treated as launch proof.", "REAL SOURCE"],
  ["02", "Claim it atomically", "One agent gets one lease on one signal. Concurrent cycles cannot silently open the same launch twice.", "NO DOUBLE OPEN"],
  ["03", "Build the evidence record", "Price, liquidity, launch age and sampled economic-owner concentration are gathered before authority is considered.", "OBSERVED / UNKNOWN"],
  ["04", "Let unknowns veto", "Critical missing liquidity or holder evidence does not become a neutral score. UNKNOWN blocks the action.", "FAIL-CLOSED"],
  ["05", "Separate preparation from execution", "Paper, prepared, pending on-chain and independently confirmed states remain distinct all the way to public metrics.", "AUTHORITY BOUNDARY"],
  ["06", "Leave a receipt", "Every execute, reject, skip or prepare decision keeps the evidence, reasons, unknowns and risk budget visible for review.", "JUDGE VERIFIABLE"],
] as const;

const proofRows = [
  ["Observed", "Evidence is allowed in", "Live market facts and provider identifiers can support a decision."],
  ["Unknown", "Evidence can veto", "Critical unknowns remain visible and can block authority instead of being scored away."],
  ["Decision", "The system must choose", "EXECUTE, REJECT, SKIP or PREPARE is recorded with reasons — abstention is a valid outcome."],
  ["Proved", "Claims stop at the boundary", "Verified volume requires on-chain mode, a transaction signature and an independent confirmation slot."],
] as const;

export default function Landing() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const stats = useQuery(api.queries.public.publicStats);
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signUp");

  const openAuth = (mode: "signIn" | "signUp") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const enterDesk = async () => {
    if (isAuthenticated) {
      await ensureUser();
      navigate("/dashboard");
      return;
    }
    openAuth("signUp");
  };

  return (
    <div className="landing-shell">
      <nav className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">A</span>
          <span>
            <b>ALPHA SCOUT</b>
            <small>LAUNCH EVIDENCE OS</small>
          </span>
        </Link>

        <div className="landing-nav-center">
          <span className="inline-flex items-center gap-2"><span className="landing-live-dot" /> Convex live</span>
          <span>Solana</span>
          <span>Fail-closed</span>
          <span>Paper default</span>
        </div>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={() => void ensureUser()} className="landing-nav-button">Open desk →</Link>
          ) : (
            <button onClick={() => openAuth("signIn")} className="landing-nav-button">Sign in</button>
          )}
        </div>
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow">SOLANA LAUNCH INTELLIGENCE / EXECUTION AUTHORITY</div>
            <h1 className="landing-title">
              A launch is a claim.
              <em>Evidence decides if capital moves.</em>
            </h1>
            <p className="landing-lead">
              Alpha Scout watches real launches, builds an evidence record and keeps execution authority locked until the market facts are good enough to act — or refuse.
            </p>

            <div className="landing-actions">
              <button onClick={() => void enterDesk()} className="landing-primary">
                {isAuthenticated ? "Enter investigation desk →" : "Open an investigation →"}
              </button>
              {isAuthenticated ? (
                <Link to="/proof" className="landing-secondary">Open receipt ledger</Link>
              ) : (
                <button onClick={() => openAuth("signIn")} className="landing-secondary">I already have access</button>
              )}
            </div>

            <div className="landing-truth-line">
              <span>UNKNOWN ≠ PASS</span>
              <span>PREPARE ≠ EXECUTE</span>
              <span>PAPER ≠ ONCHAIN</span>
              <span>REAL FAILURE &gt; FAKE SUCCESS</span>
            </div>
          </div>

          <aside className="landing-authority" aria-label="Default execution authority">
            <div className="landing-authority-head">
              <div>
                <span>LIVE AUTHORITY RECORD</span>
                <strong className="block mt-2">Default state before evidence</strong>
              </div>
              <span>AS / 00</span>
            </div>

            <div className="landing-lock">
              <div>
                <div className="landing-eyebrow">EXECUTION AUTHORITY</div>
                <div className="landing-lock-word">LOCKED.</div>
              </div>
              <p className="landing-lock-copy">
                No launch earns authority by existing. The record must establish enough live evidence to qualify — otherwise the correct output is refusal.
              </p>
            </div>

            <div className="landing-status-list">
              <StatusRow k="Market input" v="REAL ONLY" tone="green" />
              <StatusRow k="Critical unknown" v="VETO" tone="accent" />
              <StatusRow k="Execution default" v="PAPER" />
              <StatusRow k="Verified on-chain" v="SIG + CONFIRM" />
            </div>

            <div className="landing-authority-foot">
              This is an authority boundary, not a prediction score. Alpha Scout can be useful when the answer is “do not trade.”
            </div>
          </aside>
        </section>

        <section className="landing-pipeline" aria-label="Alpha Scout evidence pipeline">
          {pipeline.map(([no, label, state]) => (
            <div className="landing-stage" key={no}>
              <span className="landing-stage-no">{no}</span>
              <b>{label}</b>
              <span className="landing-stage-state">{state}</span>
            </div>
          ))}
        </section>

        <section className="landing-stat-strip">
          <LandingStat
            label="Verified on-chain volume"
            value={stats ? `${stats.verifiedOnchainVolumeSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL` : "…"}
            note="signature + confirmation required"
          />
          <LandingStat label="Paper executions" value={stats ? String(stats.paperTrades) : "…"} note="kept separate from on-chain" />
          <LandingStat label="Agents deployed" value={stats ? String(stats.agentsDeployed) : "…"} note="live public runtime count" />
        </section>

        <section className="landing-section landing-thesis">
          <div className="landing-thesis-copy">
            <div className="landing-eyebrow">THE DIFFERENTIATOR</div>
            <h2>Refusal is not a failure. It is an evidence-backed outcome.</h2>
            <p>
              Most launch tooling optimizes for finding something to trade. Alpha Scout optimizes for knowing when the evidence is strong enough to authorize action — and preserving the record when it is not.
            </p>
          </div>

          <div className="landing-proof-register">
            {proofRows.map(([key, title, body]) => (
              <div className="landing-proof-row" key={key}>
                <span className="landing-proof-key">{key}</span>
                <div>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section landing-sequence">
          <div className="landing-sequence-head">
            <div>
              <div className="landing-eyebrow">ONE RECORD / SIX GATES</div>
              <h2 className="landing-sequence-title">The trade is the last line, not the first.</h2>
            </div>
            <p>
              The system moves a launch through an investigation chain. Each transition adds evidence or removes authority. Nothing is upgraded to “safe” because the demo needs activity.
            </p>
          </div>

          <div className="landing-records">
            {records.map(([no, title, body, label]) => (
              <div className="landing-record" key={no}>
                <span className="landing-record-no">{no}</span>
                <strong>{title}</strong>
                <p>{body}</p>
                <span className="landing-record-label">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section landing-failures">
          <div className="landing-failure-intro">
            <div className="landing-eyebrow">REAL FAILURE &gt; FAKE SUCCESS</div>
            <h2 className="landing-failure-title">Designed after failure, not despite it.</h2>
            <p>
              External incidents are used as requirement evidence, not as Alpha Scout results. They explain why liquidity, ownership and venue health need veto power.
            </p>
          </div>

          <div className="landing-case-list">
            <FailureCase
              id="CASE / LIBRA / 2025"
              title="Momentum did not equal safety."
              body="Creator-linked liquidity withdrawals and broad trader losses are a concrete reminder that launch attention is not execution authority. Alpha Scout therefore keeps owner concentration, liquidity and critical UNKNOWN evidence in the veto path."
              href="https://www.reuters.com/world/americas/crypto-worth-99-million-withdrawn-milei-backed-libra-token-researchers-say-2025-02-20/"
            />
            <FailureCase
              id="CASE / PUMP.FUN / 2024"
              title="Venue health is its own risk surface."
              body="A privileged-access exploit forced a trading halt. Token quality alone could not make execution safe, which is why Alpha Scout separates evidence about the asset from execution-provider authority."
              href="https://www.theblock.co/news/regulation/2024-05-16-pump-fun-post-mortem-295029"
            />
          </div>
        </section>

        <section className="landing-section landing-cta">
          <h2>
            Don’t ask whether the agent traded.
            <span> Ask whether the record earned authority.</span>
          </h2>
          <button onClick={() => void enterDesk()} className="landing-primary">
            {isAuthenticated ? "Open the desk →" : "Create access →"}
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <span>ALPHA SCOUT / ANSEMHACK CLAWRENA 2026</span>
        <span>SOLANA · CLAWPUMP · PUMP.FUN · JUPITER · HELIUS · CONVEX</span>
      </footer>

      {authOpen && (
        <AuthDialog
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onModeChange={setAuthMode}
          onSuccess={() => {
            setAuthOpen(false);
            navigate("/dashboard");
          }}
          signIn={signIn}
        />
      )}
    </div>
  );
}

function StatusRow({ k, v, tone }: { k: string; v: string; tone?: "accent" | "green" }) {
  return (
    <div className="landing-status-row">
      <span className="landing-status-key">{k}</span>
      <span className={`landing-status-value ${tone ? `landing-status-value--${tone}` : ""}`}>{v}</span>
    </div>
  );
}

function LandingStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="landing-stat">
      <div className="landing-stat-label">{label}</div>
      <div className="landing-stat-value">{value}</div>
      <div className="landing-stat-note">{note}</div>
    </div>
  );
}

function FailureCase({ id, title, body, href }: { id: string; title: string; body: string; href: string }) {
  return (
    <article className="landing-case">
      <div className="landing-case-id">{id}</div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <a href={href} target="_blank" rel="noreferrer">Source ↗</a>
    </article>
  );
}

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
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn("password", { flow: mode, email: email.trim(), password });
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="landing-modal-backdrop" onMouseDown={onClose}>
      <div className="landing-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="landing-modal-head">
          <div>
            <div className="landing-eyebrow">ALPHA SCOUT / ACCESS</div>
            <h2>{mode === "signUp" ? "Open an investigation desk" : "Return to the desk"}</h2>
          </div>
          <button onClick={onClose} className="landing-modal-close" aria-label="Close">×</button>
        </div>

        <form onSubmit={(event) => void submit(event)}>
          <label>
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label>
            Password
            <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signUp" ? "new-password" : "current-password"} />
          </label>
          {error && <p className="landing-modal-error">{error}</p>}
          <button disabled={pending} className="landing-modal-submit">
            {pending ? "Connecting…" : mode === "signUp" ? "Create access" : "Sign in"}
          </button>
        </form>

        <p className="landing-modal-switch">
          {mode === "signUp" ? "Already have access?" : "Need an account?"}{" "}
          <button type="button" onClick={() => onModeChange(mode === "signUp" ? "signIn" : "signUp")}>
            {mode === "signUp" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
