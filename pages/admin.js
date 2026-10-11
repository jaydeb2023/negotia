import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../lib/http';
import { useAuth } from '../lib/AuthContext';

const BLANK = { name: '', avatar_emoji: '🧑‍💼', difficulty: 1, tagline: '', opening_line: 'Hello, haan boliye.', system_prompt: '' };

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('personas'); // 'personas' | 'trainees'

  const [scenarios, setScenarios] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/');
  }, [authLoading, isAdmin]);

  async function loadPersonas() {
    try { setScenarios((await api('/api/scenarios?all=1')) || []); } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function loadSessions() {
    try { setSessions((await api('/api/sessions?all=1')) || []); } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    if (tab === 'personas') loadPersonas();
    else loadSessions();
  }, [tab, isAdmin]);

  // ---- Persona CRUD ----
  function startNew() { setEditing('new'); setForm(BLANK); }
  function startEdit(s) { setEditing(s.id); setForm(s); }
  function cancel() { setEditing(null); setForm(BLANK); }

  async function save() {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      alert('Name and system prompt are required'); return;
    }
    try {
      if (editing === 'new') {
        await api('/api/scenarios', { method: 'POST', body: { ...form, difficulty: Number(form.difficulty) } });
      } else {
        await api(`/api/scenarios/${editing}`, { method: 'PUT', body: { ...form, difficulty: Number(form.difficulty) } });
      }
    } catch (err) {
      alert(err.message); return;
    }
    cancel();
    loadPersonas();
  }

  async function toggleActive(s) {
    try { await api(`/api/scenarios/${s.id}`, { method: 'PUT', body: { is_active: !s.is_active } }); } catch (err) { alert(err.message); }
    loadPersonas();
  }

  async function remove(s) {
    if (!confirm(`Delete "${s.name}"? This can't be undone.`)) return;
    try { await api(`/api/scenarios/${s.id}`, { method: 'DELETE' }); } catch (err) { alert(err.message); }
    loadPersonas();
  }

  // ---- Trainees & Scores (grouped from sessions) ----
  const trainees = sessions.reduce((acc, s) => {
    const key = s.trainee_name || 'Unknown';
    if (!acc[key]) acc[key] = { name: key, rows: [], successCount: 0, lastActive: s.created_at };
    acc[key].rows.push(s);
    if (s.outcome?.startsWith('RP')) acc[key].successCount += 1;
    if (new Date(s.created_at) > new Date(acc[key].lastActive)) acc[key].lastActive = s.created_at;
    return acc;
  }, {});
  const trainerList = Object.values(trainees).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

  if (authLoading) return <div className="page">Checking access…</div>;
  if (!isAdmin) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin</h1>
        <p>Manage personas and review trainee performance.</p>
      </div>

      <div className="filter-row" style={{ marginTop: 0 }}>
        <button className={`chip ${tab === 'personas' ? 'chip-active' : ''}`} onClick={() => setTab('personas')}>Personas</button>
        <button className={`chip ${tab === 'trainees' ? 'chip-active' : ''}`} onClick={() => setTab('trainees')}>Trainees &amp; Scores</button>
      </div>

      {tab === 'personas' && (
        <>
          {!editing && <button className="btn-primary" onClick={startNew} style={{ marginBottom: 20 }}>+ New Persona</button>}

          {editing && (
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h3 style={{ marginTop: 0 }}>{editing === 'new' ? 'New Persona' : `Editing ${form.name}`}</h3>
              <div className="field">
                <label>Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Avatar emoji</label>
                  <input className="input" value={form.avatar_emoji} onChange={(e) => setForm({ ...form, avatar_emoji: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Difficulty (1-5)</label>
                  <input className="input" type="number" min="1" max="5" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Tagline</label>
                <input className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </div>
              <div className="field">
                <label>Opening line</label>
                <input className="input" value={form.opening_line} onChange={(e) => setForm({ ...form, opening_line: e.target.value })} />
              </div>
              <div className="field">
                <label>System prompt (knowledge base)</label>
                <textarea rows={14} value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} />
              </div>
              <div className="actions">
                <button className="btn-primary" onClick={save}>Save</button>
                <button className="btn-ghost" onClick={cancel}>Cancel</button>
              </div>
            </div>
          )}

          {loading && <p>Loading…</p>}
          <div className="admin-list">
            {scenarios.map((s) => (
              <div key={s.id} className="card admin-row">
                <div className="admin-row-info">
                  <span className="avatar-emoji">{s.avatar_emoji}</span>
                  <div>
                    <strong>{s.name}</strong>{' '}
                    <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>
                    <div style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{s.tagline}</div>
                  </div>
                </div>
                <div className="actions" style={{ margin: 0 }}>
                  <button className="btn-ghost" onClick={() => toggleActive(s)}>{s.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn-ghost" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn-danger" onClick={() => remove(s)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'trainees' && (
        <>
          {loading && <p>Loading…</p>}
          {!loading && trainerList.length === 0 && <p>No practice sessions yet.</p>}

          <div className="admin-list">
            {trainerList.map((t) => (
              <div key={t.name} className="card">
                <div
                  className="admin-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === t.name ? null : t.name)}
                >
                  <div className="admin-row-info">
                    <div>
                      <strong>{t.name}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
                        {t.rows.length} session{t.rows.length !== 1 ? 's' : ''} · {t.successCount} successful ·
                        last active {new Date(t.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                    {expanded === t.name ? 'Hide ▲' : 'View details ▼'}
                  </span>
                </div>

                {expanded === t.name && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <table>
                      <thead>
                        <tr><th>Date</th><th>Persona</th><th>Outcome</th><th>Cases</th><th>Behaviour</th></tr>
                      </thead>
                      <tbody>
                        {t.rows.map((r) => (
                          <tr key={r.id}>
                            <td>{new Date(r.created_at).toLocaleString()}</td>
                            <td>{r.scenario_name || '—'}</td>
                            <td><span className={`outcome-tag ${r.outcome}`}>{r.outcome}</span></td>
                            <td>{r.cases_ordered}</td>
                            <td>{r.behaviour_score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}