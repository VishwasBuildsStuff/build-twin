import { useState } from 'react';
import {
  Pill, Footprints, MoonStar, Wind, Salad, Dumbbell, Sparkles, ArrowRight, Bot, User, CheckCircle2, History, Zap,
} from 'lucide-react';
import { INTERVENTIONS } from '../data/interventions';
import { computeIndices, clamp } from '../data/patients';

const ICONS = { Pill, Footprints, MoonStar, Wind, Salad, Dumbbell };

export default function AssistantTab({ patient, settings, onApplyIntervention, history }) {
  const [activeId, setActiveId] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [appliedIds, setAppliedIds] = useState([]);

  const active = INTERVENTIONS.find((i) => i.id === activeId);
  const beforeIdx = computeIndices(patient, settings);

  // Preview of what applying the intervention would do (dry-run on a copy)
  const preview = (() => {
    if (!active) return null;
    const next = {
      sleep: clamp(settings.sleep + (active.patch.sleep || 0), 3, 10),
      carbs: clamp(settings.carbs + (active.patch.carbs || 0), 20, 300),
      activity: clamp(settings.activity + (active.patch.activity || 0), 0, 120),
      stress: clamp(settings.stress + (active.patch.stress || 0), 1, 10),
    };
    const afterIdx = computeIndices(patient, next);
    return {
      next,
      deltas: {
        metabolic: Math.round(afterIdx.metabolic - beforeIdx.metabolic),
        strain: Math.round(afterIdx.cardiacStrain - beforeIdx.cardiacStrain),
        glucose: Math.round(afterIdx.glucoseRisk - beforeIdx.glucoseRisk),
      },
    };
  })();

  const runPrompt = (iv) => {
    setActiveId(iv.id);
    setThinking(true);
    setTimeout(() => setThinking(false), 650); // simulated model latency
  };

  const apply = () => {
    if (!active || !preview) return;
    onApplyIntervention(preview.next, active);
    setAppliedIds((a) => [...new Set([...a, active.id])]);
  };

  return (
    <div className="animate-fadeUp grid grid-cols-1 gap-5 xl:grid-cols-[400px_1fr]">
      {/* Left — prompt library */}
      <div className="glass p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
            <Bot className="h-4.5 w-4.5 text-slate-950" />
          </span>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Intervention Planner</h3>
            <p className="text-[10px] text-slate-500">Select a protocol → generate insight → push to twin</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {INTERVENTIONS.map((iv) => {
            const Icon = ICONS[iv.icon];
            const isActive = activeId === iv.id;
            const wasApplied = appliedIds.includes(iv.id);
            return (
              <button
                key={iv.id}
                onClick={() => runPrompt(iv)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
                    : 'border-white/10 bg-slate-800/40 hover:border-cyan-400/40 hover:bg-slate-800/70'
                }`}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-slate-900"
                  style={{ color: isActive ? '#22d3ee' : '#94a3b8' }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-200">{iv.label}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{iv.category}</p>
                </div>
                {wasApplied && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                <ArrowRight className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Intervention history */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <History className="h-3.5 w-3.5 text-emerald-400" /> Applied to Twin ({history.length})
          </div>
          {history.length === 0 ? (
            <p className="text-[12px] italic text-slate-600">No interventions committed yet — generate an insight and press “Apply to Twin”.</p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {[...history].reverse().map((h, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-1.5 text-[11px]">
                  <span className="flex items-center gap-2 truncate text-slate-300">
                    <Zap className="h-3 w-3 shrink-0 text-amber-400" /> {h.label}
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-[9px] text-slate-500">{h.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right — conversation pane */}
      <div className="glass flex min-h-[560px] flex-col p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Clinical Assistant</h3>
          <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
            TWIN-LLM · CONTEXT: {patient.name.toUpperCase()}
          </span>
        </div>

        {!active && !thinking && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-16 w-16 animate-pulseGlow place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/5">
              <Bot className="h-8 w-8 text-cyan-400" />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Choose a clinical prompt on the left. The assistant reasons over <b className="text-slate-200">{patient.name}'s</b> live twin state —{' '}
              current metabolic index {Math.round(beforeIdx.metabolic)}/100, strain {Math.round(beforeIdx.cardiacStrain)}/100 — and can commit changes directly to the simulator.
            </p>
          </div>
        )}

        {thinking && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: `${i * 140}ms` }} />
              ))}
            </div>
            <p className="font-mono text-[11px] text-slate-500">Querying neural twin engine · integrating {patient.conditions.length} chronic-context vectors…</p>
          </div>
        )}

        {active && !thinking && preview && (
          <div className="flex flex-1 flex-col gap-4 animate-fadeUp">
            {/* user bubble */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-[13px] text-cyan-100">
                {active.label}
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700">
                <User className="h-4 w-4 text-slate-300" />
              </span>
            </div>

            {/* AI bubble */}
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500">
                <Bot className="h-4 w-4 text-slate-950" />
              </span>
              <div className="max-w-[88%] space-y-3 rounded-2xl rounded-tl-sm border border-white/10 bg-slate-800/60 p-4">
                <p className="text-[13px] leading-relaxed text-slate-300">{active.insight}</p>
                <div className="flex flex-wrap gap-2">
                  {active.kpis.map((k) => (
                    <span key={k} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300">
                      {k}
                    </span>
                  ))}
                </div>

                {/* projected parameter shift table */}
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Projected twin delta (dry-run)</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500">Metabolic Index</p>
                      <p className="font-mono text-sm font-bold" style={{ color: preview.deltas.metabolic >= 0 ? '#10b981' : '#ef4444' }}>
                        {preview.deltas.metabolic >= 0 ? '+' : ''}{preview.deltas.metabolic}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Cardiac Strain</p>
                      <p className="font-mono text-sm font-bold" style={{ color: preview.deltas.strain <= 0 ? '#10b981' : '#ef4444' }}>
                        {preview.deltas.strain >= 0 ? '+' : ''}{preview.deltas.strain}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500">Glucose Risk</p>
                      <p className="font-mono text-sm font-bold" style={{ color: preview.deltas.glucose <= 0 ? '#10b981' : '#ef4444' }}>
                        {preview.deltas.glucose >= 0 ? '+' : ''}{preview.deltas.glucose}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={apply}
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-[0_0_22px_rgba(16,185,129,0.35)] transition-all hover:shadow-[0_0_34px_rgba(34,211,238,0.55)] active:scale-[0.99]"
                >
                  <Zap className="h-4 w-4 transition-transform group-hover/btn:-rotate-12" strokeWidth={2.75} />
                  Apply Intervention to Twin
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
                <p className="text-center font-mono text-[9px] text-slate-600">
                  writes sleep {settings.sleep}→{preview.next.sleep} h · carbs {settings.carbs}→{preview.next.carbs} g · activity {settings.activity}→{preview.next.activity} min · stress {settings.stress}→{preview.next.stress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
