import { useMemo, useState } from 'react';
import { Brain, Heart, Activity, Droplets, Flame, ChevronRight, Hourglass, TrendingUp, ShieldAlert } from 'lucide-react';
import { computeOrganStats, clamp } from '../data/patients';

const ORGAN_ICONS = { brain: Brain, heart: Heart, pancreas: Activity, liver: Flame, kidneys: Droplets };

// risk (0-100, higher worse) -> colour + label
function riskMeta(risk) {
  if (risk < 25) return { color: '#10b981', label: 'LOW RISK' };
  if (risk < 45) return { color: '#22d3ee', label: 'GUARDED' };
  if (risk < 65) return { color: '#f59e0b', label: 'ELEVATED' };
  return { color: '#ef4444', label: 'HIGH RISK' };
}

// ---------- Circular gauge for risk score ----------
function RiskGauge({ risk, size = 132 }) {
  const meta = riskMeta(risk);
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const frac = clamp(100 - risk, 0, 100) / 100; // draw vitality arc
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth="9" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={meta.color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${circ * frac} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.7s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${meta.color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-extrabold text-white" style={{ textShadow: `0 0 16px ${meta.color}88` }}>{risk}</span>
        <span className="text-[9px] font-bold tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </div>
  );
}

// ---------- 90-day trajectory sparkline (pure SVG) ----------
function TrajectorySpark({ current, projected }) {
  const w = 220, h = 60;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const eased = t * t * (3 - 2 * t); // smoothstep drift toward projection
    const noise = Math.sin(i * 2.1) * 1.6;
    pts.push(clamp(current + (projected - current) * eased + noise, 2, 98));
  }
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * w) / 11},${h - (p / 100) * h}`).join(' ');
  const improving = projected >= current;
  const color = improving ? '#10b981' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id={`spark-${improving ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#spark-${improving ? 'up' : 'dn'})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <circle cx={w} cy={h - (pts[12] / 100) * h} r="3.5" fill={color} className="animate-pulse" />
    </svg>
  );
}

