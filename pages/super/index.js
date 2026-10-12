import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { PageHead, Stat, Badge, Empty, ErrorNote, Loading, MiniChart } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { ROLE_LABEL } from '../../lib/roles';
import { timeAgo } from '../../lib/format';

export default function SuperHome() {
  const allowed = useRequireRole(['super_admin']);
  const { data, error, loading } = useApi(allowed ? '/api/super/overview' : null);
  if (!allowed || loading) return <Loading />;
  if (!data) return <ErrorNote>{error}</ErrorNote>;
  const { stats, roles, recentCompanies, recentLeads, series } = data;

  return (
    <>
      <PageHead title="Platform overview" subtitle="All companies and people on Transcend.">
        <Link href="/super/companies" className="pf-btn gold">Add company</Link>
      </PageHead>
      <div className="pf-stats">
        <Stat label="Companies" value={stats.companies_active} note={stats.companies_suspended ? `${stats.companies_suspended} suspended` : 'all active'} />
        <Stat label="Active people" value={stats.users_active} />
        <Stat label="Calls this week" value={stats.calls_7d} note={`${stats.calls_total} in total`} />
        <Stat label="New requests" value={stats.leads_new} note="from the website" />
      </div>

      <div className="pf-grid2">
        <div className="pf-card"><h3>Calls per day, last 14 days</h3><MiniChart series={series} /></div>
        <div className="pf-card">
          <h3>People by role</h3>
          <ul className="pf-list">
            {Object.entries(roles).map(([r, n]) => <li key={r}><span>{ROLE_LABEL[r] || r}</span><b>{n}</b></li>)}
          </ul>
        </div>
      </div>

      <div className="pf-grid2">
        <div className="pf-card flush">
          <h3>Newest companies</h3>
          {recentCompanies.length === 0 ? <Empty title="No companies yet">Approve a request or add one yourself.</Empty> : (
            <ul className="pf-list" style={{ padding: '6px 22px 12px' }}>
              {recentCompanies.map((c) => (
                <li key={c.id}>
                  <span><Link className="pf-link" href={`/super/companies/${c.id}`}>{c.name}</Link><br /><span className="pf-muted pf-sm">{c.members} of {c.seat_limit} seats · {timeAgo(c.created_at)}</span></span>
                  <Badge tone={c.status === 'active' ? 'ok' : 'bad'}>{c.status === 'active' ? 'Active' : 'Suspended'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pf-card flush">
          <h3>Latest requests</h3>
          {recentLeads.length === 0 ? <Empty title="No requests yet">Requests from the website show up here.</Empty> : (
            <ul className="pf-list" style={{ padding: '6px 22px 12px' }}>
              {recentLeads.map((l) => (
                <li key={l.id}>
                  <span><b>{l.company_name || l.name}</b><br /><span className="pf-muted pf-sm">{l.kind === 'company' ? 'Company request' : 'Message'} · {l.email}</span></span>
                  <Badge tone={l.status === 'new' ? 'warn' : 'gray'}>{l.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div style={{ padding: '0 22px 18px' }}><Link href="/super/requests" className="pf-link">See all requests →</Link></div>
        </div>
      </div>
    </>
  );
}

SuperHome.getLayout = (page) => <AppShell title="Overview">{page}</AppShell>;
