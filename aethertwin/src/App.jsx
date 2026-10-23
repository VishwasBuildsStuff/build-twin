import { useEffect, useRef, useState } from 'react';
import { Sliders, HeartPulse, Bot, ClipboardCheck, Activity, Radio } from 'lucide-react';
import Header from './components/Header';
import SimulatorTab from './components/SimulatorTab';
import OrgansTab from './components/OrgansTab';
import AssistantTab from './components/AssistantTab';
import EvaluationTab from './components/EvaluationTab';
import { PATIENTS } from './data/patients';

const TABS = [
  { id: 'simulator', label: 'Live Twin Simulator', icon: Sliders },
  { id: 'organs', label: 'Organ Virtualization', icon: HeartPulse },
  { id: 'assistant', label: 'AI Clinical Assistant', icon: Bot },
  { id: 'jury', label: 'Jury & Evaluation Hub', icon: ClipboardCheck },
];

export default function App() {
  const [patientId, setPatientId] = useState(PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState('simulator');
  const patient = PATIENTS.find((p) => p.id === patientId);

  // Each twin keeps its own what-if slider state (seeded from baseline mock data)
  const [settingsByPatient, setSettingsByPatient] = useState(() =>
    Object.fromEntries(PATIENTS.map((p) => [p.id, { ...p.baseline }]))
  );
  const settings = settingsByPatient[patientId];

  // Last snapshot before the most recent change — powers Δ-response clinical notes
  const prevRef = useRef(null);
  const [lastSnapshot, setLastSnapshot] = useState(null);

  const applySettings = (next) => {
    prevRef.current = { ...settings };
    setLastSnapshot({ ...settings });
    setSettingsByPatient((all) => ({ ...all, [patientId]: next }));
  };

  // Intervention audit trail (per session, per patient)
  const [historyByPatient, setHistoryByPatient] = useState(
    Object.fromEntries(PATIENTS.map((p) => [p.id, []]))
  );
  const history = historyByPatient[patientId];

  const handleApplyIntervention = (nextSettings, intervention) => {
    applySettings(nextSettings);
    setHistoryByPatient((h) => ({
      ...h,
      [patientId]: [...h[patientId], { label: intervention.label, time: new Date().toLocaleTimeString(), tab: 'simulator' }],
    }));
    setActiveTab('simulator'); // jump back to show immediate recovery on the curves
  };

  // Live signal-rate ticker in the header (100Hz nominal, jitter ±3 for realism)
  const [liveHz, setLiveHz] = useState(100);
  useEffect(() => {
    const t = setInterval(() => setLiveHz(97 + Math.floor(Math.random() * 6)), 2500);
    return () => clearInterval(t);
  }, []);

  // Simulated telemetry pulse counter
  const [packets, setPackets] = useState(184_203);
  useEffect(() => {
    const t = setInterval(() => setPackets((p) => p + 20 + Math.floor(Math.random() * 12)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        patientId={patientId}
        onPatientChange={setPatientId}
        liveHz={liveHz}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        TABS={TABS}
      />

      {/* Patient context ribbon */}
      <div className="border-b border-white/5 bg-slate-900/40">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br text-[11px] font-extrabold text-white ${patient.avatarGradient}`}>
              {patient.initials}
            </span>
            <div>
              <p className="text-[13px] font-bold leading-tight text-white">{patient.name} <span className="font-normal text-slate-400">· {patient.tagline}</span></p>
              <p className="font-mono text-[10px] text-slate-500">{patient.conditions.join('  |  ')}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] text-slate-500">
            <span><Activity className="mr-1 inline h-3 w-3 text-emerald-400" />RHR {patient.vitals.restingHR} bpm</span>
            <span><Radio className="mr-1 inline h-3 w-3 text-cyan-400" />{packets.toLocaleString()} telemetry packets synced</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        {activeTab === 'simulator' && (
          <SimulatorTab patient={patient} settings={settings} onSettingsChange={applySettings} lastSnapshot={lastSnapshot} />
        )}
        {activeTab === 'organs' && <OrgansTab patient={patient} settings={settings} />}
        {activeTab === 'assistant' && (
          <AssistantTab patient={patient} settings={settings} onApplyIntervention={handleApplyIntervention} history={history} />
        )}
        {activeTab === 'jury' && (
          <EvaluationTab patient={patient} settings={settings} history={history} lastSnapshot={lastSnapshot} />
        )}
      </main>

      <footer className="mx-auto max-w-[1600px] px-4 pb-8 pt-2 lg:px-6">
        <p className="text-center font-mono text-[10px] leading-relaxed text-slate-600">
          AetherTwin Health v1.0.0 · research-grade simulation — not a medical device · projections are model-derived and do not constitute medical advice.
          <br />Built for the Happiest Health Digital Twin Challenge.
        </p>
      </footer>
    </div>
  );
}
