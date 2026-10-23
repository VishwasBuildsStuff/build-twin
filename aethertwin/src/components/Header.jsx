import { Activity, ShieldCheck, Radio, LogOut } from 'lucide-react';

// ============================================================
// Persistent navigation for the signed-in user's personal twin
// ============================================================
export default function Header({ patient, user, onSignOut, liveHz, activeTab, onTabChange, TABS }) {

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1600px] px-4 lg:px-6">
        {/* Row 1 — brand + status */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-[0_0_22px_rgba(34,211,238,0.45)]">
              <Activity className="h-6 w-6 text-slate-950" strokeWidth={2.75} />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulseGlow rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight tracking-tight text-white">
                Aether<span className="text-cyan-400 neon-text">Twin</span> Health
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                Next-Gen Patient Digital Twin Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 md:flex">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span className="font-mono text-[11px] font-semibold text-emerald-300">
                TWIN SYNC: ACTIVE · {liveHz}Hz SIGNAL RATE
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono text-[11px] font-semibold text-cyan-300">LOCAL-ONLY DEMO DATA</span>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <span className="max-w-40 truncate text-xs text-slate-400">{patient?.name || user?.name}</span>
              <button onClick={onSignOut} title="Sign out" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 — tab nav */}
        <nav className="-mb-px flex gap-1 overflow-x-auto pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-4 ${
                  active
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-cyan-400' : ''}`} />
                {t.label}
                {active && <span className="ml-1 hidden h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 sm:block" />}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center justify-end gap-2 pb-2 lg:hidden">
          <span className="max-w-40 truncate text-[11px] text-slate-500">Signed in as {user?.name}</span>
          <button onClick={onSignOut} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-300"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </div>
    </header>
  );
}
