import { useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { signIn, signUp } from '../data/auth';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const user = mode === 'signup'
        ? await signUp({ name, email, password })
        : await signIn({ email, password });
      onAuthenticated(user);
    } catch (submitError) {
      setError(submitError.message || 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-emerald-500/10 p-10 md:flex">
          <div>
            <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">Personal health twin</p>
            <h1 className="max-w-sm text-4xl font-extrabold leading-tight text-white">Your health data, connected to your twin.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">Enter your own measurements, explore the simulation, and keep your profile saved in this browser.</p>
          </div>
          <p className="text-xs leading-5 text-slate-500">Demo account data stays in this browser. This app is a research simulation, not a medical device.</p>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950"><Activity className="h-5 w-5" /></span>
            <span className="text-lg font-extrabold text-white">BuildTwin</span>
          </div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">AetherTwin Health</p>
          <h2 className="mt-2 text-2xl font-extrabold text-white">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-slate-400">{mode === 'signin' ? 'Sign in to open your health twin.' : 'Create a local demo account to save your measurements.'}</p>

          <form className="mt-7 space-y-4" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="block text-xs font-semibold text-slate-300">
                Your name
                <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 focus-within:border-cyan-400/60">
                  <UserRound className="h-4 w-4 text-slate-500" />
                  <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                </span>
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-300">
              Email address
              <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 focus-within:border-cyan-400/60">
                <Mail className="h-4 w-4 text-slate-500" />
                <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
              </span>
            </label>
            <label className="block text-xs font-semibold text-slate-300">
              Password
              <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3.5 py-3 focus-within:border-cyan-400/60">
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <input required type="password" minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
              </span>
            </label>
            {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3.5 text-sm font-extrabold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            {mode === 'signin' ? 'New to BuildTwin?' : 'Already have an account?'}{' '}
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }} className="font-bold text-cyan-300 hover:text-cyan-200">
              {mode === 'signin' ? 'Create account' : 'Sign in'}
            </button>
          </p>
          <p className="mt-6 text-center text-[11px] leading-5 text-slate-600">This prototype stores demo account details in your browser only. Do not enter sensitive real-world health information.</p>
        </section>
      </div>
    </main>
  );
}
