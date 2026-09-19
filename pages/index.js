import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty', { ascending: true });
      if (!error) setScenarios(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Choose who to practice with</h1>
        <p>Each persona negotiates differently — start with an easier one and work up.</p>
      </div>

      {loading && <p>Loading scenarios…</p>}
      {!loading && scenarios.length === 0 && (
        <p>No scenarios yet — add one from the <a href="/admin">Admin</a> panel.</p>
      )}

      <div className="grid">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className="card scenario-card"
            onClick={() => router.push(`/practice?scenario=${s.id}`)}
          >
            <div className="scenario-top">
              <span className="avatar-emoji">{s.avatar_emoji}</span>
              <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>
            </div>
            <h3>{s.name}</h3>
            <p className="tagline">{s.tagline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}