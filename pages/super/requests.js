import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { PageHead, Badge, Modal, CopyBox, Empty, ErrorNote, OkNote, Loading } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { api } from '../../lib/http';
import { fmtDateTime } from '../../lib/format';

const TONE = { new: 'warn', contacted: 'navy', converted: 'ok', closed: 'gray' };

export default function Requests() {
  const allowed = useRequireRole(['super_admin']);
  const { data, error, loading, reload } = useApi(allowed ? '/api/super/leads' : null);
  const [conv, setConv] = useState(null);
  const [link, setLink] = useState(null);
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!allowed) return <Loading />;
  const list = data || [];

  async function setStatus(l, status) {
    setErr('');
    try { await api(`/api/super/leads/${l.id}`, { method: 'PATCH', body: { status } }); reload(); } catch (e) { setErr(e.message); }
  }
  async function remove(l) {
    if (!window.confirm('Delete this request?')) return;
    try { await api(`/api/super/leads/${l.id}`, { method: 'DELETE' }); setMsg('Deleted.'); reload(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <PageHead title="Requests" subtitle="Company sign-ups and messages from the website." />
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err || error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No requests yet">When someone fills in the website forms, it shows up here.</Empty></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Date</th><th>Who</th><th>Type</th><th>Status</th><th /></tr></thead>
            <tbody>{list.map((l) => (
              <tr key={l.id}>
                <td>{fmtDateTime(l.created_at)}</td>
                <td><b>{l.company_name || l.name}</b><div className="pf-muted pf-sm">{l.name} · {l.email}{l.phone ? ` · ${l.phone}` : ''}</div></td>
                <td>{l.kind === 'company' ? <Badge tone="navy">Company{l.team_size ? ` (${l.team_size})` : ''}</Badge> : 'Message'}</td>
                <td><Badge tone={TONE[l.status]}>{l.status}</Badge></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="pf-btn line sm" onClick={() => setView(l)}>Read</button>{' '}
                  {l.kind === 'company' && l.status !== 'converted' && <button className="pf-btn gold sm" onClick={() => setConv(l)}>Approve</button>}{' '}
                  {l.status === 'new' && <button className="pf-btn line sm" onClick={() => setStatus(l, 'contacted')}>Mark contacted</button>}{' '}
                  {l.status !== 'converted' && l.status !== 'closed' && <button className="pf-btn line sm" onClick={() => setStatus(l, 'closed')}>Close</button>}{' '}
                  <button className="pf-btn red sm" onClick={() => remove(l)}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {view && (
        <Modal title={view.company_name || view.name} onClose={() => setView(null)}>
          <p style={{ marginTop: 0 }}><b>{view.name}</b> · {view.email}{view.phone ? ` · ${view.phone}` : ''}</p>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{view.message || 'No message.'}</p>
        </Modal>
      )}
      {conv && <Convert lead={conv} onClose={() => setConv(null)} onDone={(r) => { setConv(null); setLink(r); reload(); }} />}
      {link && (
        <Modal title={`${link.company.name} created`} onClose={() => setLink(null)} footer={<button className="pf-btn navy" onClick={() => setLink(null)}>Done</button>}>
          <p style={{ marginTop: 0 }}>Send this link to the person who asked. It makes them the company's first admin. It works once and expires in 14 days.</p>
          <CopyBox value={link.link} />
        </Modal>
      )}
    </>
  );
}

function Convert({ lead, onClose, onDone }) {
  const [f, setF] = useState({ name: lead.company_name || '', seat_limit: 10 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr('');
    try { onDone(await api(`/api/super/leads/${lead.id}/convert`, { method: 'POST', body: { ...f, seat_limit: Number(f.seat_limit) } })); }
    catch (e) { setErr(e.message); setBusy(false); }
  }
  return (
    <Modal title="Approve company request" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={go} disabled={busy || !f.name.trim()}>{busy ? 'Please wait…' : 'Create company'}</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        <p className="pf-muted" style={{ margin: 0 }}>{lead.name} ({lead.email}) becomes the first admin.</p>
        <div><label>Company name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label>Seats</label><input className="input" type="number" min="1" value={f.seat_limit} onChange={(e) => setF({ ...f, seat_limit: e.target.value })} /></div>
      </div>
    </Modal>
  );
}

Requests.getLayout = (page) => <AppShell title="Requests">{page}</AppShell>;
