import { useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../components/AppShell';
import { PageHead, Modal, Empty, ErrorNote, OkNote, Loading } from '../components/ui';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/http';
import { timeAgo } from '../lib/format';

export default function Notifications() {
  const router = useRouter();
  const { role } = useAuth();
  const { data, error, loading, reload } = useApi('/api/notifications');
  const [composing, setComposing] = useState(false);
  const [sent, setSent] = useState('');
  const canSend = role === 'company_admin' || role === 'super_admin';
  const items = data?.items || [];

  async function openItem(n) {
    if (!n.read_at) await api('/api/notifications', { method: 'POST', body: { ids: [n.id] } }).catch(() => {});
    if (n.link) router.push(n.link);
    else reload();
  }
  async function readAll() {
    await api('/api/notifications', { method: 'POST', body: { all: true } }).catch(() => {});
    reload();
  }

  return (
    <>
      <PageHead title="Notifications" subtitle={data ? `${data.unread} unread` : ''}>
        {data?.unread > 0 && <button className="pf-btn line" onClick={readAll}>Mark all as read</button>}
        {canSend && <button className="pf-btn gold" onClick={() => setComposing(true)}>Send announcement</button>}
      </PageHead>
      <OkNote>{sent}</OkNote>
      <ErrorNote>{error}</ErrorNote>
      {loading && <Loading />}
      {!loading && items.length === 0 && <div className="pf-card"><Empty title="You are all caught up">New notifications will appear here.</Empty></div>}
      {items.length > 0 && (
        <div className="pf-card">
          {items.map((n) => (
            <div key={n.id} className={`pf-note ${n.read_at ? '' : 'unread'}`} style={{ cursor: 'pointer' }} onClick={() => openItem(n)}>
              <span className={`pf-dot ${n.read_at ? 'read' : ''}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{n.title}</b>
                {n.body && <div className="pf-muted" style={{ fontSize: 14.5, marginTop: 2 }}>{n.body}</div>}
              </div>
              <span className="pf-muted pf-sm" style={{ whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
      {composing && <Compose role={role} onClose={() => setComposing(false)} onSent={(c) => { setComposing(false); setSent(`Sent to ${c} ${c === 1 ? 'person' : 'people'}.`); reload(); }} />}
    </>
  );
}

function Compose({ role, onClose, onSent }) {
  const [f, setF] = useState({ title: '', body: '', scope: role === 'super_admin' ? 'company_admins' : 'company' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    setErr('');
    try {
      const body = { title: f.title, body: f.body };
      if (role === 'super_admin') body.scope = f.scope;
      const r = await api('/api/notifications/send', { method: 'POST', body });
      onSent(r.sent);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal title="Send announcement" onClose={onClose}
      footer={<><button className="pf-btn line" onClick={onClose}>Cancel</button><button className="pf-btn gold" onClick={send} disabled={busy || !f.title.trim()}>{busy ? 'Sending…' : 'Send'}</button></>}>
      <div className="pf-form">
        <ErrorNote>{err}</ErrorNote>
        {role === 'super_admin' ? (
          <div><label>Send to</label>
            <select className="input" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}>
              <option value="company_admins">All company admins</option>
              <option value="all">Everyone on the platform</option>
            </select>
          </div>
        ) : <p className="pf-muted" style={{ margin: 0 }}>This goes to everyone in your company.</p>}
        <div><label>Title</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={140} /></div>
        <div><label>Message (optional)</label><textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={1000} /></div>
      </div>
    </Modal>
  );
}

Notifications.getLayout = (page) => <AppShell title="Notifications">{page}</AppShell>;
