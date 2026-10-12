import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { PageHead, Badge, Empty, ErrorNote, OkNote, Loading } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { api } from '../../lib/http';

const BLANK = { name: '', avatar_emoji: '🧑‍💼', difficulty: 1, tagline: '', opening_line: 'Hello, haan boliye.', system_prompt: '', company_id: '' };

export default function Personas() {
  const allowed = useRequireRole(['super_admin']);
  const { data, error, loading, reload } = useApi(allowed ? '/api/scenarios?all=1' : null);
  const companies = useApi(allowed ? '/api/super/companies' : null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!allowed) return <Loading />;
  const list = data || [];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startNew = () => { setEditing('new'); setForm(BLANK); setMsg(''); };
  const startEdit = (s) => { setEditing(s.id); setForm({ ...BLANK, ...s, company_id: s.company_id || '', tagline: s.tagline || '' }); setMsg(''); };
  const cancel = () => { setEditing(null); setForm(BLANK); };

  async function save() {
    setErr('');
    if (!form.name.trim() || !form.system_prompt.trim()) { setErr('Name and system prompt are required.'); return; }
    const body = { ...form, difficulty: Number(form.difficulty), company_id: form.company_id || null };
    try {
      if (editing === 'new') await api('/api/scenarios', { method: 'POST', body });
      else await api(`/api/scenarios/${editing}`, { method: 'PUT', body });
      setMsg('Saved.'); cancel(); reload();
    } catch (e) { setErr(e.message); }
  }
  async function toggle(s) {
    try { await api(`/api/scenarios/${s.id}`, { method: 'PUT', body: { is_active: !s.is_active } }); reload(); } catch (e) { setErr(e.message); }
  }
  async function remove(s) {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try { await api(`/api/scenarios/${s.id}`, { method: 'DELETE' }); reload(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <PageHead title="Personas" subtitle="The AI dealers. Shared personas are available to everyone; a company-only persona is visible to one company.">
        {!editing && <button className="pf-btn gold" onClick={startNew}>New persona</button>}
      </PageHead>
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err || error}</ErrorNote>

      {editing && (
        <div className="pf-card" style={{ marginBottom: 22 }}>
          <h3>{editing === 'new' ? 'New persona' : `Editing ${form.name}`}</h3>
          <div className="pf-form">
            <div className="two">
              <div><label>Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
              <div><label>Visible to</label>
                <select className="input" value={form.company_id} onChange={set('company_id')}>
                  <option value="">Everyone (shared library)</option>
                  {(companies.data || []).map((c) => <option key={c.id} value={c.id}>Only {c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="two">
              <div><label>Avatar emoji</label><input className="input" value={form.avatar_emoji} onChange={set('avatar_emoji')} /></div>
              <div><label>Difficulty (1-5)</label><input className="input" type="number" min="1" max="5" value={form.difficulty} onChange={set('difficulty')} /></div>
            </div>
            <div><label>Tagline</label><input className="input" value={form.tagline} onChange={set('tagline')} /></div>
            <div><label>Opening line</label><input className="input" value={form.opening_line} onChange={set('opening_line')} /></div>
            <div><label>System prompt (the dealer's secret rules; trainees never see this)</label><textarea rows={14} value={form.system_prompt} onChange={set('system_prompt')} /></div>
            <div className="pf-row"><button className="pf-btn gold" onClick={save}>Save</button><button className="pf-btn line" onClick={cancel}>Cancel</button></div>
          </div>
        </div>
      )}

      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No personas yet">Create the first dealer.</Empty></div>}
      <div style={{ display: 'grid', gap: 12 }}>
        {list.map((s) => (
          <div key={s.id} className="pf-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div className="pf-row" style={{ flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 32 }}>{s.avatar_emoji}</span>
              <div>
                <b>{s.name}</b> <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>{' '}
                {s.company_id ? <Badge tone="navy">Only {s.company_name}</Badge> : <Badge tone="gray">Shared</Badge>}{' '}
                {!s.is_active && <Badge tone="warn">Switched off</Badge>}
                <div className="pf-muted pf-sm">{s.tagline}</div>
              </div>
            </div>
            <div className="pf-row">
              <button className="pf-btn line sm" onClick={() => toggle(s)}>{s.is_active ? 'Switch off' : 'Switch on'}</button>
              <button className="pf-btn line sm" onClick={() => startEdit(s)}>Edit</button>
              <button className="pf-btn red sm" onClick={() => remove(s)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

Personas.getLayout = (page) => <AppShell title="Personas">{page}</AppShell>;
