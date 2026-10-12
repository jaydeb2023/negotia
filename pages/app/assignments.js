import { useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { PageHead, Badge, Empty, ErrorNote, Loading } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { api } from '../../lib/http';
import { fmtDate } from '../../lib/format';

export default function MyAssignments() {
  const ok = useRequireRole(['employee', 'company_admin']);
  const { data, error, loading, reload } = useApi(ok ? '/api/me/assignments' : null);
  const [err, setErr] = useState('');

  async function markDone(id) {
    setErr('');
    try {
      await api(`/api/me/assignments/${id}`, { method: 'POST' });
      reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  const list = data || [];
  return (
    <>
      <PageHead title="My assignments" subtitle="Practice and training your company asked you to complete." />
      <ErrorNote>{error || err}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="Nothing assigned yet">When your company assigns practice or training, it will show up here.</Empty></div>}
      <div style={{ display: 'grid', gap: 14 }}>
        {list.map((a) => (
          <div key={a.id} className="pf-card" style={{ display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 300px' }}>
              <div className="pf-row" style={{ marginBottom: 6 }}>
                <Badge tone="navy">{a.kind === 'practice' ? 'Practice' : 'Training'}</Badge>
                {a.status === 'completed' ? <Badge tone="ok">Done {fmtDate(a.completed_at)}</Badge> : a.overdue ? <Badge tone="bad">Overdue</Badge> : <Badge tone="warn">To do</Badge>}
                {a.due_date && a.status !== 'completed' && <span className="pf-muted pf-sm">Due {fmtDate(a.due_date)}</span>}
              </div>
              <b style={{ fontSize: 17 }}>{a.title}</b>
              {a.kind === 'practice' && a.scenario_name && <div className="pf-muted pf-sm" style={{ marginTop: 4 }}>With {a.avatar_emoji} {a.scenario_name}. Finish one call to complete it.</div>}
              {a.instructions && <p className="pf-muted" style={{ margin: '8px 0 0', fontSize: 14.5 }}>{a.instructions}</p>}
            </div>
            {a.status === 'pending' && (
              <div className="pf-row">
                {a.kind === 'practice' && a.scenario_id && <Link href={`/practice?scenario=${a.scenario_id}`} className="pf-btn gold">Start practice</Link>}
                {a.kind === 'training' && a.resource_url && <a href={a.resource_url} target="_blank" rel="noopener noreferrer" className="pf-btn line">Open material</a>}
                {a.kind === 'training' && <button className="pf-btn navy" onClick={() => markDone(a.id)}>Mark as done</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

MyAssignments.getLayout = (page) => <AppShell title="My assignments">{page}</AppShell>;
