import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const BLANK = { name: '', avatar_emoji: '🧑‍💼', difficulty: 1, tagline: '', opening_line: 'Hello, haan boliye.', system_prompt: '' };

export default function Admin() {
  const [scenarios, setScenarios] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('scenarios').select('*').order('difficulty');
    setScenarios(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditing('new'); setForm(BLANK); }
  function startEdit(s) { setEditing(s.id); setForm(s); }
  function cancel() { setEditing(null); setForm(BLANK); }

  async function save() {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      alert('Name and system prompt are required'); return;
    }
    if (editing === 'new') {
      await supabase.from('scenarios').insert([{ ...form, difficulty: Number(form.difficulty) }]);
    } else {
      await supabase.from('scenarios').update({ ...form, difficulty: Number(form.difficulty) }).eq('id', editing);
    }
    cancel();
    load();
  }

  async function toggleActive(s) {
    await supabase.from('scenarios').update({ is_active: !s.is_active }).eq('id', s.id);
    load();
  }

  async function remove(s) {
    if (!confirm(`Delete "${s.name}"? This can't be undone.`)) return;
    await supabase.from('scenarios').delete().eq('id', s.id);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin — Manage Personas</h1>
        <p>Add, edit, or retire practice personas without touching code.</p>
      </div>

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
            <label>Tagline (shown on selection card)</label>
            <input className="input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </div>
          <div className="field">
            <label>Opening line (spoken first)</label>
            <input className="input" value={form.opening_line} onChange={(e) => setForm({ ...form, opening_line: e.target.value })} />
          </div>
          <div className="field">
            <label>System prompt (full persona behaviour — the knowledge base)</label>
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
    </div>
  );
}