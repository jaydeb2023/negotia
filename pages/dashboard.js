import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
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
    <div className="container">
      <h1>Admin Dashboard</h1>
      {loading && <p>Loading…</p>}
      {!loading && Object.keys(grouped).length === 0 && <p>No sessions yet.</p>}
      {Object.entries(grouped).map(([name, rows]) => (
        <div key={name} className="userBlock">
          <h2>{name}</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Outcome</th><th>Cases</th><th>Behaviour</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.outcome}</td>
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
