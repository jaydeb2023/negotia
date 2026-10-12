import { useState } from 'react';
import Link from 'next/link';
import AppShell from '../../../components/AppShell';
import { PageHead, Badge, Modal, CopyBox, Empty, ErrorNote, Loading } from '../../../components/ui';
import { useApi, useRequireRole } from '../../../lib/hooks';
import { api } from '../../../lib/http';
import { timeAgo } from '../../../lib/format';

export default function Companies() {
  const allowed = useRequireRole(['super_admin']);
  const { data, error, loading, reload } = useApi(allowed ? '/api/super/companies' : null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  if (!allowed) return <Loading />;
  const list = data || [];

  return (
    <>
      <PageHead title="Companies" subtitle="Every company on the platform. Open one to see exactly what its admin sees.">
        <button className="pf-btn gold" onClick={() => setCreating(true)}>Add company</button>
      </PageHead>
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No companies yet">Add the first company, or approve a request from the website.</Empty></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Company</th><th>Status</th><th>Seats</th><th>Calls (7 days)</th><th>Last activity</th><th /></tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c.id}>
                <td><Link className="pf-link" href={`/super/companies/${c.id}`}>{c.name}</Link>{c.contact_email && <div className="pf-muted pf-sm">{c.contact_email}</div>}</td>
                <td><Badge tone={c.status === 'active' ? 'ok' : 'bad'}>{c.status === 'active' ? 'Active' : 'Suspended'}</Badge></td>
                <td>{c.members} / {c.seat_limit}</td>
                <td>{c.calls_7d}</td>
                <td>{c.last_active ? timeAgo(c.last_active) : 'Never'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link className="pf-btn line sm" href={`/company?companyId=${c.id}`}>Open dashboard</Link>{' '}
                  <Link className="pf-btn line sm" href={`/super/companies/${c.id}`}>Manage</Link>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {creating && <Create onClose={() => setCreating(false)} onDone={(r) => { setCreating(false); setCreated(r); reload(); }} />}
      {created && (
        <Modal title={`${created.company.name} is ready`} onClose={() => setCreated(null)} footer={<button className="pf-btn navy" onClick={() => setCreated(null)}>Done</button>}>
          {created.link ? (
            <>
              <p style={{ marginTop: 0 }}>Send this link to the company's first admin. It works once and expires in 14 days.</p>
              <CopyBox value={created.link} />
              <p className="pf-muted pf-sm" style={{ marginBottom: 0 }}>The link is only shown now. You can make a new one from the company page.</p>
            </>
          ) : <p style={{ margin: 0 }}>No admin was invited yet. Open the company page to invite one.</p>}
        </Modal>
      )}
    </>
  );
}

function Create({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', seat_limit: 10, adminEmail: '', adminName: '', contact_phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr('');
    try { onDone(await api('/api/super/companies', { method: 'POST', body: f })); }
    catch (e) { setErr(e.message); setBusy(false); }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Add company" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={go} disabled={busy || !f.name.trim()}>{busy ? 'Please wait…' : 'Create company'}</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        <div><label>Company name</label><input className="input" value={f.name} onChange={set('name')} /></div>
        <div className="two">
          <div><label>Seats (people allowed)</label><input className="input" type="number" min="1" value={f.seat_limit} onChange={set('seat_limit')} /></div>
          <div><label>Phone (optional)</label><input className="input" value={f.contact_phone} onChange={set('contact_phone')} /></div>
        </div>
        <div><label>First admin's email (they get an invitation link)</label><input className="input" type="email" value={f.adminEmail} onChange={set('adminEmail')} /></div>
        <div><label>First admin's name (optional)</label><input className="input" value={f.adminName} onChange={set('adminName')} /></div>
      </div>
    </Modal>
  );
}

Companies.getLayout = (page) => <AppShell title="Companies">{page}</AppShell>;
