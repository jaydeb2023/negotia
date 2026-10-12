import AppShell from '../../components/AppShell';
import { PageHead, Empty, ErrorNote, Loading } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { ACTION_LABEL, fmtDateTime } from '../../lib/format';

export default function Audit() {
  const allowed = useRequireRole(['super_admin']);
  const { data, error, loading } = useApi(allowed ? '/api/super/audit' : null);
  if (!allowed) return <Loading />;
  const list = data || [];
  return (
    <>
      <PageHead title="Activity log" subtitle="Who changed what, newest first." />
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="Nothing recorded yet" /></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>When</th><th>Who</th><th>Company</th><th>What</th></tr></thead>
            <tbody>{list.map((l) => (
              <tr key={l.id}><td>{fmtDateTime(l.created_at)}</td><td>{l.actor_email || '—'}</td><td>{l.company_name || '—'}</td><td>{ACTION_LABEL[l.action] || l.action}{l.target ? `: ${l.target}` : ''}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

Audit.getLayout = (page) => <AppShell title="Activity log">{page}</AppShell>;
