import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { PageHead, Stat, Badge, OutcomeBadge, Empty, ErrorNote, Loading, MiniChart, Bar } from '../../components/ui';
import { useApi, useRequireRole, useCompanyScope } from '../../lib/hooks';
import { timeAgo } from '../../lib/format';

export default function CompanyDashboard() {
  const allowed = useRequireRole(['company_admin', 'super_admin']);
  const scope = useCompanyScope();
  const { data, error, loading } = useApi(allowed && scope.ready ? scope.withQs('/api/company/overview') : null);
  if (!allowed || !scope.ready) return <Loading />;
  if (loading || !data) return error ? <ErrorNote>{error}</ErrorNote> : <Loading />;

  const { stats, seats, recent, attention, series, assignments, company } = data;
  const doneTotal = assignments.pending + assignments.completed;

  return (
    <>
      <PageHead title={company.name} subtitle="How your team is practicing.">
        <a className="pf-btn line" href={scope.withQs('/api/company/export')}>Export to Excel</a>
        <Link className="pf-btn line" href={scope.withQs('/company/assignments')}>New assignment</Link>
        <Link className="pf-btn gold" href={scope.withQs('/company/employees')}>Invite employee</Link>
      </PageHead>
      {company.status === 'suspended' && <ErrorNote>This company is suspended. People cannot sign in.</ErrorNote>}

      <div className="pf-stats">
        <Stat label="People" value={`${seats.used} / ${seats.seat_limit}`} note={seats.pending ? `${seats.pending} invited, not joined yet` : 'seats used'} />
        <Stat label="Calls this week" value={stats.calls_7d} note={`${stats.active_7d} people practiced`} />
        <Stat label="Average behaviour score" value={stats.avg_score ? `${stats.avg_score}/10` : '—'} note={`${stats.calls_total} calls in total`} />
        <Stat label="Assignments to do" value={assignments.pending} note={assignments.overdue ? `${assignments.overdue} overdue` : 'none overdue'} />
      </div>

      <div className="pf-grid2">
        <div className="pf-card">
          <h3>Calls per day, last 14 days</h3>
          <MiniChart series={series} />
        </div>
        <div className="pf-card">
          <h3>Assignment completion</h3>
          <div style={{ fontFamily: 'var(--pf-display)', fontSize: 30, fontWeight: 700 }}>{doneTotal ? Math.round((assignments.completed / doneTotal) * 100) : 0}%</div>
          <div className="pf-muted pf-sm" style={{ margin: '4px 0 12px' }}>{assignments.completed} of {doneTotal} completed</div>
          <Bar value={assignments.completed} max={doneTotal} />
        </div>
      </div>

      <div className="pf-grid2">
        <div className="pf-card flush">
          <h3>Recent calls</h3>
          {recent.length === 0 ? <Empty title="No calls yet">Calls will show here once your team starts practicing.</Empty> : (
            <ul className="pf-list" style={{ padding: '6px 22px 12px' }}>
              {recent.map((s) => (
                <li key={s.id}>
                  <span><b>{s.trainee_name}</b><br /><span className="pf-muted pf-sm">{s.scenario_name} · {timeAgo(s.created_at)}</span></span>
                  <OutcomeBadge outcome={s.outcome} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pf-card flush">
          <h3>Needs a nudge</h3>
          {attention.length === 0 ? <Empty title="Everyone is active">Nobody has been quiet for a week.</Empty> : (
            <ul className="pf-list" style={{ padding: '6px 22px 12px' }}>
              {attention.map((p) => (
                <li key={p.id}>
                  <Link className="pf-link" href={scope.withQs(`/company/employees/${p.id}`)}>{p.full_name || p.email}</Link>
                  <Badge tone="warn">{p.last_active ? `Last seen ${timeAgo(p.last_active)}` : 'Never practiced'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

CompanyDashboard.getLayout = (page) => <AppShell title="Dashboard">{page}</AppShell>;
