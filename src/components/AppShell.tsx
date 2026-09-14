import { NavLink, Outlet } from "react-router-dom";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/agent", label: "Agent", icon: "▲" },
  { to: "/signals", label: "Signals", icon: "●" },
  { to: "/proof", label: "Proof", icon: "✓" },
  { to: "/token", label: "Token", icon: "★" },
];

export function AppShell() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const currentUser = useQuery(api.queries.portfolio.dashboard)?.user;

  useEffect(() => {
    if (isAuthenticated) void ensureUser();
  }, [isAuthenticated, ensureUser]);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden md:flex w-[72px] bg-white border-r border-line flex-col items-center py-5 gap-2 fixed h-screen z-10">
        <NavLink to="/dashboard" className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-extrabold text-white mb-5">A</NavLink>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} title={item.label} className={({ isActive }) => `w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${isActive ? "bg-accent-light text-accent" : "text-ink-faint hover:bg-surface hover:text-ink"}`}>
            <span className="text-lg">{item.icon}</span>
          </NavLink>
        ))}
      </aside>
      <div className="flex-1 md:ml-[72px] flex flex-col min-h-screen pb-16 md:pb-0">
        <header className="min-h-16 bg-white border-b border-line flex items-center justify-between gap-4 px-4 sm:px-6 md:px-8 py-3 sticky top-0 z-5">
          <div>
            <div className="text-lg font-bold">Alpha Scout</div>
            <div className="text-[11px] text-ink-faint">evidence-first launch trader</div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.walletAddress && <span className="hidden sm:block text-[12px] font-mono text-ink-mid">watch {short(currentUser.walletAddress)}</span>}
            {isAuthenticated && <button onClick={() => void signOut()} className="px-3 py-2 rounded-lg text-[13px] font-semibold text-ink-mid hover:bg-surface">Sign out</button>}
          </div>
        </header>
        <main className="flex-1 min-w-0"><Outlet /></main>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-line grid grid-cols-5 px-1 py-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${isActive ? "text-accent" : "text-ink-faint"}`}>
              <span className="text-base leading-none">{item.icon}</span>{item.label}
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