// ---------- Stylised human silhouette with clickable organ hotspots ----------
function BodyMap({ organs, selected, onSelect }) {
  const spots = [
    { key: 'brain', cx: 100, cy: 44, rx: 21, ry: 15 },
    { key: 'heart', cx: 108, cy: 128, rx: 12, ry: 11 },
    { key: 'pancreas', cx: 95, cy: 168, rx: 17, ry: 7, rotate: -12 },
    { key: 'liver', cx: 80, cy: 196, rx: 20, ry: 12 },
    { key: 'kidneys', cx: 118, cy: 194, rx: 9, ry: 13 },
  ];
  return (
    <svg viewBox="0 0 200 360" className="mx-auto h-[440px] w-auto select-none" aria-label="Interactive organ body map">
      <defs>
        <radialGradient id="bodyGlow" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(148,163,184,0.22)" />
          <stop offset="100%" stopColor="rgba(71,85,105,0.10)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="360" fill="url(#bodyGlow)" />
      {/* grid backdrop */}
      {[...Array(9)].map((_, i) => (
        <line key={`h${i}`} x1="10" y1={i * 44} x2="190" y2={i * 44} stroke="rgba(148,163,184,0.06)" />
      ))}
      {[...Array(5)].map((_, i) => (
        <line key={`v${i}`} x1={20 + i * 40} y1="4" x2={20 + i * 40} y2="356" stroke="rgba(148,163,184,0.06)" />
      ))}

      {/* Silhouette */}
      <g fill="url(#skin)" stroke="rgba(148,163,184,0.45)" strokeWidth="1.4">
        <circle cx="100" cy="42" r="27" />                                   {/* head */}
        <rect x="92" y="66" width="16" height="14" rx="5" />                 {/* neck */}
        <path d="M62 86 Q100 74 138 86 L146 118 Q150 150 142 186 L136 232 Q128 252 118 252 L82 252 Q72 252 64 232 L58 186 Q50 150 54 118 Z" /> {/* torso */}
        <path d="M60 92 Q40 100 34 140 L30 196 Q28 208 38 209 Q47 210 48 198 L56 150 Z" />   {/* left arm */}
        <path d="M140 92 Q160 100 166 140 L170 196 Q172 208 162 209 Q153 210 152 198 L144 150 Z" /> {/* right arm */}
        <path d="M84 250 L80 316 Q79 330 90 330 Q99 330 99 318 L100 262 Z" /> {/* left leg */}
        <path d="M116 250 L120 316 Q121 330 110 330 Q101 330 101 318 L100 262 Z" /> {/* right leg */}
      </g>

      {/* Organ hotspots */}
      {spots.map((sp) => {
        const o = organs[sp.key];
        const meta = riskMeta(o.risk);
        const isSel = selected === sp.key;
        return (
          <g
            key={sp.key}
            className={`organ-hotspot ${isSel ? 'organ-selected' : ''}`}
            onClick={() => onSelect(sp.key)}
            transform={sp.rotate ? `rotate(${sp.rotate} ${sp.cx} ${sp.cy})` : undefined}
          >
            <ellipse
              className="organ-shape"
              cx={sp.cx} cy={sp.cy} rx={sp.rx} ry={sp.ry}
              fill={`${meta.color}${isSel ? '55' : '2c'}`}
              stroke={isSel ? '#10b981' : meta.color}
              strokeWidth={isSel ? 2.2 : 1.4}
              strokeDasharray={o.risk > 60 ? '4 3' : undefined}
            />
            <circle cx={sp.cx} cy={sp.cy} r={isSel ? 4 : 2.6} fill={isSel ? '#10b981' : meta.color}>
              <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
            </circle>
            {/* leader line + label */}
            <g stroke="rgba(148,163,184,0.4)" strokeWidth="1">
              <line x1={sp.cx + (sp.cx > 100 ? sp.rx : -sp.rx)} y1={sp.cy} x2={sp.cx > 100 ? 186 : 30} y2={sp.cy} strokeDasharray="2 3" />
            </g>
            <text
              x={sp.cx > 100 ? 188 : 28} y={sp.cy - 3}
              textAnchor={sp.cx > 100 ? 'end' : 'start'}
              fontSize="9.5" fontWeight="700"
              fill={isSel ? '#34d399' : 'rgba(203,213,225,0.85)'}
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {o.name}
            </text>
            <text
              x={sp.cx > 100 ? 188 : 28} y={sp.cy + 9}
              textAnchor={sp.cx > 100 ? 'end' : 'start'}
              fontSize="8.5" fontFamily="JetBrains Mono, monospace" fill={meta.color}
            >
              RISK {o.risk}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
export default function OrgansTab({ patient, settings }) {
  const organs = useMemo(() => computeOrganStats(patient, settings), [patient, settings]);
  const [selected, setSelected] = useState('pancreas');
  const sel = organs[selected];
  const Icon = ORGAN_ICONS[selected];
  const bioAge = Number((patient.age + sel.bioAgeDelta).toFixed(1));

  return (
    <div className="animate-fadeUp grid grid-cols-1 gap-5 lg:grid-cols-[minmax(320px,460px)_1fr]">
      {/* Body map */}
      <div className="glass relative p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Virtual Anatomy Map</h3>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
            5 HOTSPOTS · CLICK TO DIAGNOSE
          </span>
        </div>
        <BodyMap organs={organs} selected={selected} onSelect={setSelected} />
        <div className="mt-2 flex justify-center gap-4 font-mono text-[9px] text-slate-500">
          <span><span className="text-emerald-400">●</span> LOW</span>
          <span><span className="text-cyan-400">●</span> GUARDED</span>
          <span><span className="text-amber-400">●</span> ELEVATED</span>
          <span><span className="text-red-400">●</span> HIGH · dashed = decompensation watch</span>
        </div>
      </div>

      {/* Detail card + summary strip */}
      <div className="space-y-5">
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800/40 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-400/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </span>
              <div>
                <h4 className="text-base font-extrabold text-white">{sel.name} — Diagnostic Card</h4>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{sel.subtitle} · twin {patient.id.toUpperCase()}-{String(patient.age).padStart(2, '0')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <RiskGauge risk={sel.risk} />
              <p className="max-w-[160px] text-center text-[11px] leading-snug text-slate-500">{sel.detail}</p>
            </div>

            <div className="space-y-3">
              {/* Biological aging */}
              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Hourglass className="h-4 w-4 text-violet-400" /> Biological Aging Rate
                  </div>
                  <span
                    className="font-mono text-lg font-extrabold"
                    style={{ color: sel.bioAgeDelta > 0.4 ? '#ef4444' : sel.bioAgeDelta < -0.4 ? '#10b981' : '#f59e0b' }}
                  >
                    {sel.bioAgeDelta > 0 ? '+' : ''}{sel.bioAgeDelta} yrs
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-slate-400">
                  {sel.name} behaves like a <b className="text-white">{bioAge}-year-old</b> tissue vs chronological age{' '}
                  <b className="text-white">{patient.age}y</b> — {sel.bioAgeDelta > 0 ? 'accelerated' : sel.bioAgeDelta < 0 ? 'decelerated' : 'matched'} degeneration at current lifestyle settings.
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${clamp(50 + sel.bioAgeDelta * 18, 4, 100)}%`,
                      background: sel.bioAgeDelta > 0 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#22d3ee,#10b981)',
                    }}
                  />
                </div>
              </div>

              {/* 90-day trajectory */}
              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <TrendingUp className="h-4 w-4 text-emerald-400" /> 90-Day Predictive Trajectory
                  </div>
                  <span className="font-mono text-[12px] font-bold" style={{ color: sel.delta90 >= 0 ? '#10b981' : '#ef4444' }}>
                    {sel.vitality} → {sel.projected90} ({sel.delta90 >= 0 ? '+' : ''}{sel.delta90})
                  </span>
                </div>
                <div className="mt-2">
                  <TrajectorySpark current={sel.vitality} projected={sel.projected90} />
                </div>
                <div className="flex justify-between font-mono text-[9px] text-slate-600">
                  <span>TODAY</span><span>+30d</span><span>+60d</span><span>+90d</span>
                </div>
              </div>

              {sel.risk >= 60 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-[12px] leading-relaxed text-red-200/90">
                    <b>Clinical flag:</b> {sel.name.toLowerCase()} risk exceeds the 60-point intervention threshold for this twin. Route to Tab 3 — the AI planner has queued matched recovery protocols.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All-organ summary chips */}
        <div className="glass p-5">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">System-Wide Organ Panel</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.values(organs).map((o) => {
              const OIcon = ORGAN_ICONS[o.key];
              const meta = riskMeta(o.risk);
              const active = selected === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => setSelected(o.key)}
                  className={`rounded-xl border p-3 text-left transition-all duration-300 ${
                    active ? 'border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_18px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-slate-800/40 hover:border-cyan-400/40'
                  }`}
                >
                  <OIcon className="h-4 w-4" style={{ color: meta.color }} />
                  <p className="mt-1.5 text-[12px] font-bold text-slate-200">{o.name}</p>
                  <p className="font-mono text-[10px]" style={{ color: meta.color }}>RISK {o.risk} · Δ{sel.bioAgeDelta > 0 ? '+' : ''}{o.bioAgeDelta}y</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-700/60">
                    <div className="h-full transition-all duration-500" style={{ width: `${o.risk}%`, background: meta.color }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
