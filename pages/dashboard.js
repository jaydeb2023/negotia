import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
      if (!error) setSessions(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = sessions.reduce((acc, s) => {
    acc[s.trainee_name] = acc[s.trainee_name] || [];
    acc[s.trainee_name].push(s);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Every trainee's practice history, across all personas.</p>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && Object.keys(grouped).length === 0 && <p>No sessions yet.</p>}

      {Object.entries(grouped).map(([name, rows]) => (
        <div key={name} className="card userBlock">
          <h2>{name}</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Persona</th><th>Outcome</th><th>Cases</th><th>Behaviour</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
      ))}
    </div>
  );
}