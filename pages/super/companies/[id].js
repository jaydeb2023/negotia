import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppShell from '../../../components/AppShell';
import { PageHead, Stat, Badge, Modal, CopyBox, ErrorNote, OkNote, Loading } from '../../../components/ui';
import { useApi, useRequireRole } from '../../../lib/hooks';
import { api } from '../../../lib/http';
import { ACTION_LABEL, fmtDateTime, timeAgo } from '../../../lib/format';

export default function CompanyAdminPage() {
  const allowed = useRequireRole(['super_admin']);
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const { data, error, loading, reload } = useApi(allowed && id ? `/api/super/companies/${id}` : null);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (data) setF({ name: data.company.name, seat_limit: data.company.seat_limit, contact_name: data.company.contact_name || '', contact_email: data.company.contact_email || '', contact_phone: data.company.contact_phone || '', notes: data.company.notes || '' });
  }, [data]);

  if (!allowed || loading || !f) return error ? <ErrorNote>{error}</ErrorNote> : <Loading />;
  const { company, admins, seats, stats, log } = data;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function run(fn, ok) {
    setErr(''); setMsg('');
    try { await fn(); if (ok) setMsg(ok); reload(); } catch (e) { setErr(e.message); }
  }
  const save = () => run(() => api(`/api/super/companies/${id}`, { method: 'PATCH', body: { ...f, seat_limit: Number(f.seat_limit) } }), 'Saved.');
  const setStatus = (status) => run(() => api(`/api/super/companies/${id}`, { method: 'PATCH', body: { status } }), status === 'suspended' ? 'Company suspended. Its people cannot sign in.' : 'Company reactivated.');
  async function inviteAdmin() {
    setErr('');
    try {
      const r = await api(`/api/company/employees?companyId=${id}`, { method: 'POST', body: { email: adminEmail, role: 'company_admin' } });
      setInviting(false); setAdminEmail(''); setLink(r.link); reload();
    } catch (e) { setErr(e.message); setInviting(false); }
  }
  async function destroy() {
    try { await api(`/api/super/companies/${id}`, { method: 'DELETE', body: { confirmName: confirm } }); router.push('/super/companies'); }
    catch (e) { setErr(e.message); }
  }

  return (
    <>
      <PageHead title={company.name} subtitle="Company settings and account">
        <Link href="/super/companies" className="pf-btn line">← All companies</Link>
        <Link href={`/company?companyId=${id}`} className="pf-btn navy">Open company dashboard</Link>
      </PageHead>
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err}</ErrorNote>

      <div className="pf-stats">
        <Stat label="Status" value={company.status === 'active' ? 'Active' : 'Suspended'} />
        <Stat label="Seats" value={`${seats.used} / ${seats.seat_limit}`} note={seats.pending ? `${seats.pending} invited` : null} />
        <Stat label="Calls this week" value={stats.calls_7d} note={`${stats.calls_total} in total`} />
        <Stat label="Average score" value={stats.avg_score ? `${stats.avg_score}/10` : '—'} />
      </div>

      <div className="pf-grid2">
        <div className="pf-card">
          <h3>Details</h3>
          <div className="pf-form">
            <div><label>Company name</label><input className="input" value={f.name} onChange={set('name')} /></div>
            <div className="two">
              <div><label>Seats</label><input className="input" type="number" min="1" value={f.seat_limit} onChange={set('seat_limit')} /></div>
              <div><label>Contact name</label><input className="input" value={f.contact_name} onChange={set('contact_name')} /></div>
            </div>
            <div className="two">
              <div><label>Contact email</label><input className="input" value={f.contact_email} onChange={set('contact_email')} /></div>
              <div><label>Contact phone</label><input className="input" value={f.contact_phone} onChange={set('contact_phone')} /></div>
            </div>
            <div><label>Internal notes (only you see this)</label><textarea rows={3} value={f.notes} onChange={set('notes')} /></div>
            <div className="pf-row"><button className="pf-btn gold" onClick={save}>Save changes</button></div>
          </div>
        </div>

        <div className="pf-card">
          <h3>Company admins</h3>
          <ul className="pf-list">
            {admins.length === 0 && <li className="pf-muted">No admin has joined yet.</li>}
            {admins.map((a) => (
              <li key={a.id}><span><b>{a.full_name || a.email}</b><br /><span className="pf-muted pf-sm">{a.email} · last sign-in {a.last_login_at ? timeAgo(a.last_login_at) : 'never'}</span></span>
                <Badge tone={a.status === 'active' ? 'ok' : 'gray'}>{a.status}</Badge></li>
            ))}
          </ul>
          <div className="pf-row" style={{ marginTop: 14 }}><button className="pf-btn line" onClick={() => setInviting(true)}>Invite another admin</button></div>

          <h3 style={{ marginTop: 28 }}>Access</h3>
          {company.status === 'active'
            ? <button className="pf-btn red" onClick={() => confirmSuspend() && setStatus('suspended')}>Suspend company</button>
            : <button className="pf-btn gold" onClick={() => setStatus('active')}>Reactivate company</button>}
          <p className="pf-muted pf-sm" style={{ marginBottom: 0 }}>Suspending blocks sign-in for everyone in this company. Nothing is deleted.</p>
        </div>
      </div>

      <div className="pf-card flush pf-scroll" style={{ marginBottom: 22 }}>
        <h3>Recent activity</h3>
        {log.length === 0 ? <div className="pf-empty">Nothing recorded yet.</div> : (
          <table><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
            <tbody>{log.map((l, i) => <tr key={i}><td>{fmtDateTime(l.created_at)}</td><td>{l.actor_email || '—'}</td><td>{ACTION_LABEL[l.action] || l.action}{l.target ? `: ${l.target}` : ''}</td></tr>)}</tbody></table>
        )}
      </div>

      <div className="pf-card" style={{ borderColor: '#E8B9B5' }}>
        <h3 style={{ color: 'var(--pf-bad)' }}>Delete company</h3>
        <p className="pf-muted" style={{ marginTop: 0 }}>Removes the company, its assignments and its private personas. People keep their accounts as individuals.</p>
        <button className="pf-btn red" onClick={() => setDeleting(true)}>Delete this company</button>
      </div>

      {inviting && (
        <Modal title="Invite another admin" onClose={() => setInviting(false)} footer={<><button className="pf-btn line" onClick={() => setInviting(false)}>Cancel</button><button className="pf-btn gold" onClick={inviteAdmin} disabled={!adminEmail}>Create invitation</button></>}>
          <div className="pf-form"><div><label>Email</label><input className="input" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} /></div></div>
        </Modal>
      )}
      {link && (
        <Modal title="Send this link" onClose={() => setLink(null)} footer={<button className="pf-btn navy" onClick={() => setLink(null)}>Done</button>}>
          <p style={{ marginTop: 0 }}>It works once and expires in 14 days.</p><CopyBox value={link} />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete company" onClose={() => setDeleting(false)} footer={<><button className="pf-btn line" onClick={() => setDeleting(false)}>Cancel</button><button className="pf-btn red" onClick={destroy} disabled={confirm !== company.name}>Delete permanently</button></>}>
          <p style={{ marginTop: 0 }}>Type <b>{company.name}</b> to confirm.</p>
          <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Modal>
      )}
    </>
  );
}

const confirmSuspend = () => window.confirm('Suspend this company? Everyone in it will be signed out and blocked until you reactivate it.');

CompanyAdminPage.getLayout = (page) => <AppShell title="Company">{page}</AppShell>;
