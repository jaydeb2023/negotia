import Link from 'next/link';
import Head from 'next/head';
import { useState } from 'react';
import Icon from './Icon';
import { SITE } from '../lib/site';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/lms', label: 'LMS' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingLayout({ active, title, description, children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="mk">
      <Head>
        <title>{title ? `${title} | Transcend` : 'Transcend | Sales Negotiation Training'}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="mk-nav">
        <div className="mk-wrap">
          <Link href="/" className="mk-logo" onClick={close}><img src="/logo.png" alt="Transcend" /></Link>
          <nav className="mk-links" aria-label="Main">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={active === l.href ? 'on' : ''}>{l.label}</Link>
            ))}
          </nav>
          <div className="mk-cta">
            <Link href="/login" className="mk-btn sm ghost">Log in</Link>
            <Link href="/login?mode=signup" className="mk-btn sm gold">Get started</Link>
          </div>
          <div className="mk-mobile-actions">
            <Link href="/login?mode=signup" className="mk-btn sm gold" onClick={close}>Get started</Link>
            <button className="mk-burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mk-drawer" aria-label={open ? 'Close menu' : 'Open menu'}>
              <Icon name={open ? 'close' : 'menu'} size={24} color="#fff" />
            </button>
          </div>
        </div>
        {open && (
          <div id="mk-drawer" className="mk-drawer">
            <nav aria-label="Mobile">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={active === l.href ? 'on' : ''} onClick={close}>{l.label}</Link>
              ))}
              <Link href="/company-signup" onClick={close}>Sign up your company</Link>
            </nav>
            <Link href="/login" className="mk-btn ghost block" onClick={close}>Log in</Link>
          </div>
        )}
      </header>

      {children}

      <footer className="mk-foot">
        <div className="mk-wrap">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
            <div style={{ flex: '1 1 280px' }}>
              <img src="/logo.png" alt="Transcend" />
              <p style={{ margin: '20px 0 0', maxWidth: 320, fontSize: 15.5, lineHeight: 1.65, color: '#9FABC8' }}>
                Voice-based sales negotiation training for individuals and companies.
              </p>
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <h4>EXPLORE</h4>
              <div style={{ marginTop: 14 }}>
                {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
                <Link href="/company-signup">Sign up your company</Link>
              </div>
            </div>
            <div style={{ flex: '1 1 240px' }}>
              <h4>CONTACT</h4>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15.5, lineHeight: 1.5 }}>
                {SITE.email && <a href={`mailto:${SITE.email}`} style={{ padding: 0 }}>{SITE.email}</a>}
                {SITE.phone && <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} style={{ padding: 0 }}>{SITE.phone}</a>}
                {SITE.address && <div>{SITE.address}</div>}
                <Link href="/contact" style={{ padding: 0, textDecoration: 'underline' }}>Send us a message</Link>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid #24345C', fontSize: 14, color: '#9FABC8' }}>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
