// ============================================================
// AetherTwin Health — AI Clinical Assistant prompt library
// Each intervention carries a parameter patch applied to Tab 1
// ============================================================

export const INTERVENTIONS = [
  {
    id: 'metformin',
    icon: 'Pill',
    label: 'Simulate Metformin 500 mg dose',
    category: 'Pharmacological',
    patch: { carbs: -40, activity: +10 }, // relative shifts applied to current twin state
    insight:
      'Metformin 500 mg reduces hepatic glucose output by ~18% via AMPK activation and improves peripheral insulin sensitivity. In this twin the simulator compensates by lowering effective carbohydrate exposure (-40 g equivalent) and mild appetite-driven activity gain (+10 min). Watch the post-prandial glucose peaks flatten within 2 signal cycles; GI side-effect probability is modelled at 12% for the first two weeks.',
    kpis: ['Peak glucose −22%', 'HOMA-IR −0.8', 'A1c drift −0.3%/yr'],
  },
  {
    id: 'walk',
    icon: 'Footprints',
    label: 'Suggest 20-min post-meal walk',
    category: 'Lifestyle',
    patch: { activity: +20, carbs: -10 },
    insight:
      'A 20-minute walk initiated within 30 minutes of a meal recruits skeletal-muscle GLUT-4 uptake independent of insulin signalling, shaving 20–30% off the post-prandial excursion. The twin now logs +20 min daily activity; note the dinner glucose limb decays faster and nocturnal HR dipping improves as baroreflex load drops.',
    kpis: ['Post-meal spike −27%', 'Clearance half-time −18 min', 'Nocturnal HR dip +4%'],
  },
  {
    id: 'sleep',
    icon: 'MoonStar',
    label: 'Optimize sleep architecture',
    category: 'Recovery',
    patch: { sleep: +1.5, stress: -2 },
    insight:
      'Extending slow-wave and REM coverage (target 7.5 h, consistent 22:30 onset, 18°C bedroom, screens off 60 min pre-bed) restores glymphatic clearance and normalises the HPA axis. Simulation applies +1.5 h sleep and −2 stress points: the evening cortisol tail flattens and cardiac strain falls immediately. Sleep debt of >1.5 h/night is the single largest multiplier on this twin’s insulin resistance.',
    kpis: ['Cortisol AUM −19%', 'Insulin sensitivity +11%', 'Strain index −14 pts'],
  },
  {
    id: 'hrv',
    icon: 'Wind',
    label: '10-min coherent breathing (HRV biofeedback)',
    category: 'Mind-body',
    patch: { stress: -2.5, sleep: +0.5 },
    insight:
      ' paced breathing at 5.5 breaths/min entrains respiratory-cardiac coherence, raising HRV and vagal tone within one session. Modelled as −2.5 stress points and +0.5 h sleep quality credit. The heart-rate curve should show increased respiratory sinus arrhythmia amplitude and a lower autonomic floor across the day.',
    kpis: ['HRV +16 ms RMSSD', 'Stress index −2.5', 'Resting HR −3 bpm'],
  },
  {
    id: 'nutrition',
    icon: 'Salad',
    label: 'Low-glycemic diet restructure',
    category: 'Nutrition',
    patch: { carbs: -80, activity: +5 },
    insight:
      'Replacing high-GI staples with legumes, intact grains and resistant starch lowers the glycaemic load of each meal by ~30% without calorie reduction. The twin receives an −80 g effective carbohydrate shift. Meal-window excursions compress toward baseline; expect the beta-cell demand ratio to fall below the decompensation threshold flagged in the pancreas card.',
    kpis: ['Glycaemic load −31%', 'Glucose risk −24 pts', 'Beta-cell demand −18%'],
  },
  {
    id: 'strength',
    icon: 'Dumbbell',
    label: 'Add 3× resistance-training sessions',
    category: 'Exercise',
    patch: { activity: +30, stress: -1 },
    insight:
      'Resistance training three times weekly expands muscle glycogen storage capacity (~+120 g), acting as a metabolic sink for circulating glucose and improving lean-mass-relative basal rate. Simulation adds +30 min equivalent daily activity and a modest mood benefit. Cardiac strain initially ticks up during the session window but the 24-h average falls.',
    kpis: ['Glycogen sink +120 g', 'Insulin sensitivity +14%', 'Strain 24h avg −9 pts'],
  },
];
