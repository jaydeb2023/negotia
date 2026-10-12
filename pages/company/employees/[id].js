import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppShell from '../../../components/AppShell';
import { PageHead, Stat, Badge, OutcomeBadge, Modal, Transcript, Empty, ErrorNote, Loading } from '../../../components/ui';
import { useApi, useRequireRole, useCompanyScope } from '../../../lib/hooks';
import { api } from '../../../lib/http';
import { fmtDate, fmtDateTime, timeAgo } from '../../../lib/format';

export default function EmployeeProfile() {
  const allowed = useRequireRole(['company_admin', 'super_admin']);
  const scope = useCompanyScope();
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const { data, error, loading } = useApi(allowed && scope.ready && id ? scope.withQs(`/api/company/employees/${id}`) : null);
  const [call, setCall] = useState(null);

  if (!allowed || !scope.ready || loading) return <Loading />;
  if (!data) return <ErrorNote>{error || 'Not found'}</ErrorNote>;
  const { person, sessions, assignments } = data;
  const scored = sessions.filter((s) => s.outcome !== 'incomplete');
  const avg = scored.length ? (scored.reduce((a, s) => a + s.behaviour_score, 0) / scored.length).toFixed(1) : null;

  async function openCall(s) {
    try { setCall(await api(scope.withQs(`/api/company/sessions/${s.id}`))); } catch { /* shown empty */ }
  }

  return (
    <>
      <PageHead title={person.full_name || person.email} subtitle={person.email}>
        <Link href={scope.withQs('/company/employees')} className="pf-btn line">← All employees</Link>
      </PageHead>
      <div className="pf-row" style={{ marginBottom: 18 }}>
        <Badge tone={person.status === 'active' ? 'ok' : 'gray'}>{person.status === 'active' ? 'Active' : 'Deactivated'}</Badge>
        <Badge tone="navy">{person.role === 'company_admin' ? 'Admin' : 'Employee'}</Badge>
        <span className="pf-muted pf-sm">Last sign-in {person.last_login_at ? timeAgo(person.last_login_at) : 'never'} · Joined {fmtDate(person.created_at)}</span>
      </div>
      <div className="pf-stats">
        <Stat label="Calls" value={sessions.length} />
        <Stat label="Successful calls" value={sessions.filter((s) => s.outcome?.startsWith('RP')).length} />
        <Stat label="Average score" value={avg ? `${avg}/10` : '—'} />
        <Stat label="Assignments done" value={`${assignments.filter((a) => a.status === 'completed').length} / ${assignments.length}`} />
      </div>

      <div className="pf-card flush pf-scroll" style={{ marginBottom: 22 }}>
        <h3>Practice calls</h3>
        {sessions.length === 0 ? <Empty title="No calls yet" /> : (
          <table>
            <thead><tr><th>Date</th><th>Dealer</th><th>Outcome</th><th>Score</th><th /></tr></thead>
            <tbody>{sessions.map((s) => (
              <tr key={s.id}><td>{fmtDateTime(s.created_at)}</td><td>{s.scenario_name}</td><td><OutcomeBadge outcome={s.outcome} /></td><td>{s.behaviour_score}/10</td>
                <td style={{ textAlign: 'right' }}><button className="pf-btn line sm" onClick={() => openCall(s)}>View call</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="pf-card flush pf-scroll">
        <h3>Assignments</h3>
        {assignments.length === 0 ? <Empty title="Nothing assigned" /> : (
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>{assignments.map((a) => (
              <tr key={a.id}><td>{a.title}</td><td>{a.kind === 'practice' ? 'Practice' : 'Training'}</td><td>{a.due_date ? fmtDate(a.due_date) : '—'}</td>
                <td>{a.status === 'completed' ? <Badge tone="ok">Done</Badge> : <Badge tone="warn">To do</Badge>}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {call && (
        <Modal title={`${call.scenario_name} · ${fmtDateTime(call.created_at)}`} onClose={() => setCall(null)} wide>
          <div className="pf-row" style={{ marginBottom: 14 }}><OutcomeBadge outcome={call.outcome} /><span className="pf-muted pf-sm">Behaviour {call.behaviour_score}/10 · Cases {call.cases_ordered}</span></div>
          {call.feedback && <div className="pf-card" style={{ background: '#FBF7EC', marginBottom: 16 }}><b>Feedback</b><p style={{ margin: '6px 0 0', lineHeight: 1.6 }}>{call.feedback}</p></div>}
          <Transcript rows={call.transcript} dealer={call.scenario_name} />
        </Modal>
      )}
    </>
  );
}

EmployeeProfile.getLayout = (page) => <AppShell title="Employee">{page}</AppShell>;
