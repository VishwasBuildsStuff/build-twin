import { useEffect, useState } from 'react';
import { Activity, Check, RotateCcw, Save } from 'lucide-react';

const MODEL_FIELDS = [
  ['insulinResistance', 'Insulin resistance'], ['betaCellFunction', 'Beta-cell function'],
  ['cardiacBaseline', 'Cardiac baseline'], ['cortisolBaseline', 'Cortisol baseline'],
  ['renalLoad', 'Renal load'], ['hepaticFat', 'Hepatic fat'],
  ['neuroVulnerability', 'Neuro vulnerability'], ['recoveryRate', 'Recovery rate'],
];

function Field({ label, value, onChange, min, max, step = 1, unit, type = 'number', ...props }) {
  return (
    <label className="block text-xs font-semibold text-slate-300">
      {label}{unit && <span className="ml-1 font-normal text-slate-500">({unit})</span>}
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        required
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/60"
        {...props}
      />
    </label>
  );
}

export default function DataEntryTab({ patient, settings, onSave, onReset }) {
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft({
      name: patient.name,
      age: patient.age == null ? '' : String(patient.age),
      sex: patient.sex || '',
      conditions: patient.conditions.join(', '),
      restingHR: patient.manualData?.vitals?.restingHR == null ? '' : String(patient.manualData.vitals.restingHR),
      systolic: patient.manualData?.vitals?.systolic == null ? '' : String(patient.manualData.vitals.systolic),
      diastolic: patient.manualData?.vitals?.diastolic == null ? '' : String(patient.manualData.vitals.diastolic),
      bmi: patient.manualData?.vitals?.bmi == null ? '' : String(patient.manualData.vitals.bmi),
      hba1c: patient.manualData?.vitals?.hba1c == null ? '' : String(patient.manualData.vitals.hba1c),
      ...Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, String(value)])),
      ...Object.fromEntries(MODEL_FIELDS.map(([key]) => [key, String(Math.round(patient.profile[key] * 100))])),
    });
    setSaved(false);
  }, [patient.id]);

  if (!draft) return null;

  const update = (key) => (value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  const save = (event) => {
    event.preventDefault();
    const numeric = (key) => Number(draft[key]);
    const optionalNumber = (key) => draft[key] === '' ? null : numeric(key);
    const manualVitals = {
      restingHR: optionalNumber('restingHR'), systolic: optionalNumber('systolic'), diastolic: optionalNumber('diastolic'),
      bmi: optionalNumber('bmi'), hba1c: optionalNumber('hba1c'),
    };
    const simulationVitals = { ...patient.vitals };
    Object.entries(manualVitals).forEach(([key, value]) => { if (value != null) simulationVitals[key] = value; });
    const conditions = draft.conditions.split(',').map((item) => item.trim()).filter(Boolean);
    const age = optionalNumber('age');
    onSave({
      patient: {
        name: draft.name.trim() || patient.name,
        age,
        sex: draft.sex,
        conditions,
        vitals: simulationVitals,
        manualData: { age, sex: draft.sex, conditions, vitals: manualVitals },
        profile: Object.fromEntries(MODEL_FIELDS.map(([key]) => [key, numeric(key) / 100])),
      },
      settings: { sleep: numeric('sleep'), carbs: numeric('carbs'), activity: numeric('activity'), stress: numeric('stress') },
    });
    setSaved(true);
  };

  return (
    <form onSubmit={save} className="animate-fadeUp space-y-5">
      <div className="glass flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Activity className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-extrabold text-white">My health data</h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">Your personal details and vitals start blank. The simulator uses neutral starter parameters until you enter values. Saving updates the simulator, organ view, assistant, and evaluation report.</p>
          </div>
        </div>
        <button type="button" onClick={onReset} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white">
          <RotateCcw className="h-3.5 w-3.5" /> Reset to neutral defaults
        </button>
      </div>

      <section className="glass p-5 sm:p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-cyan-300">Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" type="text" value={draft.name} onChange={update('name')} />
          <Field label="Age" value={draft.age} onChange={update('age')} min={1} max={120} unit="years" required={false} />
          <label className="block text-xs font-semibold text-slate-300">Sex
            <select value={draft.sex} onChange={(event) => update('sex')(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60">
              <option value="">Not entered</option><option>Female</option><option>Male</option><option>Intersex</option><option>Prefer not to say</option>
            </select>
          </label>
          <Field label="Conditions or notes" type="text" value={draft.conditions} onChange={update('conditions')} placeholder="Separate items with commas" required={false} />
        </div>
      </section>

      <section className="glass p-5 sm:p-6">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-300">Vitals and lab values</h3>
        <p className="mb-4 text-xs text-slate-500">Use values from your own records if you have them. These fields do not provide a diagnosis.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Resting heart rate" value={draft.restingHR} onChange={update('restingHR')} min={25} max={220} unit="bpm" required={false} />
          <Field label="Systolic pressure" value={draft.systolic} onChange={update('systolic')} min={50} max={280} unit="mmHg" required={false} />
          <Field label="Diastolic pressure" value={draft.diastolic} onChange={update('diastolic')} min={30} max={180} unit="mmHg" required={false} />
          <Field label="BMI" value={draft.bmi} onChange={update('bmi')} min={8} max={100} step="0.1" unit="kg/m²" required={false} />
          <Field label="HbA1c" value={draft.hba1c} onChange={update('hba1c')} min={3} max={20} step="0.1" unit="%" required={false} />
        </div>
      </section>

      <section className="glass p-5 sm:p-6">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-300">Daily values used by the simulator</h3>
        <p className="mb-4 text-xs text-slate-500">These are editable here and also adjustable on the Live Twin Simulator tab.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Sleep" value={draft.sleep} onChange={update('sleep')} min={3} max={10} step="0.5" unit="hours" />
          <Field label="Carbohydrates" value={draft.carbs} onChange={update('carbs')} min={20} max={300} unit="g/day" />
          <Field label="Activity" value={draft.activity} onChange={update('activity')} min={0} max={120} unit="min/day" />
          <Field label="Stress" value={draft.stress} onChange={update('stress')} min={1} max={10} unit="1–10" />
        </div>
      </section>

      <details className="glass p-5 sm:p-6">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-violet-300">Advanced twin model inputs <span className="font-normal normal-case tracking-normal text-slate-500">(optional, 0–100%)</span></summary>
        <p className="mb-4 mt-2 text-xs text-slate-500">These are model parameters, not direct clinical measurements. Adjust them only if you understand the simulation assumptions.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODEL_FIELDS.map(([key, label]) => (
            <Field key={key} label={label} value={draft[key]} onChange={update(key)} min={0} max={100} unit="%" />
          ))}
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:brightness-110">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saved ? 'Saved to your twin' : 'Save measurements'}
        </button>
        {saved && <span role="status" className="text-xs text-emerald-300">Your values are saved in this browser and are now used across the twin views.</span>}
      </div>
    </form>
  );
}
