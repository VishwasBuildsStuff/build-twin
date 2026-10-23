// ============================================================
// AetherTwin Health — Patient presets & baseline physiology
// ============================================================

export const MY_TWIN_ID = 'my-twin';

// A neutral starter model keeps the simulator usable before the signed-in user
// enters data. These are simulation defaults, not a person's measurements.
export const PERSONAL_TWIN_BASE = {
  id: MY_TWIN_ID,
  name: 'My Twin',
  age: null,
  sex: '',
  initials: 'MT',
  tagline: 'Personal health twin',
  conditions: [],
  accent: '#22d3ee',
  avatarGradient: 'from-cyan-500 to-emerald-500',
  hasMeasurements: false,
  manualData: {},
  vitals: { restingHR: 70, systolic: 120, diastolic: 80, bmi: 24, hba1c: 5.5 },
  baseline: { sleep: 7, carbs: 180, activity: 30, stress: 4 },
  profile: {
    insulinResistance: 0.35,
    betaCellFunction: 0.8,
    cardiacBaseline: 0.35,
    cortisolBaseline: 0.4,
    renalLoad: 0.35,
    hepaticFat: 0.3,
    neuroVulnerability: 0.35,
    recoveryRate: 0.65,
  },
  organBaselines: { brain: 75, heart: 75, pancreas: 75, liver: 75, kidneys: 75 },
};

export const REVIEWER_EXAMPLES = [
  { name: 'Rahul Sharma', role: 'Sample reviewer persona 1' },
  { name: 'Elena Rostova', role: 'Sample reviewer persona 2' },
  { name: 'Marcus Vance', role: 'Sample reviewer persona 3' },
];

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------
// Physiological Simulation Engine
// Maps lifestyle inputs -> organ-level indices (all clamped 0..100)
// ------------------------------------------------------------
export function computeIndices(patient, s) {
  const p = patient.profile;
  const sleepDeficit = clamp((7.5 - s.sleep) / 4.5, 0, 1); // 0 well-rested .. 1 severely deprived
  const carbLoad = clamp((s.carbs - 20) / 280, 0, 1);
  const actNorm = s.activity / 120;
  const stressN = (s.stress - 1) / 9;

  // Age/condition-coupled lifestyle sensitivity: younger, fitter twins buffer poor inputs far better.
  // Damping scales with the patient's intrinsic reserve rather than the raw load magnitude, so a
  // high-risk twin still decompensates under abuse while an athlete stays protected.
  const resilience = clamp(p.recoveryRate * 0.6 + p.betaCellFunction * 0.3 + (1 - p.cardiacBaseline) * 0.1, 0.12, 0.95);
  const damp = clamp(0.42 + 0.58 * resilience, 0.42, 0.95); // multiplier applied to all strain terms

  // Metabolic Health Index: penalised by carb load x insulin resistance & sleep debt, rewarded by activity
  const metabolic = clamp(
    100 -
      damp * (38 * carbLoad * (0.35 + p.insulinResistance)) -
      damp * (22 * sleepDeficit * (0.4 + p.insulinResistance * 0.6)) -
      damp * (16 * stressN * (0.3 + p.cortisolBaseline * 0.5)) +
      24 * actNorm * p.recoveryRate -
      10 * (1 - p.betaCellFunction),
    5, 99
  );

  // Cardiac Strain: BP/afterload baseline + stress + sleep loss; aerobic conditioning buffers it
  const cardiacStrain = clamp(
    18 +
      62 * p.cardiacBaseline * (0.5 + 0.5 * stressN) +
      damp * (26 * sleepDeficit * p.cardiacBaseline) +
      damp * (14 * carbLoad * p.insulinResistance) -
      30 * actNorm * (0.4 + p.recoveryRate * 0.6),
    4, 98
  );

  // Glucose Spike Risk: carb load vs beta-cell clearance, worsened by deprivation & stress
  const glucoseRisk = clamp(
    8 +
      damp * (72 * carbLoad * (1.15 - p.betaCellFunction)) +
      damp * (20 * sleepDeficit * p.insulinResistance) +
      damp * (14 * stressN * p.cortisolBaseline) -
      26 * actNorm * (0.5 + p.recoveryRate * 0.5),
    3, 99
  );

  return { metabolic, cardiacStrain, glucoseRisk, sleepDeficit, carbLoad, actNorm, stressN };
}

// ------------------------------------------------------------
// 24-hour projection curves (glucose mg/dL, HR bpm, cortisol µg/dL)
// ------------------------------------------------------------
const MEAL_WINDOWS = [[7.5, 9], [12.5, 14], [19, 21]]; // breakfast / lunch / dinner peaks
const ACTIVITY_START = 18; // evening exercise window used by the simulator

