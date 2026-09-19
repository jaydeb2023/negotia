import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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

  return (
    <div className="page">
      <div className="card" style={{ padding: 28, maxWidth: 380, margin: '60px auto' }}>
        <h2 style={{ marginTop: 0 }}>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
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
          {error && <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{error}</p>}
          <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: '.85rem' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <a onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ color: 'var(--indigo)', cursor: 'pointer', fontWeight: 600 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}