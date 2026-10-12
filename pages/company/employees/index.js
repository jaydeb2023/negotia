import { useState } from 'react';
import Link from 'next/link';
import AppShell from '../../../components/AppShell';
import { PageHead, Badge, Modal, CopyBox, Empty, ErrorNote, OkNote, Loading } from '../../../components/ui';
import { useApi, useRequireRole, useCompanyScope } from '../../../lib/hooks';
import { api } from '../../../lib/http';
import { useAuth } from '../../../lib/AuthContext';
import { fmtDate, timeAgo } from '../../../lib/format';

export default function Employees() {
  const allowed = useRequireRole(['company_admin', 'super_admin']);
  const scope = useCompanyScope();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(allowed && scope.ready ? scope.withQs('/api/company/employees') : null);
  const [invite, setInvite] = useState(false);
  const [edit, setEdit] = useState(null);
  const [link, setLink] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!allowed || !scope.ready) return <Loading />;
  const people = data?.people || [];
  const invites = data?.invites || [];
  const seats = data?.seats;

  async function run(fn, ok) {
    setErr(''); setMsg('');
    try { await fn(); if (ok) setMsg(ok); reload(); } catch (e) { setErr(e.message); }
  }
  const remove = (p) => confirm(`Delete ${p.full_name || p.email} permanently? Their practice calls stay in your reports.`) &&
    run(() => api(scope.withQs(`/api/company/employees/${p.id}`), { method: 'DELETE' }), 'Person deleted.');
  const toggle = (p) => run(() => api(scope.withQs(`/api/company/employees/${p.id}`), { method: 'PATCH', body: { status: p.status === 'active' ? 'disabled' : 'active' } }), p.status === 'active' ? 'Person deactivated.' : 'Person reactivated.');
  const renew = (i) => run(async () => { const r = await api(scope.withQs(`/api/company/invites/${i.id}`), { method: 'POST' }); setLink({ email: i.email, link: r.link }); });
  const cancel = (i) => run(() => api(scope.withQs(`/api/company/invites/${i.id}`), { method: 'DELETE' }), 'Invitation cancelled.');

  return (
    <>
      <PageHead title="Employees" subtitle={seats ? `${seats.used} of ${seats.seat_limit} seats used${seats.pending ? `, ${seats.pending} invited` : ''}` : ''}>
        <button className="pf-btn gold" onClick={() => setInvite(true)}>Invite employee</button>
      </PageHead>
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err || error}</ErrorNote>
      {loading && <Loading />}

      {!loading && people.length === 0 && <div className="pf-card"><Empty title="No people yet">Invite your first employee. You get a link to send them.</Empty></div>}
      {people.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Calls</th><th>Avg score</th><th>Last practice</th><th>To do</th><th /></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td><Link className="pf-link" href={scope.withQs(`/company/employees/${p.id}`)}>{p.full_name || p.email}</Link><div className="pf-muted pf-sm">{p.email}</div></td>
                  <td>{p.role === 'company_admin' ? <Badge tone="navy">Admin</Badge> : 'Employee'}</td>
                  <td><Badge tone={p.status === 'active' ? 'ok' : 'gray'}>{p.status === 'active' ? 'Active' : 'Deactivated'}</Badge></td>
                  <td>{p.calls}</td>
                  <td>{p.avg_score ? `${p.avg_score}/10` : '—'}</td>
                  <td>{p.last_active ? timeAgo(p.last_active) : 'Never'}</td>
                  <td>{p.pending_assignments || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="pf-btn line sm" onClick={() => setEdit(p)}>Edit</button>{' '}
                    {p.id !== user?.id && <>
                      <button className="pf-btn line sm" onClick={() => toggle(p)}>{p.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>{' '}
                      <button className="pf-btn red sm" onClick={() => remove(p)}>Delete</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invites.length > 0 && (
        <div className="pf-card flush pf-scroll" style={{ marginTop: 22 }}>
          <h3>Invited, not joined yet</h3>
          <table>
            <thead><tr><th>Email</th><th>Role</th><th>Expires</th><th /></tr></thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id}>
                  <td>{i.email}{i.full_name && <div className="pf-muted pf-sm">{i.full_name}</div>}</td>
                  <td>{i.role === 'company_admin' ? 'Admin' : 'Employee'}</td>
                  <td>{fmtDate(i.expires_at)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="pf-btn line sm" onClick={() => renew(i)}>Get new link</button>{' '}
                    <button className="pf-btn red sm" onClick={() => cancel(i)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invite && <InviteModal scope={scope} onClose={() => setInvite(false)} onDone={(r) => { setInvite(false); setLink({ email: r.invite.email, link: r.link }); reload(); }} />}
      {link && (
        <Modal title="Send this link" onClose={() => setLink(null)} footer={<button className="pf-btn navy" onClick={() => setLink(null)}>Done</button>}>
          <p style={{ marginTop: 0 }}>Send this link to <b>{link.email}</b> by WhatsApp or email. It works once and expires in 14 days.</p>
          <CopyBox value={link.link} />
          <p className="pf-muted pf-sm" style={{ marginBottom: 0 }}>For safety the link is only shown now. You can make a new one any time.</p>
        </Modal>
      )}
      {edit && <EditModal scope={scope} person={edit} isSelf={edit.id === user?.id} onClose={() => setEdit(null)} onDone={() => { setEdit(null); setMsg('Saved.'); reload(); }} />}
    </>
  );
}

function InviteModal({ scope, onClose, onDone }) {
  const [f, setF] = useState({ email: '', fullName: '', role: 'employee' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr('');
    try { onDone(await api(scope.withQs('/api/company/employees'), { method: 'POST', body: f })); }
    catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title="Invite employee" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={go} disabled={busy || !f.email}>{busy ? 'Please wait…' : 'Create invitation'}</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        <div><label>Email</label><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label>Name (optional)</label><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
        <div><label>Role</label>
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="employee">Employee: practices and does assignments</option>
            <option value="company_admin">Admin: manages the team</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function EditModal({ scope, person, isSelf, onClose, onDone }) {
  const [f, setF] = useState({ fullName: person.full_name || '', role: person.role });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr('');
    try {
      const body = { fullName: f.fullName };
      if (!isSelf) body.role = f.role;
      await api(scope.withQs(`/api/company/employees/${person.id}`), { method: 'PATCH', body });
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title="Edit person" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={go} disabled={busy}>Save</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        <div className="pf-muted">{person.email}</div>
        <div><label>Name</label><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
        {!isSelf && (
          <div><label>Role</label>
            <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="company_admin">Admin</option>
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}

Employees.getLayout = (page) => <AppShell title="Employees">{page}</AppShell>;