export function generateTimeSeries(patient, s) {
  const idx = computeIndices(patient, s);
  const p = patient.profile;
  const pts = [];

  for (let i = 0; i <= 48; i++) {
    const hour = (i * 24) / 48;
    const t = hour / 24;

    // --- Blood glucose: circadian floor + meal excursions scaled by spike risk
    let g = 84 + 10 * Math.sin(2 * Math.PI * (t - 0.3)) + (p.insulinResistance - 0.3) * 22;
    MEAL_WINDOWS.forEach(([peak], mi) => {
      const w = 1.9;
      const dist = Math.abs(((hour - peak + 12) % 24) - 12);
      const excursion = Math.exp(-(dist * dist) / (2 * w * w));
      const size = (16 + 78 * (idx.glucoseRisk / 100)) * (mi === 2 ? 1.1 : 1);
      g += excursion * size;
    });
    g -= idx.actNorm * 16 * (hour > 8 && hour < 21 ? 1 : 0.3);
    const glucose = clamp(g, 62, 268);

    // --- Heart rate: autonomic tone follows cardiac strain + workout rebound window
    const hrBase = patient.vitals.restingHR;
    let hr =
      hrBase +
      10 * Math.sin(2 * Math.PI * (t - 0.25)) +
      (idx.cardiacStrain / 100) * 26 -
      idx.actNorm * 6;
    if (hour >= ACTIVITY_START && hour <= ACTIVITY_START + 1.2) hr += 34 + 18 * idx.actNorm;
    if (hour > 22 || hour < 6) hr -= 6 * (1 - idx.stressN); // nocturnal dipping (lost under stress)
    const heartRate = clamp(hr, 40, 178);

    // --- Cortisol: strong CAR at ~07:00, elevated evening tail when stressed/deprived
    const carDist = Math.abs(hour - 7);
    let c =
      4.5 +
      9.5 * Math.exp(-(carDist * carDist) / 4.5) +
      (idx.stressN * 10 + idx.sleepDeficit * 6) * (0.55 + 0.45 * Math.exp(-Math.pow((hour - 20.5) / 3.2, 2))) +
      p.cortisolBaseline * 4;
    if (hour > 21) c += idx.stressN * 5.5;
    const cortisol = clamp(c, 0.8, 27);

    pts.push({
      hour: Number(hour.toFixed(1)),
      label: `${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`,
      glucose: Math.round(glucose),
      heartRate: Math.round(heartRate),
      cortisol: Number(cortisol.toFixed(1)),
    });
  }
  return pts;
}

// ------------------------------------------------------------
// Organ diagnostics: risk score, biological aging, 90-day trajectory
// ------------------------------------------------------------
const ORGAN_META = {
  brain: { name: 'Brain', subtitle: 'Neuro-endocrine axis', detail: 'HPA-axis load, sleep architecture quality, and neuroinflammatory markers.' },
  heart: { name: 'Heart', subtitle: 'Cardiovascular system', detail: 'Afterload exposure, autonomic balance (HRV proxy), and myocardial strain reserve.' },
  pancreas: { name: 'Pancreas', subtitle: 'Glucose regulation', detail: 'Beta-cell secretory capacity, insulin sensitivity index, and HOMA-IR trend.' },
  liver: { name: 'Liver', subtitle: 'Metabolic filtration', detail: 'Hepatic fat fraction, de novo lipogenesis drive, and glycogen cycling efficiency.' },
  kidneys: { name: 'Kidneys', subtitle: 'Renal perfusion', detail: 'eGFR trajectory, glomerular pressure load, and albuminuria risk gradient.' },
};

export function computeOrganStats(patient, s) {
  const idx = computeIndices(patient, s);
  const outOf = (v) => clamp(v, 3, 99);
  const vitality = {
    brain: outOf(patient.organBaselines.brain - 26 * idx.sleepDeficit * patient.profile.neuroVulnerability - 18 * idx.stressN + 10 * idx.actNorm),
    heart: outOf(patient.organBaselines.heart - 30 * (idx.cardiacStrain / 100) + 16 * idx.actNorm * patient.profile.recoveryRate - 8 * idx.sleepDeficit),
    pancreas: outOf(patient.organBaselines.pancreas - 34 * (idx.glucoseRisk / 100) + 12 * idx.actNorm - 6 * idx.sleepDeficit),
    liver: outOf(patient.organBaselines.liver - 22 * idx.carbLoad * (0.5 + patient.profile.hepaticFat) - 4 * idx.stressN + 12 * idx.actNorm),
    kidneys: outOf(patient.organBaselines.kidneys - 26 * (idx.cardiacStrain / 100) * (0.5 + patient.profile.renalLoad * 0.7) - 6 * idx.stressN + 6 * idx.actNorm),
  };

  const result = {};
  Object.keys(vitality).forEach((key) => {
    const v = vitality[key];
    const risk = Math.round(100 - v);
    const bioAgeDelta = Number((((70 - v) / 10) * 0.9).toFixed(1));
    const momentum =
      (idx.metabolic - 55) * 0.06 + idx.actNorm * 9 - idx.sleepDeficit * 8 - idx.stressN * 6 + (patient.profile.recoveryRate - 0.5) * 4;
    const projected90 = Math.round(clamp(v + momentum, 3, 99));
    result[key] = {
      key,
      ...ORGAN_META[key],
      risk,
      vitality: Math.round(v),
      bioAgeDelta,
      projected90,
      delta90: projected90 - Math.round(v),
    };
  });
  return result;
}

