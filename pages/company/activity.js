import { useState } from 'react';
import AppShell from '../../components/AppShell';
import { PageHead, OutcomeBadge, Modal, Transcript, Empty, ErrorNote, Loading } from '../../components/ui';
import { useApi, useRequireRole, useCompanyScope } from '../../lib/hooks';
import { api } from '../../lib/http';
import { fmtDateTime } from '../../lib/format';

export default function Activity() {
  const allowed = useRequireRole(['company_admin', 'super_admin']);
  const scope = useCompanyScope();
  const [who, setWho] = useState('');
  const people = useApi(allowed && scope.ready ? scope.withQs('/api/company/employees') : null);
  const { data, error, loading } = useApi(allowed && scope.ready ? scope.withQs(`/api/company/activity${who ? `?userId=${who}` : ''}`) : null);
  const [call, setCall] = useState(null);

  if (!allowed || !scope.ready) return <Loading />;
  const list = data || [];

  async function openCall(s) {
    try { setCall(await api(scope.withQs(`/api/company/sessions/${s.id}`))); } catch { /* ignore */ }
  }

  return (
    <>
      <PageHead title="Practice activity" subtitle="Every practice call made by your team.">
        <select className="input" style={{ width: 'auto' }} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by person">
          <option value="">Everyone</option>
          {(people.data?.people || []).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
        </select>
        <a className="pf-btn line" href={scope.withQs('/api/company/export')}>Export to Excel</a>
      </PageHead>
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No calls yet">Calls will appear here once your team practices.</Empty></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Date</th><th>Employee</th><th>Dealer</th><th>Outcome</th><th>Score</th><th /></tr></thead>
            <tbody>{list.map((s) => (
              <tr key={s.id}><td>{fmtDateTime(s.created_at)}</td><td>{s.trainee_name}</td><td>{s.scenario_name}</td><td><OutcomeBadge outcome={s.outcome} /></td><td>{s.behaviour_score}/10</td>
                <td style={{ textAlign: 'right' }}><button className="pf-btn line sm" onClick={() => openCall(s)}>View call</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {call && (
        <Modal title={`${call.trainee_name} with ${call.scenario_name}`} onClose={() => setCall(null)} wide>
          <div className="pf-row" style={{ marginBottom: 14 }}><OutcomeBadge outcome={call.outcome} /><span className="pf-muted pf-sm">{fmtDateTime(call.created_at)} · Behaviour {call.behaviour_score}/10</span></div>
          {call.feedback && <div className="pf-card" style={{ background: '#FBF7EC', marginBottom: 16 }}><b>Feedback</b><p style={{ margin: '6px 0 0', lineHeight: 1.6 }}>{call.feedback}</p></div>}
          <Transcript rows={call.transcript} dealer={call.scenario_name} />
        </Modal>
      )}
    </>
  );
}

Activity.getLayout = (page) => <AppShell title="Practice activity">{page}</AppShell>;
