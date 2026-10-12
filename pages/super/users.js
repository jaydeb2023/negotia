import { useState } from 'react';
import Link from 'next/link';
import AppShell from '../../components/AppShell';
import { PageHead, Badge, Empty, ErrorNote, OkNote, Loading } from '../../components/ui';
import { useApi, useRequireRole } from '../../lib/hooks';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/http';
import { ROLE_LABEL } from '../../lib/roles';
import { fmtDate, timeAgo } from '../../lib/format';

export default function Users() {
  const allowed = useRequireRole(['super_admin']);
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const path = `/api/super/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}) })}`;
  const { data, error, loading, reload } = useApi(allowed ? path : null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!allowed) return <Loading />;
  const list = data || [];

  async function toggle(u) {
    setErr(''); setMsg('');
    try { await api(`/api/super/users/${u.id}`, { method: 'PATCH', body: { status: u.status === 'active' ? 'disabled' : 'active' } }); reload(); } catch (e) { setErr(e.message); }
  }
  async function remove(u) {
    if (!window.confirm(`Delete ${u.email} permanently?`)) return;
    setErr(''); setMsg('');
    try { await api(`/api/super/users/${u.id}`, { method: 'DELETE' }); setMsg('Account deleted.'); reload(); } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <PageHead title="All users" subtitle="Every account on the platform.">
        <input className="input" style={{ width: 220 }} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className="input" style={{ width: 'auto' }} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </PageHead>
      <OkNote>{msg}</OkNote>
      <ErrorNote>{err || error}</ErrorNote>
      {loading && <Loading />}
      {!loading && list.length === 0 && <div className="pf-card"><Empty title="No one found" /></div>}
      {list.length > 0 && (
        <div className="pf-card flush pf-scroll">
          <table>
            <thead><tr><th>Person</th><th>Role</th><th>Company</th><th>Status</th><th>Last sign-in</th><th>Joined</th><th /></tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id}>
                <td><b>{u.full_name || '—'}</b><div className="pf-muted pf-sm">{u.email}</div></td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td>{u.company_name || '—'}</td>
                <td><Badge tone={u.status === 'active' ? 'ok' : 'gray'}>{u.status === 'active' ? 'Active' : 'Disabled'}</Badge></td>
                <td>{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</td>
                <td>{fmtDate(u.created_at)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {u.id !== user?.id && <>
                    <button className="pf-btn line sm" onClick={() => toggle(u)}>{u.status === 'active' ? 'Disable' : 'Enable'}</button>{' '}
                    <button className="pf-btn red sm" onClick={() => remove(u)}>Delete</button>
                  </>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="pf-muted pf-sm" style={{ marginTop: 14 }}>Super admins are set with the <code>ADMIN_EMAILS</code> list in the server settings. <Link href="/super/companies" className="pf-link">Manage company roles from the company page.</Link></p>
    </>
  );
}

Users.getLayout = (page) => <AppShell title="All users">{page}</AppShell>;
