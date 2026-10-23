import { useEffect, useMemo, useState } from 'react';
import { Sliders, HeartPulse, Bot, ClipboardCheck, Activity, Radio, ClipboardPenLine } from 'lucide-react';
import Header from './components/Header';
import SimulatorTab from './components/SimulatorTab';
import OrgansTab from './components/OrgansTab';
import AssistantTab from './components/AssistantTab';
import EvaluationTab from './components/EvaluationTab';
import AuthScreen from './components/AuthScreen';
import DataEntryTab from './components/DataEntryTab';
import { MY_TWIN_ID, PERSONAL_TWIN_BASE } from './data/patients';
import { getSignedInUser, getUserData, saveUserData, signOut } from './data/auth';

const TABS = [
  { id: 'simulator', label: 'Live Twin Simulator', icon: Sliders },
  { id: 'organs', label: 'Organ Virtualization', icon: HeartPulse },
  { id: 'assistant', label: 'AI Clinical Assistant', icon: Bot },
  { id: 'jury', label: 'Jury & Evaluation Hub', icon: ClipboardCheck },
  { id: 'data', label: 'My Health Data', icon: ClipboardPenLine },
];

function getTwinState(user) {
  if (!user) {
    return { patient: { name: PERSONAL_TWIN_BASE.name }, settings: { ...PERSONAL_TWIN_BASE.baseline }, history: [], lastSnapshot: null };
  }

  const saved = getUserData(user.id);
  const legacyPatientId = saved.patientId || 'rahul';
  const legacyPatient = saved.patient || saved.patientOverrides?.[MY_TWIN_ID] || saved.patientOverrides?.[legacyPatientId] || {};
  const hasManualData = Boolean(
    legacyPatient.hasMeasurements || legacyPatient.age != null ||
    (legacyPatient.manualData && Object.keys(legacyPatient.manualData).length)
  );
  const fakeNames = ['Rahul Sharma', 'Elena Rostova', 'Marcus Vance'];
  const migratedName = fakeNames.includes(legacyPatient.name) ? user.name : legacyPatient.name || user.name;
  const legacySettings = saved.settings || saved.settingsByPatient?.[MY_TWIN_ID] || saved.settingsByPatient?.[legacyPatientId];
  const legacyHistory = saved.history || saved.historyByPatient?.[MY_TWIN_ID] || saved.historyByPatient?.[legacyPatientId];
  const legacySnapshot = saved.lastSnapshot || saved.lastSnapshotByPatient?.[MY_TWIN_ID] || saved.lastSnapshotByPatient?.[legacyPatientId];

  return {
    patient: {
      ...legacyPatient,
      name: migratedName,
      id: MY_TWIN_ID,
      hasMeasurements: Boolean(hasManualData),
      manualData: legacyPatient.manualData || (hasManualData ? {
        age: legacyPatient.age ?? null,
        sex: legacyPatient.sex || '',
        conditions: legacyPatient.conditions || [],
        vitals: legacyPatient.vitals || {},
      } : {}),
    },
    settings: hasManualData && legacySettings ? legacySettings : { ...PERSONAL_TWIN_BASE.baseline },
    history: hasManualData && legacyHistory ? legacyHistory : [],
    lastSnapshot: hasManualData ? legacySnapshot || null : null,
  };
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'MT';
}

