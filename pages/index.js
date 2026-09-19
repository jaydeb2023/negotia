import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const FILTERS = [
  { label: 'All levels', match: () => true },
  { label: 'Beginner', match: (d) => d <= 2 },
  { label: 'Advanced', match: (d) => d >= 3 },
];

export default function Home() {
  const { user, profile } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: scenarioData } = await supabase
        .from('scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty', { ascending: true });
      setScenarios(scenarioData || []);

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id);
      setSessions(sessionData || []);

      setLoading(false);
    }
    load();
  }, [user]);

  // Distinct difficulty tiers in ascending order, e.g. [1, 3, 4, 5]
  const tiers = [...new Set(scenarios.map((s) => s.difficulty))].sort((a, b) => a - b);

  function isUnlocked(difficulty) {
    const tierIndex = tiers.indexOf(difficulty);
    if (tierIndex <= 0) return true; // first tier is always open
    const prevTier = tiers[tierIndex - 1];
    return sessions.some((s) => {
      const scenario = scenarios.find((sc) => sc.id === s.scenario_id);
      return scenario?.difficulty === prevTier && s.outcome?.startsWith('RP');
    });
  }

  const filtered = scenarios.filter((s) => FILTERS[activeFilter].match(s.difficulty));

  if (!user) return null; // Guard in _app.js handles redirect to /login

  return (
    <>
      <div className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">SALES NEGOTIATION TRAINING</span>
          <h1>Practice negotiating before it counts</h1>
          <p>Welcome back, {profile?.full_name || user.email}. Complete a level to unlock the next.</p>
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
          {filtered.map((s) => {
            const unlocked = isUnlocked(s.difficulty);
            return (
              <div
                key={s.id}
                className={`card scenario-card-v2 ${!unlocked ? 'locked' : ''}`}
                onClick={() => (unlocked ? router.push(`/practice?scenario=${s.id}`) : null)}
              >
                <div className={`scenario-banner d${s.difficulty}`}>
                  <span className="avatar-emoji-lg">{unlocked ? s.avatar_emoji : '🔒'}</span>
                </div>
                <div className="scenario-body">
                  <div className="scenario-top">
                    <h3>{s.name}</h3>
                    <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>
                  </div>
                  <p className="tagline">
                    {unlocked ? s.tagline : 'Complete the previous level to unlock'}
                  </p>
                  {unlocked && <span className="scenario-cta">Start practice →</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}