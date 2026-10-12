import { useState } from 'react';
import { outcomeInfo } from '../lib/format';

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="pf-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="pf-row">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, note }) {
  return (
    <div className="pf-stat">
      <span>{label}</span>
      <b>{value ?? '—'}</b>
      {note && <small>{note}</small>}
    </div>
  );
}

export const Badge = ({ tone = 'gray', children }) => <span className={`pf-badge ${tone}`}>{children}</span>;

export const OutcomeBadge = ({ outcome }) => {
  const o = outcomeInfo(outcome);
  return <Badge tone={o.tone}>{o.label}</Badge>;
};

export function Empty({ title, children }) {
  return (
    <div className="pf-empty">
      <b>{title}</b>
      {children}
    </div>
  );
}

export const ErrorNote = ({ children }) => (children ? <div className="pf-err" role="alert">{children}</div> : null);
export const OkNote = ({ children }) => (children ? <div className="pf-ok" role="status">{children}</div> : null);

export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="pf-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`pf-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function CopyBox({ value }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* the field is selectable, so people can copy by hand */
    }
  }
  return (
    <div className="pf-copy">
      <input className="input" readOnly value={value} onFocus={(e) => e.target.select()} />
      <button className="pf-btn navy" onClick={copy}>{done ? 'Copied' : 'Copy'}</button>
    </div>
  );
}

export function Loading() {
  return <div className="pf-empty">Loading…</div>;
}

export function Bar({ value, max = 100 }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="pf-bar" role="img" aria-label={`${pct}%`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

// Last 14 days as simple bars.
export function MiniChart({ series }) {
  const max = Math.max(1, ...(series || []).map((s) => s.n));
  return (
    <div className="pf-chart" role="img" aria-label="Calls per day, last 14 days">
      {(series || []).map((s) => (
        <div key={s.day} title={`${s.day}: ${s.n}`}>
          <i style={{ height: `${Math.round((s.n / max) * 100)}%` }} />
          <span>{s.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

export function Transcript({ rows, dealer }) {
  return (
    <div className="pf-transcript">
      {(rows || []).map((t, i) => {
        const me = t.who === 'You';
        return (
          <div key={i} className={`b ${me ? 'me' : 'them'}`}>
            <small>{me ? 'Trainee' : dealer || t.who}</small>
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
