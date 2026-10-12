import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { api } from '../lib/http';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  // Only allow going back to a page on this website.
  const next = typeof router.query.next === 'string' && /^\/(?!\/)/.test(router.query.next) ? router.query.next : '/post-login';

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.mode === 'signup') setMode('signup');
    const e = router.query.error;
    if (e === 'ACCOUNT_DISABLED') setError('This account has been switched off. Please contact your company admin.');
    else if (e === 'COMPANY_SUSPENDED') setError("Your company's access is paused. Please contact Transcend or your company admin.");
    else if (e) setError('Sign-in did not work. Please try again.');
  }, [router.isReady]);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await api('/api/register', { method: 'POST', body: { email, password, fullName } });
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error === 'ACCOUNT_DISABLED') setError('This account has been switched off. Please contact your company admin.');
      else if (result?.error === 'COMPANY_SUSPENDED') setError("Your company's access is paused. Please contact Transcend or your company admin.");
      else if (result?.error) setError('Incorrect email or password.');
      else router.push(next);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  async function signInWithGoogle() {
    await signIn('google', { callbackUrl: next });
  }

  return (
    <div className="auth-shell" style={{ minHeight: '100vh' }}>
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
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'signup' ? 8 : 1} />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          {mode === 'signup' && <p className="auth-sub" style={{ marginTop: 10 }}>Use at least 8 characters.</p>}
          <p className="auth-switch">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <a onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </a>
          </p>
          <p className="auth-switch">
            <a href="/company-signup">Sign up your company</a> · <a href="/">Back to website</a>
          </p>
        </div>
      </div>
    </div>
  );
}

Login.public = true;