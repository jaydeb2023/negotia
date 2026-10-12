import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useAuth } from '../lib/AuthContext';
import { ROLE_LABEL } from '../lib/roles';
import Icon from './Icon';

const NAV = {
  individual: [
    { href: '/app', label: 'Practice', icon: 'mic' },
    { href: '/app/history', label: 'My progress', icon: 'history' },
    { href: '/notifications', label: 'Notifications', icon: 'bell' },
  ],
  employee: [
    { href: '/app', label: 'Practice', icon: 'mic' },
    { href: '/app/assignments', label: 'My assignments', icon: 'clipboard' },
    { href: '/app/history', label: 'My progress', icon: 'history' },
    { href: '/notifications', label: 'Notifications', icon: 'bell' },
  ],
  company_admin: [
    { href: '/company', label: 'Dashboard', icon: 'grid' },
    { href: '/company/employees', label: 'Employees', icon: 'users' },
    { href: '/company/assignments', label: 'Assignments', icon: 'clipboard' },
    { href: '/company/activity', label: 'Practice activity', icon: 'chart' },
    { href: '/app', label: 'Practice', icon: 'mic' },
    { href: '/notifications', label: 'Notifications', icon: 'bell' },
  ],
  super_admin: [
    { href: '/super', label: 'Overview', icon: 'grid' },
    { href: '/super/companies', label: 'Companies', icon: 'building' },
    { href: '/super/requests', label: 'Requests', icon: 'inbox' },
    { href: '/super/personas', label: 'Personas', icon: 'persona' },
    { href: '/super/users', label: 'All users', icon: 'users' },
    { href: '/super/audit', label: 'Activity log', icon: 'log' },
    { href: '/app', label: 'Practice', icon: 'mic' },
    { href: '/notifications', label: 'Notifications', icon: 'bell' },
  ],
};

// Same menu a company admin sees, used when a super admin opens one company.
const COMPANY_NAV = NAV.company_admin.filter((n) => n.href.startsWith('/company'));

export default function AppShell({ title, children }) {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const viewingCompany = role === 'super_admin' && router.pathname.startsWith('/company');
  const companyId = typeof router.query.companyId === 'string' ? router.query.companyId : '';
  const items = viewingCompany ? COMPANY_NAV : NAV[role] || [];
  const suffix = viewingCompany && companyId ? `?companyId=${companyId}` : '';

  useEffect(() => setOpen(false), [router.asPath]);

  // Unread notification count, refreshed every minute.
  useEffect(() => {
    if (!user) return undefined;
    let stop = false;
    const load = () =>
      fetch('/api/notifications')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !stop && d && setUnread(d.unread))
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [user, router.pathname]);

  const isOn = (href) => (href === '/app' || href === '/company' || href === '/super' ? router.pathname === href : router.pathname.startsWith(href));

  return (
    <div className="pf-app">
      <Head><title>{title ? `${title} | Transcend` : 'Transcend'}</title></Head>
      {open && <div className="pf-scrim" onClick={() => setOpen(false)} />}
      <aside className={`pf-side ${open ? 'open' : ''}`}>
        <Link href="/" className="pf-logo"><img src="/logo.png" alt="Transcend" /></Link>
        <div className="pf-side-label">{viewingCompany ? 'COMPANY VIEW' : 'MENU'}</div>
        <nav className="pf-nav" aria-label="Main">
          {items.map((n) => (
            <Link key={n.href} href={n.href + (n.href.startsWith('/company') ? suffix : '')} className={isOn(n.href) ? 'on' : ''}>
              <Icon name={n.icon} size={19} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="pf-side-foot">
          <b>{profile?.full_name || user?.email}</b>
          {ROLE_LABEL[role]}
          {profile?.company_name ? ` · ${profile.company_name}` : ''}
          <br />
          <button onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</button>
        </div>
      </aside>

      <div className="pf-main">
        {viewingCompany && (
          <div className="pf-banner">
            You are viewing a company as super admin.
            <Link href="/super/companies">Back to all companies</Link>
          </div>
        )}
        <header className="pf-top">
          <div className="pf-row">
            <button className="pf-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
            <h1>{title}</h1>
          </div>
          <div className="pf-top-right">
            <Link href="/notifications" className="pf-bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              <Icon name="bell" size={20} />
              {unread > 0 && <i>{unread > 99 ? '99+' : unread}</i>}
            </Link>
          </div>
        </header>
        <main className="pf-content">{children}</main>
      </div>
    </div>
  );
}
