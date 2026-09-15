import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import "./landing.css";

const flow = [
  ["01", "DISCOVER", "New launches"],
  ["02", "CLAIM", "Record the facts"],
  ["03", "INVESTIGATE", "Check evidence"],
  ["04", "QUALIFY", "Score & risk gates"],
  ["05", "EXECUTE / REFUSE", "Deterministic decision"],
  ["06", "PROVE", "Receipts"],
] as const;

const observed = [
  ["Pump create", "REQUIRED"],
  ["Jupiter price", "REQUIRED"],
  ["Liquidity", "REQUIRED"],
  ["Owner concentration", "REQUIRED"],
  ["Launch freshness", "REQUIRED"],
] as const;

const unknown = [
  ["Critical missing evidence", "VETO"],
  ["Venue health", "VETO"],
  ["Unconfirmed submission", "NOT VERIFIED"],
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

  const openScout = async () => {
    if (isAuthenticated) {
      await ensureUser();
      navigate("/dashboard");
      return;
    }
    openAuth("signUp");
  };

  return (
    <div className="judge-home">
      <header className="judge-nav">
        <Link to="/" className="judge-brand">
          <img src="/alpha-scout.svg" alt="" className="judge-logo" />
          <span>
            <b>ALPHA SCOUT</b>
            <small>EVIDENCE FIRST TRADER</small>
          </span>
        </Link>

        <nav className="judge-links" aria-label="Homepage sections">
          <a href="#method">How it works</a>
          <a href="#proof">Live proof</a>
          <a href="#method">Method</a>
        </nav>

        <div className="judge-nav-right">
          <span className="judge-live"><i /> SOLANA LIVE</span>
          <span className="judge-version">v0.1</span>
          <button onClick={() => void openScout()} className="judge-open">
            <img src="/alpha-scout.svg" alt="" />
            {isAuthenticated ? "Open desk" : "Open Alpha Scout"} <span>→</span>
          </button>
        </div>
      </header>

      <main className="judge-main">
        <section className="judge-hero">
          <div className="judge-hero-copy">
            <div className="judge-kicker">REAL LAUNCHES. REAL EVIDENCE. NO GUESSWORK.</div>
            <h1>
              Capital moves only
              <span>when <em>evidence says yes.</em></span>
            </h1>
            <p>
              Alpha Scout watches Solana launches, investigates the evidence, and only executes when the record is good enough.
              <strong> Unknowns, weak signals, or red flags? We refuse.</strong>
            </p>
          </div>

          <div className="judge-hero-mark" aria-hidden="true">
            <div className="judge-hero-words">OBSERVE<br />INVESTIGATE<br />VERIFY<br />EXECUTE<br />OR REFUSE</div>
            <img src="/alpha-scout.svg" alt="" />
            <div className="judge-standard">SAME<br />DATA<br />HIGHER<br />STANDARDS</div>
            <div className="judge-eq">ALPHA SCOUT<br />SOLANA<br />EVIDENCE &gt; OPINION</div>
          </div>
        </section>

        <section className="judge-status" aria-label="Execution boundaries">
          <Status icon="●" tone="green" title="LIVE MARKET" sub="MONITORING LAUNCHES" />
          <Status icon="▣" title="AUTHORITY LOCKED" sub="EXECUTION REQUIRES PROOF" />
          <Status icon="⊘" tone="red" title="UNKNOWN = VETO" sub="NO GUESSING" />
          <Status icon="▤" title="PAPER DEFAULT" sub="NO REAL CAPITAL BY DEFAULT" />
          <Status icon="✓" tone="olive" title="VERIFIED ON-CHAIN" sub="SIGNATURE + CONFIRMATION" />
        </section>

        <section id="method" className="judge-flow">
          <div className="judge-flow-label">THE<br />INVESTIGATION<br />FLOW</div>
          {flow.map(([no, title, sub], index) => (
            <div className="judge-flow-step" key={no}>
              <span>{no}</span>
              <b>{title}</b>
              <small>{sub}</small>
              {index < flow.length - 1 && <i>→</i>}
            </div>
          ))}
          <div className="judge-flow-note">LESS HYPE.<br />MORE EVIDENCE.</div>
        </section>

        <section id="proof" className="judge-dossier">
          <div className="judge-case">
            <div className="judge-case-head">
              <span>EXAMPLE DOSSIER</span>
              <b>NOT RUNTIME EVIDENCE</b>
            </div>

            <div className="judge-case-grid">
              <div className="judge-subject">
                <div className="judge-token">
                  <img src="/alpha-scout.svg" alt="" />
                </div>
                <div>
                  <span>SUBJECT</span>
                  <b>UNASSIGNED</b>
                  <small>waiting for a real launch claim</small>
                </div>
                <svg viewBox="0 0 240 54" className="judge-spark" aria-hidden="true">
                  <path d="M3 42 C22 38, 27 44, 42 33 S69 36, 81 28 S110 34, 121 23 S151 27, 161 20 S188 25, 199 15 S220 18, 237 9" />
                </svg>
                <div className="judge-tape-note">OBSERVED ON LAUNCH TAPE.</div>
              </div>

              <div className="judge-evidence-col">
                <h3>OBSERVED / REQUIRED</h3>
                {observed.map(([k, v]) => <EvidenceRow key={k} label={k} value={v} ok />)}
              </div>

              <div className="judge-risk-col">
                <h3>UNKNOWN / RISK</h3>
                {unknown.map(([k, v]) => <EvidenceRow key={k} label={k} value={v} />)}
                <div className="judge-public-count">
                  <span>PUBLIC VERIFIED VOLUME</span>
                  <b>{stats ? `${stats.verifiedOnchainVolumeSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL` : "…"}</b>
                </div>
              </div>
            </div>
          </div>

          <aside className="judge-decision">
            <div className="judge-decision-head"><span>DECISION</span><b>● REFUSE</b></div>
            <h2>NO CLAIM</h2>
            <p>Evidence is incomplete.<br />Capital stays in the wallet.</p>
            <div className="judge-stamp">REFUSED</div>
            <dl>
              <div><dt>Execution mode</dt><dd>PAPER</dd></div>
              <div><dt>Authority</dt><dd>LOCKED</dd></div>
              <div><dt>On-chain tx</dt><dd>NONE</dd></div>
              <div><dt>Reason</dt><dd>Insufficient evidence</dd></div>
            </dl>
          </aside>
        </section>

        <section className="judge-warning">
          <div className="judge-warning-icon">!</div>
          <b>BUILT TO PREVENT<br />REAL LOSSES</b>
          <p>
            Alpha Scout is designed to catch the unknowns, verify what matters, and keep unsafe launches from earning authority.
            <strong> Refusal is a valid — and expected — outcome.</strong>
          </p>
          <span>BETTER QUESTIONS<br />SAVE CAPITAL</span>
        </section>

        <section className="judge-cta">
          <small>— ALPHA SCOUT —</small>
          <h2>Trade new launches with evidence, not emotion.</h2>
          <p>Open the workstation and see the authority chain in action.</p>
          <div>
            <button onClick={() => void openScout()} className="judge-open judge-open--cta">
              <img src="/alpha-scout.svg" alt="" />
              {isAuthenticated ? "Open the desk" : "Open Alpha Scout"} →
            </button>
            {isAuthenticated ? (
              <Link to="/proof" className="judge-proof-link">View Live Proof</Link>
            ) : (
              <button onClick={() => openAuth("signIn")} className="judge-proof-link">Sign in</button>
            )}
          </div>
        </section>
      </main>

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

function Status({ icon, tone, title, sub }: { icon: string; tone?: "green" | "red" | "olive"; title: string; sub: string }) {
  return (
    <div className="judge-status-item">
      <span className={`judge-status-icon ${tone ? `judge-status-icon--${tone}` : ""}`}>{icon}</span>
      <span><b>{title}</b><small>{sub}</small></span>
    </div>
  );
}

function EvidenceRow({ label, value, ok = false }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="judge-evidence-row">
      <span className={ok ? "is-ok" : "is-warn"}>{ok ? "●" : "▲"}</span>
      <span>{label}</span>
      <b>{value}</b>
    </div>
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
    <div className="judge-modal-backdrop" onMouseDown={onClose}>
      <div className="judge-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="judge-modal-head">
          <div className="judge-brand">
            <img src="/alpha-scout.svg" alt="" className="judge-logo" />
            <span><b>ALPHA SCOUT</b><small>SECURE ACCESS</small></span>
          </div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <h2>{mode === "signUp" ? "Open the workstation" : "Return to the workstation"}</h2>
        <form onSubmit={(event) => void submit(event)}>
          <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signUp" ? "new-password" : "current-password"} /></label>
          {error && <p className="judge-modal-error">{error}</p>}
          <button disabled={pending} className="judge-modal-submit">{pending ? "Connecting…" : mode === "signUp" ? "Create access" : "Sign in"}</button>
        </form>
        <p className="judge-modal-switch">
          {mode === "signUp" ? "Already have access?" : "Need an account?"}{" "}
          <button type="button" onClick={() => onModeChange(mode === "signUp" ? "signIn" : "signUp")}>
            {mode === "signUp" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
