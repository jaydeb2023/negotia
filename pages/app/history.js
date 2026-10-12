import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { PageHead, Stat, Modal, OutcomeBadge, Empty, ErrorNote, Loading, Transcript } from '../../components/ui';
import { useApi } from '../../lib/hooks';
import { fmtDateTime } from '../../lib/format';

export default function History() {
  const { data, error, loading } = useApi('/api/sessions');
  const [open, setOpen] = useState(null);
  const list = data || [];

  const scored = list.filter((s) => s.outcome !== 'incomplete');
  const wins = list.filter((s) => s.outcome?.startsWith('RP')).length;
  const avg = scored.length ? (scored.reduce((a, s) => a + s.behaviour_score, 0) / scored.length).toFixed(1) : '—';

  return (
    <>
      <PageHead title="My progress" subtitle="Your practice calls, scores and feedback." />
      <ErrorNote>{error}</ErrorNote>
      <div className="pf-stats">
        <Stat label="Calls made" value={list.length} />
        <Stat label="Successful calls" value={wins} />
        <Stat label="Average behaviour score" value={avg === '—' ? avg : `${avg}/10`} />
      </div>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No calls yet">Make your first practice call and it will appear here.</Empty></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Date</th><th>Dealer</th><th>Outcome</th><th>Score</th><th /></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDateTime(s.created_at)}</td>
                  <td>{s.scenario_name}</td>
                  <td><OutcomeBadge outcome={s.outcome} /></td>
                  <td>{s.behaviour_score}/10</td>
                  <td style={{ textAlign: 'right' }}><button className="pf-btn line sm" onClick={() => setOpen(s)}>View call</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <Modal title={`${open.scenario_name} · ${fmtDateTime(open.created_at)}`} onClose={() => setOpen(null)} wide>
          <div className="pf-row" style={{ marginBottom: 14 }}>
            <OutcomeBadge outcome={open.outcome} />
            <span className="pf-muted pf-sm">Behaviour score {open.behaviour_score}/10 · Cases {open.cases_ordered}</span>
          </div>
          {open.feedback && <div className="pf-card" style={{ background: '#FBF7EC', marginBottom: 16 }}><b>Feedback</b><p style={{ margin: '6px 0 0', lineHeight: 1.6 }}>{open.feedback}</p></div>}
          <Transcript rows={open.transcript} dealer={open.scenario_name} />
        </Modal>
      )}
    </>
  );
}

History.getLayout = (page) => <AppShell title="My progress">{page}</AppShell>;