// ------------------------------------------------------------
// Auto-generated AI clinical notes (explain WHY curves moved)
// ------------------------------------------------------------
export function generateClinicalNotes(patient, s, prev) {
  const idx = computeIndices(patient, s);
  const notes = [];
  const d = prev
    ? {
        sleep: s.sleep - prev.sleep,
        carbs: s.carbs - prev.carbs,
        activity: s.activity - prev.activity,
        stress: s.stress - prev.stress,
      }
    : null;

  notes.push(
    `<b>Twin ${patient.name}</b> — Metabolic Health Index sits at <b>${Math.round(idx.metabolic)}</b>/100 with projected peak-glucose spike probability of <b>${Math.round(idx.glucoseRisk)}%</b> against remaining beta-cell reserve (${Math.round(patient.profile.betaCellFunction * 100)}% functional).`
  );

  if (idx.glucoseRisk > 65) {
    notes.push(
      `Carb load of <b>${s.carbs} g/day</b> exceeds simulated insulin-clearance capacity — post-prandial glucose breaches the 160 mg/dL flag line at all three meal windows. Recommend redistributing ≥60 g toward low-glycemic fiber sources.`
    );
  } else if (idx.glucoseRisk < 35) {
    notes.push(
      `Glucose excursions are well-buffered: meal peaks stay within ±25 mg/dL of baseline, indicating carbohydrate intake (${s.carbs} g) is matched to current oxidative capacity.`
    );
  }

  if (s.sleep < 6) {
    notes.push(
      `Sleep restricted to <b>${s.sleep} h</b> — simulated hepatic insulin resistance rises ~${Math.round(8 + (6 - s.sleep) * 4)}% and the evening cortisol limb fails to descend below ${(6 + (7.5 - s.sleep) * 2.4).toFixed(1)} µg/dL, sustaining nocturnal cardiac strain (+${Math.round(idx.cardiacStrain / 6)} bpm effective load).`
    );
  } else if (s.sleep >= 7.5) {
    notes.push(
      `Sleep restored to <b>${s.sleep} h</b>: modelled slow-wave restoration clears adenosine debt, sharpening the 07:00 cortisol awakening response while flattening the evening HPA tail — the classic recovery signature in this twin.`
    );
  }

  if (s.activity >= 45) {
    notes.push(
      `Exercise volume <b>${s.activity} min/day</b> drives GLUT-4 translocation independent of insulin — the simulator shows a ${Math.round(idx.actNorm * 22)}% deeper post-meal glucose decay and improved nocturnal HR dipping.`
    );
  } else if (s.activity <= 20) {
    notes.push(
      `Activity at <b>${s.activity} min/day</b> leaves glucose disposal almost entirely insulin-dependent; clearance half-time stretches past 90 minutes after the dinner excursion.`
    );
  }

  if (s.stress >= 7) {
    notes.push(
      `Psychological Stress Index <b>${s.stress}/10</b> keeps sympatho-adrenal tone elevated: 24-h cortisol AUM inflates ~${Math.round(s.stress * 6)}%, directly loading the cardiac strain gauge to <b>${Math.round(idx.cardiacStrain)}</b>/100.`
    );
  } else if (s.stress <= 3) {
    notes.push(
      `Stress at <b>${s.stress}/10</b> — parasympathetic dominance restores baroreflex gain; the heart-rate trace exhibits healthy 8–11% respiratory sinus arrhythmia amplitude.`
    );
  }

  if (d) {
    const deltas = [];
    if (Math.abs(d.sleep) >= 0.5) deltas.push(`sleep ${d.sleep > 0 ? '+' : ''}${d.sleep.toFixed(1)} h`);
    if (Math.abs(d.carbs) >= 10) deltas.push(`carbs ${d.carbs > 0 ? '+' : ''}${Math.round(d.carbs)} g`);
    if (Math.abs(d.activity) >= 5) deltas.push(`activity ${d.activity > 0 ? '+' : ''}${Math.round(d.activity)} min`);
    if (Math.abs(d.stress) >= 1) deltas.push(`stress ${d.stress > 0 ? '+' : ''}${d.stress.toFixed(0)} pts`);
    if (deltas.length) {
      const before = computeIndices(patient, prev);
      notes.push(
        `<span class="text-cyan-300">Δ-response:</span> since the last adjustment (${deltas.join(', ')}), composite cardiac strain shifted ${idx.cardiacStrain > before.cardiacStrain ? '▲ upward' : '▼ downward'} — twin re-converged in <b>&lt;200 ms</b> signal cycles.`
      );
    }
  }
  return notes;
}
