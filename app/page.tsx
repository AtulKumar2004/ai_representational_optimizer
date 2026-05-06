export default function Home() {
  return (
    <div className="hero-shell flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <span className="text-lg font-semibold text-orange-600">AI</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">
              Kasparro Lab
            </p>
            <p className="text-lg font-semibold text-slate-900">Sisyphus</p>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex">
          <a className="transition hover:text-orange-600" href="#overview">
            Home
          </a>
          <a className="transition hover:text-orange-600" href="#features">
            Products
          </a>
          <a className="transition hover:text-orange-600" href="#resources">
            Resources
          </a>
          <a className="transition hover:text-orange-600" href="#pricing">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600">
            Log in
          </button>
          <button className="cta-glow rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
            Sign up
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-24 pt-8 lg:flex-row lg:items-center">
        <section className="flex flex-1 flex-col gap-8">
          <div className="badge-chip inline-flex w-fit items-center gap-3 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold text-orange-700">
              New Track
            </span>
            AI Representation Optimizer
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Unlocking merchant clarity
              <span className="block text-orange-600">for AI shopping agents.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
              A diagnostic layer that shows how AI agents read your store, where the
              representation breaks down, and the exact fixes that move trust and
              conversion forward.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="cta-glow rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
              Watch demo
            </button>
            <button className="rounded-full border border-orange-200 bg-white px-6 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-300">
              Get the toolkit
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" id="features">
            {[
              {
                title: "Representation gaps",
                description:
                  "Surface missing FAQ coverage, weak policies, and unclear product data.",
              },
              {
                title: "Actionable ranking",
                description:
                  "Prioritize what to fix first with a ranked action plan and effort score.",
              },
              {
                title: "Perception delta",
                description:
                  "Compare how agents see you vs. how you want to be represented.",
              },
              {
                title: "Merchant playbooks",
                description:
                  "Step-by-step remediation guidance that drives conversion confidence.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-orange-100 bg-white/80 p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex flex-1 items-center justify-center">
          <div className="glass-card w-full max-w-md rounded-[32px] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">Agent readiness</p>
                <p className="text-3xl font-semibold text-slate-900">82%</p>
              </div>
              <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                +14% this week
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: "Policy clarity", value: "92%" },
                { label: "FAQ coverage", value: "64%" },
                { label: "Product precision", value: "79%" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                Top action
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Expand shipping FAQ with delivery windows and exchange routes.
              </p>
            </div>
          </div>

          <div className="glass-card absolute -left-2 top-8 hidden w-40 rounded-2xl p-4 text-xs text-slate-700 shadow-xl lg:block">
            <p className="font-semibold text-slate-900">Agent snapshot</p>
            <p className="mt-2">Tone: trusted, clear</p>
            <p className="mt-1">Ambiguity: low</p>
          </div>
          <div className="glass-card absolute -bottom-6 right-0 hidden w-44 rounded-2xl p-4 text-xs text-slate-700 shadow-xl lg:block">
            <p className="font-semibold text-slate-900">Conversion lift</p>
            <p className="mt-2">Projected +9.6%</p>
            <div className="mt-3 h-1 w-full rounded-full bg-orange-100">
              <div className="h-1 w-2/3 rounded-full bg-orange-500" />
            </div>
          </div>
        </section>
      </main>

      <section className="mx-auto w-full max-w-6xl px-6 pb-14" id="resources">
        <div className="logo-strip flex flex-wrap items-center justify-between gap-6 rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
          <span>Boltshift</span>
          <span>Lightbox</span>
          <span>FeatherDev</span>
          <span>Spherule</span>
          <span>GlobalBank</span>
          <span>Nietzsche</span>
        </div>
      </section>
    </div>
  );
}
