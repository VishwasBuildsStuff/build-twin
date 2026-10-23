import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Brush,
} from 'recharts';
import { Sliders, Brain, HeartPulse, Zap, Sparkles, Moon, UtensilsCrossed, Bike, Gauge, RotateCcw } from 'lucide-react';
import { computeIndices, generateTimeSeries, generateClinicalNotes, clamp } from '../data/patients';

// ---------- Slider control ----------
function TwinSlider({ icon: Icon, label, value, min, max, step, unit, accent, onChange, hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg border"
            style={{ borderColor: `${accent}55`, background: `${accent}18`, color: accent }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[13px] font-semibold text-slate-300">{label}</span>
        </div>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color: accent }}>
          {value}
          <span className="ml-0.5 text-[10px] text-slate-500">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="twin-slider"
        style={{
          '--thumb-accent': accent,
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(51,65,85,0.55) ${pct}%, rgba(51,65,85,0.55) 100%)`,
        }}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-600">
        <span>{min}{unit}</span>
        <span className="italic text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">{hint}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---------- Metric gauge card ----------
function MetricCard({ icon: Icon, label, value, suffix, accent, goodLow, description }) {
  const v = Math.round(value);
  const healthy = goodLow ? v < 40 : v > 60;
  const warning = goodLow ? v >= 40 && v < 65 : v <= 60 && v > 40;
  const statusColor = healthy ? '#10b981' : warning ? '#f59e0b' : '#ef4444';
  return (
    <div className="glass glass-hover relative overflow-hidden p-4">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Icon className="h-4 w-4" style={{ color: accent }} />
          {label}
        </div>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
          style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55` }}
        >
          {healthy ? 'Optimal' : warning ? 'Watch' : 'Critical'}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="neon-text font-mono text-3xl font-extrabold tabular-nums text-white">{v}</span>
        <span className="mb-1 text-xs text-slate-500">{suffix}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamp(goodLow ? 100 - v : v, 2, 100)}%`, background: `linear-gradient(90deg, ${accent}, ${statusColor})` }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">{description}</p>
    </div>
  );
}

// ---------- Custom chart tooltip ----------
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = [
    { key: 'glucose', name: 'Blood Glucose', unit: 'mg/dL', color: '#f59e0b' },
    { key: 'heartRate', name: 'Heart Rate', unit: 'bpm', color: '#f43f5e' },
    { key: 'cortisol', name: 'Cortisol', unit: 'µg/dL', color: '#a78bfa' },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 shadow-2xl backdrop-blur">
      <p className="mb-1 font-mono text-[11px] font-bold text-cyan-300">T+{label}</p>
      {rows.map((r) => {
        const item = payload.find((p) => p.dataKey === r.key);
        if (!item) return null;
        return (
          <p key={r.key} className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.name}: <span className="font-mono font-bold" style={{ color: r.color }}>{item.value}</span> {r.unit}
          </p>
        );
      })}
    </div>
  );
}

// ============================================================
export default function SimulatorTab({ patient, settings, onSettingsChange, lastSnapshot }) {
  const idx = useMemo(() => computeIndices(patient, settings), [patient, settings]);
  const series = useMemo(() => generateTimeSeries(patient, settings), [patient, settings]);
  const notes = useMemo(() => generateClinicalNotes(patient, settings, lastSnapshot), [patient, settings, lastSnapshot]);

  const set = (key) => (val) => onSettingsChange({ ...settings, [key]: val });

  return (
    <div className="animate-fadeUp space-y-5">
      {/* Metric gauges */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={Zap} label="Metabolic Health Index" value={idx.metabolic} suffix="/100" accent="#22d3ee" goodLow={false}
          description="Composite of insulin sensitivity, substrate oxidation and mitochondrial reserve modelled from today's inputs."
        />
        <MetricCard
          icon={HeartPulse} label="Cardiac Strain" value={idx.cardiacStrain} suffix="/100" accent="#f43f5e" goodLow
          description="24-hour haemodynamic load proxy — afterload, sympathetic tone and lost nocturnal dipping."
        />
        <MetricCard
          icon={Gauge} label="Glucose Spike Risk" value={idx.glucoseRisk} suffix="% peak excursion" accent="#f59e0b" goodLow
          description="Probability-weighted post-prandial excursion above 160 mg/dL across three meal windows."
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        {/* Left: what-if sliders */}
        <div className="glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">What-If Engine</h3>
            </div>
            <button
              onClick={() => onSettingsChange({ ...patient.baseline })}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <RotateCcw className="h-3 w-3" /> Baseline
            </button>
          </div>
          <div className="space-y-6">
            <TwinSlider icon={Moon} label="Sleep Duration" value={settings.sleep} min={3} max={10} step={0.5} unit="h"
              accent="#818cf8" onChange={set('sleep')} hint="target ≥ 7.5 h" />
            <TwinSlider icon={UtensilsCrossed} label="Daily Carbohydrate Intake" value={settings.carbs} min={20} max={300} step={5} unit="g"
              accent="#f59e0b" onChange={set('carbs')} hint={`≈ ${Math.round(settings.carbs * 4)} kcal from carbs`} />
            <TwinSlider icon={Bike} label="Physical Activity / Exercise" value={settings.activity} min={0} max={120} step={5} unit="min"
              accent="#10b981" onChange={set('activity')} hint="WHO minimum: 30 min" />
            <TwinSlider icon={Brain} label="Psychological Stress Index" value={settings.stress} min={1} max={10} step={1} unit="/10"
              accent="#f43f5e" onChange={set('stress')} hint="PSQI-equivalent scale" />
          </div>
          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="font-mono text-[10px] leading-relaxed text-cyan-200/80">
              ENGINE STATE · ODE solver converged → steady state in {(0.4 + idx.cardiacStrain / 90).toFixed(2)} simulated days · confidence 0.9{(9 - Math.round(idx.cardiacStrain / 12))}/10
            </p>
          </div>
        </div>

        {/* Right: chart + AI notes */}
        <div className="space-y-5">
          <div className="glass p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                24-Hour Projected Physiological Curve — <span className="text-cyan-400">{patient.name}</span>
              </h3>
              <div className="flex gap-3 font-mono text-[10px] text-slate-500">
                <span><span className="text-amber-400">●</span> Glucose</span>
                <span><span className="text-rose-500">●</span> HR</span>
                <span><span className="text-violet-400">●</span> Cortisol</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.09)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} interval={5} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 280]} label={{ value: 'mg/dL · bpm', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, dy: 40 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#a78bfa', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 30]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <ReferenceLine yAxisId="left" y={160} stroke="#f59e0b" strokeDasharray="5 4" strokeOpacity={0.45}
                  label={{ value: 'GLYCEMIC FLAG 160', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
                <Line yAxisId="left" type="monotone" dataKey="glucose" name="Blood Glucose (mg/dL)" stroke="#f59e0b" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} filter="url(#glow)" animationDuration={450} />
                <Line yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={450} />
                <Line yAxisId="right" type="monotone" dataKey="cortisol" name="Cortisol (µg/dL)" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 4 }} animationDuration={450} />
                <Brush dataKey="label" height={22} stroke="#22d3ee" fill="rgba(30,41,59,0.6)" travellerWidth={8} tickFormatter={() => ''} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="glass p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
                <Sparkles className="h-4 w-4 text-slate-950" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">AI Clinical Notes</h3>
              <span className="ml-auto rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
                LIVE REASONING · v4.2-TWIN
              </span>
            </div>
            <div className="space-y-2.5">
              {notes.map((n, i) => (
                <div key={i} className="flex gap-2.5 rounded-xl border border-white/5 bg-slate-800/40 px-3.5 py-2.5 animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="mt-0.5 select-none font-mono text-[10px] font-bold text-cyan-500">N{i + 1}</span>
                  <p className="text-[12.5px] leading-relaxed text-slate-300 [&_b]:text-white" dangerouslySetInnerHTML={{ __html: n }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
