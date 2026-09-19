import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const FILTERS = [
  { label: 'All levels', match: () => true },
  { label: 'Beginner', match: (d) => d <= 2 },
  { label: 'Advanced', match: (d) => d >= 3 },
];

export default function Home() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
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

  const filtered = scenarios.filter((s) => FILTERS[activeFilter].match(s.difficulty));

  return (
    <>
      <div className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">SALES NEGOTIATION TRAINING</span>
          <h1>Practice negotiating before it counts</h1>
          <p>Pick an AI persona below and run a real, spoken negotiation — no two conversations play out the same way.</p>
        </div>
      </div>

      <div className="page">
        <div className="filter-row">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              className={`chip ${activeFilter === i ? 'chip-active' : ''}`}
              onClick={() => setActiveFilter(i)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p>Loading scenarios…</p>}
        {!loading && filtered.length === 0 && (
          <p>No scenarios in this filter yet — try "All levels", or add one from <a href="/admin">Admin</a>.</p>
        )}

        <div className="grid">
          {filtered.map((s) => (
            <div key={s.id} className="card scenario-card-v2" onClick={() => router.push(`/practice?scenario=${s.id}`)}>
              <div className={`scenario-banner d${s.difficulty}`}>
                <span className="avatar-emoji-lg">{s.avatar_emoji}</span>
              </div>
              <div className="scenario-body">
                <div className="scenario-top">
                  <h3>{s.name}</h3>
                  <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>
                </div>
                <p className="tagline">{s.tagline}</p>
                <span className="scenario-cta">Start practice →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}