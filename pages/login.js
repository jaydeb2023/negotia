import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
      });
      if (error) setError(error.message);
      else router.push('/');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push('/');
    }
    setBusy(false);
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  }

  return (
    <div className="auth-shell" style={{ minHeight: 'calc(100vh - 59px)' }}>
      <div className="auth-brandpanel">
        <div className="auth-brand-inner">
          {logoOk ? (
            <img
              src="/logo.png"
              alt="Transcend"
              className="auth-logo-img"
              style={{ height: 'auto', width: 260, maxWidth: '100%', marginBottom: 14 }}
              onError={() => setLogoOk(false)}
            />
          ) : (
            <>
              <div className="brand-mark-lg">T</div>
              <h2>Transcend</h2>
            </>
          )}
          <p>Sales Negotiation Training Platform</p>
          <ul className="auth-features">
            <li>🎤 Voice-based practice with real AI personas</li>
            <li>📈 Progress tracked automatically, level by level</li>
            <li>🔒 Locked levels — master one before the next unlocks</li>
          </ul>
        </div>
      </div>

      <div className="auth-formpanel">
        <div className="auth-form-card">
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-sub">
            {mode === 'signin' ? 'Sign in to continue your training.' : 'Start practicing in a few seconds.'}
          </p>

          <button type="button" className="btn-google" onClick={signInWithGoogle}>
            <img
              src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw"
              alt=""
              width="18"
              height="18"
            />
            Continue with Google
          </button>
          <div className="auth-divider"><span>or</span></div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="field">
                <label>Full name</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <a onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}