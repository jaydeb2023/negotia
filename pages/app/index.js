import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppShell from '../../components/AppShell';
import { PageHead, Empty, ErrorNote, Loading } from '../../components/ui';
import Icon from '../../components/Icon';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/AuthContext';

const FILTERS = [
  { label: 'All levels', match: () => true },
  { label: 'Beginner', match: (d) => d <= 2 },
  { label: 'Advanced', match: (d) => d >= 3 },
];

// Practice home: the dealers, with levels that unlock one by one.
export default function PracticeHome() {
  const router = useRouter();
  const { profile, role } = useAuth();
  const scenarios = useApi('/api/scenarios');
  const sessions = useApi('/api/sessions');
  const assignments = useApi(role === 'employee' ? '/api/me/assignments' : null);
  const [filter, setFilter] = useState(0);

  const list = scenarios.data || [];
  const done = sessions.data || [];
  // Difficulty tiers in order, for example [1, 3, 4, 5]. The first tier is always open.
  const tiers = [...new Set(list.map((s) => s.difficulty))].sort((a, b) => a - b);
  const unlocked = (difficulty) => {
    const i = tiers.indexOf(difficulty);
    if (i <= 0) return true;
    const prev = tiers[i - 1];
    return done.some((s) => list.find((sc) => sc.id === s.scenario_id)?.difficulty === prev && s.outcome?.startsWith('RP'));
  };
  const pending = (assignments.data || []).filter((a) => a.status === 'pending');
  const shown = list.filter((s) => FILTERS[filter].match(s.difficulty));

  return (
    <>
      <PageHead title={`Welcome back, ${(profile?.full_name || '').split(' ')[0] || 'there'}`} subtitle="Complete a level to unlock the next dealer." />
      <ErrorNote>{scenarios.error || sessions.error}</ErrorNote>

      {pending.length > 0 && (
        <div className="pf-card" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <b>You have {pending.length} pending assignment{pending.length > 1 ? 's' : ''}.</b>
            <div className="pf-muted pf-sm">Your company asked you to complete these.</div>
          </div>
          <Link href="/app/assignments" className="pf-btn navy">View assignments</Link>
        </div>
      )}

      <div className="pf-tabs" role="tablist">
        {FILTERS.map((f, i) => (
          <button key={f.label} className={filter === i ? 'on' : ''} onClick={() => setFilter(i)} role="tab" aria-selected={filter === i}>{f.label}</button>
        ))}
      </div>

      {(scenarios.loading || sessions.loading) && <Loading />}
      {!scenarios.loading && shown.length === 0 && (
        <div className="pf-card"><Empty title="No dealers here yet">Try "All levels", or ask your admin to add personas.</Empty></div>
      )}

      <div className="pf-persona-grid">
        {shown.map((s) => {
          const open = unlocked(s.difficulty);
          return (
            <button
              key={s.id}
              className={`pf-persona ${open ? '' : 'locked'}`}
              onClick={() => open && router.push(`/practice?scenario=${s.id}`)}
              aria-disabled={!open}
            >
              <div className="top">{open ? s.avatar_emoji : <Icon name="lock" size={40} color="#8E96A8" />}</div>
              <div className="bd">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <h4>{s.name}</h4>
                  <span className={`difficulty d${s.difficulty}`}>Level {s.difficulty}</span>
                </div>
                <p>{open ? s.tagline : 'Complete the previous level to unlock'}</p>
                {open && <span className="go">Start practice →</span>}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

PracticeHome.getLayout = (page) => <AppShell title="Practice">{page}</AppShell>;
