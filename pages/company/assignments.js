import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { PageHead, Badge, Modal, Bar, Empty, ErrorNote, OkNote, Loading } from '../../components/ui';
import { useApi, useRequireRole, useCompanyScope } from '../../lib/hooks';
import { api } from '../../lib/http';
import { fmtDate } from '../../lib/format';

export default function Assignments() {
  const allowed = useRequireRole(['company_admin', 'super_admin']);
  const scope = useCompanyScope();
  const { data, error, loading, reload } = useApi(allowed && scope.ready ? scope.withQs('/api/company/assignments') : null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!allowed || !scope.ready) return <Loading />;
  const list = data || [];

  async function open(a) {
    try { setDetail(await api(scope.withQs(`/api/company/assignments/${a.id}`))); } catch (e) { setErr(e.message); }
  }
  async function remove(a) {
    if (!confirm(`Delete "${a.title}"? Progress on it will be lost.`)) return;
    try { await api(scope.withQs(`/api/company/assignments/${a.id}`), { method: 'DELETE' }); setMsg('Assignment deleted.'); setDetail(null); reload(); }
    catch (e) { setErr(e.message); }
  }

  return (
    <>
      <PageHead title="Assignments" subtitle="Give your team practice calls and training, and follow who has finished.">
        <button className="pf-btn gold" onClick={() => setCreating(true)}>New assignment</button>
      </PageHead>
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err || error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No assignments yet">Create one to give your team something to complete.</Empty></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Due</th><th>Progress</th><th /></tr></thead>
            <tbody>{list.map((a) => (
              <tr key={a.id}>
                <td><b>{a.title}</b>{a.scenario_name && <div className="pf-muted pf-sm">Dealer: {a.scenario_name}</div>}</td>
                <td><Badge tone="navy">{a.kind === 'practice' ? 'Practice' : 'Training'}</Badge></td>
                <td>{a.due_date ? fmtDate(a.due_date) : '—'}</td>
                <td style={{ minWidth: 150 }}><div className="pf-sm" style={{ marginBottom: 4 }}>{a.completed} of {a.total} done</div><Bar value={a.completed} max={a.total} /></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="pf-btn line sm" onClick={() => open(a)}>Details</button>{' '}
                  <button className="pf-btn red sm" onClick={() => remove(a)}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {creating && <Create scope={scope} onClose={() => setCreating(false)} onDone={() => { setCreating(false); setMsg('Assignment created and your team was notified.'); reload(); }} />}
      {detail && (
        <Modal title={detail.assignment.title} onClose={() => setDetail(null)}>
          <p className="pf-muted" style={{ marginTop: 0 }}>{detail.assignment.kind === 'practice' ? `Practice with ${detail.assignment.scenario_name || 'a dealer'}` : 'Training'}{detail.assignment.due_date ? ` · due ${fmtDate(detail.assignment.due_date)}` : ''}</p>
          {detail.assignment.instructions && <p>{detail.assignment.instructions}</p>}
          <ul className="pf-list">
            {detail.people.map((p) => (
              <li key={p.user_id}><span>{p.full_name || p.email}</span>{p.status === 'completed' ? <Badge tone="ok">Done {fmtDate(p.completed_at)}</Badge> : <Badge tone="warn">To do</Badge>}</li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}

function Create({ scope, onClose, onDone }) {
  const people = useApi(scope.withQs('/api/company/employees'));
  const dealers = useApi('/api/scenarios');
  const [f, setF] = useState({ kind: 'practice', title: '', instructions: '', resource_url: '', scenario_id: '', due_date: '', all: true });
  const [picked, setPicked] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const active = (people.data?.people || []).filter((p) => p.status === 'active' && p.role === 'employee');
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function go() {
    setBusy(true); setErr('');
    try {
      await api(scope.withQs('/api/company/assignments'), { method: 'POST', body: { ...f, userIds: picked, due_date: f.due_date || null } });
      onDone();
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <Modal title="New assignment" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={go} disabled={busy || !f.title.trim()}>{busy ? 'Please wait…' : 'Assign'}</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        <div><label>Type</label>
          <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="practice">Practice call with a dealer</option>
            <option value="training">Training (reading, video, meeting...)</option>
          </select>
        </div>
        <div><label>Title</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={160} placeholder={f.kind === 'practice' ? 'Practice with Guptaji' : 'Read the product guide'} /></div>
        {f.kind === 'practice' ? (
          <div><label>Dealer</label>
            <select className="input" value={f.scenario_id} onChange={(e) => setF({ ...f, scenario_id: e.target.value })}>
              <option value="">Choose a dealer…</option>
              {(dealers.data || []).map((d) => <option key={d.id} value={d.id}>{d.name} (Level {d.difficulty})</option>)}
            </select>
          </div>
        ) : (
          <div><label>Link to material (optional)</label><input className="input" value={f.resource_url} onChange={(e) => setF({ ...f, resource_url: e.target.value })} placeholder="https://" /></div>
        )}
        <div><label>Instructions (optional)</label><textarea rows={3} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} maxLength={2000} /></div>
        <div className="two">
          <div><label>Due date (optional)</label><input className="input" type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></div>
          <div><label>Give it to</label>
            <select className="input" value={f.all ? 'all' : 'some'} onChange={(e) => setF({ ...f, all: e.target.value === 'all' })}>
              <option value="all">All employees</option>
              <option value="some">Choose people</option>
            </select>
          </div>
        </div>
        {!f.all && (
          <div className="pf-checks">
            {active.length === 0 && <div className="pf-muted" style={{ padding: 8 }}>No active employees yet.</div>}
            {active.map((p) => <label key={p.id}><input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} />{p.full_name || p.email}</label>)}
          </div>
        )}
      </div>
    </Modal>
  );
}

Assignments.getLayout = (page) => <AppShell title="Assignments">{page}</AppShell>;
