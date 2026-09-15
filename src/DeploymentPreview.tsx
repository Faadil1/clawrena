const buildSha = (import.meta.env.VITE_BUILD_COMMIT_SHA as string | undefined)?.trim();

export default function DeploymentPreview() {
  const shortSha = buildSha ? buildSha.slice(0, 10) : "local/unstamped";

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="border-b border-amber-200 bg-[#FFF8E8] px-4 py-2.5 text-center text-xs font-semibold text-[#9A5B00]">
        REVIEW PREVIEW · Convex backend is not connected to this deployment · no runtime activity is being claimed
      </div>

      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/alpha-scout.svg" alt="Alpha Scout" className="h-10 w-10 rounded-xl" />
          <div>
            <div className="font-bold">Alpha Scout</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">evidence-first launch trader</div>
          </div>
        </div>
        <a
          href="https://github.com/opeblow/clawrena/pull/1"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-semibold"
        >
          Review PR #1 ↗
        </a>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-8">
        <section className="grid gap-10 py-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-16">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-accent-light px-3 py-1.5 text-xs font-bold text-accent">
              P0→P6 REVIEW BUILD · {shortSha}
            </div>
            <h1 className="max-w-[760px] text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-[58px]">
              Trade only what the evidence can <span className="text-accent">authorize.</span>
            </h1>
            <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-ink-mid">
              Alpha Scout discovers Pump launches, investigates observable market and holder evidence, refuses critical unknowns, applies deterministic risk gates, and keeps every execute, reject, skip and prepare decision in an evidence record.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white">Backend provisioning pending</span>
              <span className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold">Verified on-chain claims remain locked</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_30px_70px_-30px_rgba(16,20,32,.3)]">
            <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <span className="font-mono text-xs text-ink-faint">authority_boundary/review</span>
              <span className="text-[10px] font-bold text-up">● FAIL CLOSED</span>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <Boundary k="OBSERVED" v="Price · liquidity · sampled economic owners · launch provenance" />
              <Boundary k="UNKNOWN" v="Critical unknowns never become PASS by default" />
              <Boundary k="DECISION" v="EXECUTE / REJECT / SKIP with reasons + risk budget" />
              <Boundary k="LAST MILE" v="Fresh receipt + provider preflight before value movement" />
              <Boundary k="VERIFIED" v="Requires on-chain mode + signature + independent confirmation slot" />
              <div className="rounded-xl border border-accent/30 bg-accent-light p-4 text-sm font-semibold text-accent">
                This panel describes implemented gates. It is not a runtime receipt and is never submission evidence.
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-y border-line py-10 md:grid-cols-3">
          <Gate title="Real failure grounded" state="BUILT" body="LIBRA and the 2024 Pump.fun incident are preserved as external failure evidence, not passed off as Alpha Scout performance." />
          <Gate title="Negative path" state="BUILT" body="REJECT, UNKNOWN, provider degradation and stale evidence remain visible instead of disappearing from the story." />
          <Gate title="Execution proof" state="LOCKED" body="Unsigned preparation, pending submission and independently verified execution are separate states." />
          <Gate title="Agent Treasury" state="BUILT" body="Creator-fee observability reads the real ClawPump ledger once a linked agent exists; holder revenue share is not claimed." />
          <Gate title="Runtime capture" state="PENDING" body="A public Convex target + live negative-path receipt are still required before Gate 7 PROMOTE." />
          <Gate title="Eligibility" state="PENDING" body="Registration, X/follow and tokenization stay unverified until external receipt links exist." />
        </section>

        <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-accent">What unlocks the full product</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Step n="01" title="Deploy Convex" body="Create the preview target and keep all provider keys server-side." />
            <Step n="02" title="Set VITE_CONVEX_URL" body="The same frontend automatically switches from this review preview to the live authenticated app." />
            <Step n="03" title="Capture reality" body="Probe /, /proof and /healthz, then preserve one real live-market refusal before promotion." />
          </div>
        </section>
      </main>
    </div>
  );
}

function Boundary({ k, v }: { k: string; v: string }) {
  return <div className="grid grid-cols-[86px_1fr] gap-4 border-b border-line pb-4 last:border-0"><span className="text-[10px] font-bold text-accent">{k}</span><span className="text-sm leading-relaxed text-ink-mid">{v}</span></div>;
}

function Gate({ title, state, body }: { title: string; state: "BUILT" | "LOCKED" | "PENDING"; body: string }) {
  return <div className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">{title}</h2><span className="rounded-md bg-surface px-2 py-1 font-mono text-[9px] font-bold text-ink-mid">{state}</span></div><p className="mt-2 text-sm leading-relaxed text-ink-mid">{body}</p></div>;
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return <div><div className="font-mono text-xs font-bold text-accent">{n}</div><div className="mt-1 font-bold">{title}</div><p className="mt-1 text-sm leading-relaxed text-ink-mid">{body}</p></div>;
}
