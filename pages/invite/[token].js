import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { api } from '../../lib/http';
import { useAuth } from '../../lib/AuthContext';
import { homeFor } from '../../lib/roles';

// A company admin sends this link to a new employee.
export default function Invite() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ fullName: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api(`/api/invites/${token}`).then(setInfo).catch(() => setInfo({ valid: false }));
  }, [token]);

  useEffect(() => {
    if (info?.valid && !form.fullName && info.full_name) setForm((f) => ({ ...f, fullName: info.full_name }));
  }, [info]);

  async function createAccount(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/invites/accept', { method: 'POST', body: { token, ...form } });
      const r = await signIn('credentials', { email: info.email, password: form.password, redirect: false });
      if (r?.error) throw new Error('Your account was created. Please sign in.');
      router.push('/post-login');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function joinNow() {
    setBusy(true);
    setError('');
    try {
      await api('/api/invites/claim', { method: 'POST', body: { token } });
      window.location.href = homeFor(info.role === 'company_admin' ? 'company_admin' : 'employee');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const sameEmail = user && info?.valid && user.email.toLowerCase() === info.email.toLowerCase();
  const roleLabel = info?.role === 'company_admin' ? 'company admin' : 'team member';

  return (
    <div className="auth-formpanel" style={{ minHeight: '100vh' }}>
      <Head><title>Join your company | Transcend</title></Head>
      <div className="auth-form-card" style={{ maxWidth: 440 }}>
        <img src="/logo.png" alt="Transcend" style={{ height: 34, width: 'auto', background: '#12203F', padding: 10, borderRadius: 10, marginBottom: 22 }} />

        {!info && <p>Checking your invitation…</p>}

        {info && !info.valid && (
          <>
            <h1>This invitation is no longer valid</h1>
            <p className="auth-sub">It may have been used, cancelled or expired. Ask your company admin to send a new link.</p>
            <Link href="/login" className="pf-link">Go to sign in</Link>
          </>
        )}

        {info?.valid && (
          <>
            <h1>Join {info.company_name}</h1>
            <p className="auth-sub">You were invited as a {roleLabel}, using <b>{info.email}</b>.</p>

            {!loading && sameEmail && (
              <>
                <p>You are signed in as {user.email}.</p>
                {error && <p className="auth-error">{error}</p>}
                <button className="btn-primary" style={{ width: '100%' }} onClick={joinNow} disabled={busy || role === 'super_admin'}>
                  {busy ? 'Please wait…' : `Join ${info.company_name}`}
                </button>
              </>
            )}

            {!loading && user && !sameEmail && (
              <>
                <p className="auth-error">You are signed in as {user.email}, but this invitation is for {info.email}.</p>
                <button className="btn-ghost" onClick={() => import('next-auth/react').then((m) => m.signOut({ callbackUrl: router.asPath }))}>Sign out and continue</button>
              </>
            )}

            {!loading && !user && (
              <>
                <button type="button" className="btn-google" onClick={() => signIn('google', { callbackUrl: router.asPath })}>Continue with Google</button>
                <div className="auth-divider"><span>or create a password</span></div>
                <form onSubmit={createAccount}>
                  <div className="field"><label>Full name</label><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
                  <div className="field"><label>Choose a password (8+ characters)</label><input className="input" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
                  {error && <p className="auth-error">{error}</p>}
                  <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Please wait…' : 'Create account and join'}</button>
                </form>
                <p className="auth-sub" style={{ marginTop: 14 }}>If you use Google, choose the Google account for <b>{info.email}</b>.</p>
                <p className="auth-switch">Already have a password account? <Link href={`/login?next=${encodeURIComponent(router.asPath)}`} style={{ fontWeight: 700 }}>Sign in</Link></p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Invite.public = true;
