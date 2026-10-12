import Link from 'next/link';
import Icon from './Icon';

export function Checks({ items, color = '#12203F' }) {
  return (
    <div className="mk-checks">
      {items.map((t) => (
        <div key={t}>
          <Icon name="check" size={22} color={color} stroke={2.2} />
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

// Two buttons used on several pages: the practice app and the company sign-up.
export function TwoCtas({ dark = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
      <Link href="/login?mode=signup" className={`mk-btn ${dark ? 'navy' : 'gold'}`}>Start practicing</Link>
      <Link href="/company-signup" className={`mk-btn ${dark ? 'outline' : 'ghost'}`}>Sign up your company</Link>
    </div>
  );
}

export function CtaBand({ title = 'Ready to train your team?', text = 'Start practicing today, or set up your company account.' }) {
  return (
    <section style={{ background: '#C9A55C' }}>
      <div className="mk-wrap" style={{ maxWidth: 900, padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--pf-display)', fontSize: 'clamp(30px,3.8vw,44px)', lineHeight: 1.15, color: '#12203F' }}>{title}</h2>
        <p style={{ margin: '18px auto 0', maxWidth: 560, fontSize: 18, lineHeight: 1.6, color: '#2A2410' }}>{text}</p>
        <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
          <Link href="/login?mode=signup" className="mk-btn navy">Start practicing</Link>
          <Link href="/company-signup" className="mk-btn outline">Sign up your company</Link>
        </div>
      </div>
    </section>
  );
}
