import { useState } from 'react';
import { api } from '../lib/http';

// Website form for contact messages (kind="contact") and company requests (kind="company").
export default function LeadForm({ kind }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', company_name: '', team_size: '', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/leads', { method: 'POST', body: { ...f, kind } });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="mk-form" role="status">
        <h3 style={{ margin: 0, fontSize: 22 }}>Thank you, we have your {kind === 'company' ? 'request' : 'message'}.</h3>
        <p style={{ margin: 0, color: 'var(--pf-muted)', lineHeight: 1.65 }}>
          {kind === 'company'
            ? 'We will contact you on the email you gave to set up your company account.'
            : 'We will reply to the email you gave as soon as we can.'}
        </p>
      </div>
    );
  }

  return (
    <form className="mk-form" onSubmit={submit}>
      <div className="two">
        <div><label htmlFor="lf-name">Your name</label><input id="lf-name" className="input" value={f.name} onChange={set('name')} required maxLength={120} /></div>
        <div><label htmlFor="lf-email">Email</label><input id="lf-email" className="input" type="email" value={f.email} onChange={set('email')} required /></div>
      </div>
      {kind === 'company' && (
        <div className="two">
          <div><label htmlFor="lf-co">Company name</label><input id="lf-co" className="input" value={f.company_name} onChange={set('company_name')} required maxLength={160} /></div>
          <div>
            <label htmlFor="lf-size">Team size</label>
            <select id="lf-size" className="input" value={f.team_size} onChange={set('team_size')}>
              <option value="">Choose…</option>
              <option>1-10</option><option>11-25</option><option>26-50</option><option>51-100</option><option>100+</option>
            </select>
          </div>
        </div>
      )}
      <div><label htmlFor="lf-phone">Phone (optional)</label><input id="lf-phone" className="input" value={f.phone} onChange={set('phone')} maxLength={40} /></div>
      <div>
        <label htmlFor="lf-msg">{kind === 'company' ? 'Anything we should know? (optional)' : 'Message'}</label>
        <textarea id="lf-msg" rows={5} value={f.message} onChange={set('message')} required={kind !== 'company'} maxLength={2000} />
      </div>
      <div className="mk-hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
      {error && <div className="pf-err" role="alert" style={{ margin: 0 }}>{error}</div>}
      <button className="mk-btn gold" disabled={busy} style={{ justifySelf: 'start' }}>
        {busy ? 'Sending…' : kind === 'company' ? 'Send request' : 'Send message'}
      </button>
    </form>
  );
}
