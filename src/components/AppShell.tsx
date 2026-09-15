import { NavLink, Outlet } from "react-router-dom";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import "../workstation.css";

const navItems = [
  { to: "/dashboard", label: "Desk", meta: "SURVEILLANCE", code: "01" },
  { to: "/agent", label: "Authority", meta: "AGENT + RISK", code: "02" },
  { to: "/signals", label: "Launch tape", meta: "OBSERVATIONS", code: "03" },
  { to: "/proof", label: "Evidence", meta: "RECEIPTS", code: "04" },
  { to: "/token", label: "Inspect", meta: "TOKEN DOSSIER", code: "05" },
];

const process = ["DISCOVER", "CLAIM", "INVESTIGATE", "QUALIFY", "EXECUTE / REFUSE", "PROVE"];

export function AppShell() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const dashboard = useQuery(api.queries.portfolio.dashboard);
  const currentUser = dashboard?.user;
  const agent = dashboard?.agent;

  useEffect(() => {
    if (isAuthenticated) void ensureUser();
  }, [isAuthenticated, ensureUser]);

  const runtimeState = agent?.status === "running" ? "ARMED / PAPER" : agent?.status === "halted" ? "HALTED" : agent ? "PAUSED" : "LOCKED";

  return (
    <div className="min-h-screen bg-surface">
      <aside className="ops-side hidden md:flex">
        <NavLink to="/dashboard" className="ops-brand">
          <img src="/alpha-scout.svg" alt="" className="w-[34px] h-[34px] flex-none" />
          <span>
            <b>ALPHA SCOUT</b>
            <small>LAUNCH EVIDENCE OS</small>
          </span>
        </NavLink>

        <div className="ops-side-label">INVESTIGATION SURFACES</div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `ops-nav-link ${isActive ? "ops-nav-link--active" : ""}`}>
              <span className="ops-nav-code">{item.code}</span>
              <span className="min-w-0">
                <b>{item.label}</b>
                <small>{item.meta}</small>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto ops-side-status">
          <div className="ops-side-status-row"><span>EXECUTION</span><b>PAPER</b></div>
          <div className="ops-side-status-row"><span>AUTHORITY</span><b>{runtimeState}</b></div>
          <div className="ops-side-status-row"><span>NETWORK</span><b className="text-up">SOLANA</b></div>
          <div className="ops-side-status-row"><span>TRUTH MODE</span><b>FAIL-CLOSED</b></div>
        </div>
      </aside>

      <div className="md:ml-[220px] min-h-screen flex flex-col pb-16 md:pb-0">
        <header className="ops-topbar">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="md:hidden flex items-center gap-2 font-extrabold text-sm">
              <img src="/alpha-scout.svg" alt="" className="w-6 h-6" />
              ALPHA SCOUT
            </div>
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono tracking-[0.12em] uppercase text-ink-mid">
              <span className="inline-flex items-center gap-2"><span className="ops-live-dot" /> Convex live</span>
              <span>Solana</span>
              <span>Authority / {runtimeState}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.walletAddress && <span className="hidden lg:block text-[10px] font-mono tracking-wide text-ink-mid">WATCH {short(currentUser.walletAddress)}</span>}
            {isAuthenticated && <button onClick={() => void signOut()} className="ops-text-button">Sign out</button>}
          </div>
        </header>

        <div className="fw-processbar hidden lg:grid" aria-label="Alpha Scout decision pipeline">
          {process.map((step, index) => <div key={step} className="fw-process-step"><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b></div>)}
        </div>

        <main className="flex-1 min-w-0"><Outlet /></main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#F7F6F1] border-t border-[#C9CCC2] grid grid-cols-5 px-1 py-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 py-1 text-[9px] font-mono uppercase tracking-wide ${isActive ? "text-accent" : "text-ink-faint"}`}>
              <span className="text-[10px]">{item.code}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function short(addr: string): string {
  return addr.length <= 12 ? addr : `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}