export default function App() {
  const [user, setUser] = useState(() => getSignedInUser());
  const [loadedUserId, setLoadedUserId] = useState(() => getSignedInUser()?.id || null);
  const [twinData, setTwinData] = useState(() => getTwinState(getSignedInUser()));
  const [activeTab, setActiveTab] = useState('simulator');
  const [profileRevision, setProfileRevision] = useState(0);
  const [liveHz, setLiveHz] = useState(100);
  const [packets, setPackets] = useState(184_203);

  const patient = useMemo(() => ({
    ...PERSONAL_TWIN_BASE,
    ...twinData.patient,
    initials: getInitials(twinData.patient.name || user?.name),
    vitals: { ...PERSONAL_TWIN_BASE.vitals, ...twinData.patient.vitals },
    profile: { ...PERSONAL_TWIN_BASE.profile, ...twinData.patient.profile },
    organBaselines: { ...PERSONAL_TWIN_BASE.organBaselines, ...twinData.patient.organBaselines },
  }), [twinData.patient, user]);
  const settings = twinData.settings;
  const history = twinData.history;
  const lastSnapshot = twinData.lastSnapshot;

  useEffect(() => {
    const timer = setInterval(() => setLiveHz(97 + Math.floor(Math.random() * 6)), 2500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setPackets((count) => count + 20 + Math.floor(Math.random() * 12)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && loadedUserId === user.id) {
      saveUserData(user.id, { patient: twinData.patient, settings, history, lastSnapshot });
    }
  }, [user, loadedUserId, twinData.patient, settings, history, lastSnapshot]);

  const handleAuthenticated = (nextUser) => {
    setUser(nextUser);
    setLoadedUserId(nextUser.id);
    setTwinData(getTwinState(nextUser));
    setActiveTab('data');
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setLoadedUserId(null);
  };

  const applySettings = (nextSettings) => {
    setTwinData((current) => ({ ...current, lastSnapshot: { ...current.settings }, settings: nextSettings }));
  };

  const handleSaveManualData = ({ patient: nextPatient, settings: nextSettings }) => {
    setTwinData((current) => ({
      ...current,
      patient: { ...current.patient, ...nextPatient, id: MY_TWIN_ID, hasMeasurements: true },
      lastSnapshot: { ...current.settings },
      settings: nextSettings,
    }));
  };

  const handleResetManualData = () => {
    setTwinData((current) => ({
      ...current,
      patient: { name: user?.name || PERSONAL_TWIN_BASE.name, id: MY_TWIN_ID },
      settings: { ...PERSONAL_TWIN_BASE.baseline },
      lastSnapshot: { ...current.settings },
    }));
    setProfileRevision((revision) => revision + 1);
  };

  const handleApplyIntervention = (nextSettings, intervention) => {
    setTwinData((current) => ({
      ...current,
      lastSnapshot: { ...current.settings },
      settings: nextSettings,
      history: [...current.history, { label: intervention.label, time: new Date().toLocaleTimeString(), tab: 'simulator' }],
    }));
    setActiveTab('simulator');
  };

  if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} />;

  return (
    <div className="min-h-screen">
      <Header
        patient={patient}
        user={user}
        onSignOut={handleSignOut}
        liveHz={liveHz}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        TABS={TABS}
      />

      <div className="border-b border-white/5 bg-slate-900/40">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 lg:px-6">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br text-[11px] font-extrabold text-white ${patient.avatarGradient}`}>
              {patient.initials}
            </span>
            <div>
              <p className="text-[13px] font-bold leading-tight text-white">{patient.name} <span className="font-normal text-slate-400">· {patient.tagline}</span></p>
              <p className="font-mono text-[10px] text-slate-500">{patient.conditions.length ? patient.conditions.join('  |  ') : 'No health notes added'}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 font-mono text-[10px] text-slate-500">
            <span><Activity className="mr-1 inline h-3 w-3 text-emerald-400" />RHR {patient.manualData?.vitals?.restingHR == null ? 'not entered' : `${patient.manualData.vitals.restingHR} bpm`}</span>
            <span><Radio className="mr-1 inline h-3 w-3 text-cyan-400" />{packets.toLocaleString()} simulated telemetry packets</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        {activeTab === 'simulator' && <SimulatorTab patient={patient} settings={settings} onSettingsChange={applySettings} lastSnapshot={lastSnapshot} />}
        {activeTab === 'organs' && <OrgansTab patient={patient} settings={settings} />}
        {activeTab === 'assistant' && <AssistantTab patient={patient} settings={settings} onApplyIntervention={handleApplyIntervention} history={history} />}
        {activeTab === 'jury' && <EvaluationTab patient={patient} settings={settings} history={history} lastSnapshot={lastSnapshot} />}
        {activeTab === 'data' && <DataEntryTab key={`${patient.id}-${profileRevision}`} patient={patient} settings={settings} onSave={handleSaveManualData} onReset={handleResetManualData} />}
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
