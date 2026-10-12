import Link from 'next/link';
import MarketingLayout from '../components/MarketingLayout';
import Icon from '../components/Icon';
import { Checks, CtaBand } from '../components/marketing';

const BARS = [14, 26, 38, 22, 44, 30, 16, 36, 48, 28, 18, 40, 24, 34, 46, 20, 32, 42, 26, 16, 30, 38];
const DEALERS = [
  { initials: 'GJ', name: 'Guptaji', level: 1, dots: 1 },
  { initials: 'SJ', name: 'Sharma Ji', level: 3, dots: 3 },
  { initials: 'MJ', name: 'Mehta Ji', level: 4, dots: 4 },
  { initials: 'VJ', name: 'Verma Ji', level: 5, dots: 5 },
];
const FEATURES = [
  { icon: 'grid', title: 'Company dashboard', text: 'See practice activity, scores and progress for the whole team in one place.' },
  { icon: 'users', title: 'Employee management', text: 'Add, edit or remove employees, and invite new people with a link.' },
  { icon: 'clipboard', title: 'Practice and training assignments', text: 'Assign practice calls and training to people, with clear deadlines.' },
  { icon: 'bell', title: 'Notifications', text: 'Reminders and alerts, so nobody falls behind on their training.' },
  { icon: 'chart', title: 'Reports and progress', text: 'Results for each employee, ready to review or export to Excel.' },
  { icon: 'shield', title: 'Separate and secure', text: "Every company has its own space. Nobody can see another company's data." },
];
const ROWS = [
  ['Rahul S.', 'Level 4', '8/10', 80],
  ['Priya M.', 'Level 3', '7/10', 55],
  ['Amit K.', 'Level 1', '5/10', 30],
  ['Neha R.', 'Level 3', '7/10', 65],
];

export default function Home() {
  return (
    <MarketingLayout active="/" description="Practice sales calls by voice with AI dealer personas. For individuals and companies.">
      {/* HERO */}
      <section className="mk-hero">
        <div className="mk-wrap">
          <div style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div className="mk-eyebrow">SALES NEGOTIATION TRAINING</div>
            <h1>Practice the sales call before it counts.</h1>
            <p className="sub">Talk to realistic AI dealer personas out loud. Every call is scored, and every level you pass unlocks a tougher dealer. Train on your own, or train your whole team.</p>
            <div style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <Link href="/login?mode=signup" className="mk-btn gold">Start practicing</Link>
              <Link href="/company-signup" className="mk-btn ghost">Sign up your company</Link>
            </div>
            <div style={{ marginTop: 22, fontSize: 14.5, color: '#9FABC8' }}>Speak naturally in Hindi or English. No scripts, no typing.</div>
          </div>

          <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 460, boxSizing: 'border-box', background: '#fff', color: '#1A2036', borderRadius: 22, padding: 24, boxShadow: '0 30px 60px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#12203F', color: '#C9A55C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 15 }}>GJ</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Guptaji</div>
                    <div style={{ fontSize: 13, color: '#5A6378' }}>Level 1 · Beginner</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF1F8', borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A55C', display: 'block' }} />On call · 02:14
                </div>
              </div>
              <div aria-hidden="true" style={{ height: 64, background: '#F4F5F9', borderRadius: 12, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {BARS.map((h, i) => <div key={i} style={{ width: 5, height: h, borderRadius: 3, background: i < 15 ? '#12203F' : '#B9C2D8' }} />)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', color: '#5A6378' }}>SAMPLE CALL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#F4F5F9', borderRadius: '14px 14px 14px 4px', padding: '12px 16px', fontSize: 14.5, lineHeight: 1.5 }}>Haan boliye, kaunsa product hai?</div>
                <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#12203F', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '12px 16px', fontSize: 14.5, lineHeight: 1.5 }}>Namaste Guptaji, main Transcend se bol raha hoon. Aapke liye ek nayi scheme hai.</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ background: '#F6EBD0', color: '#5C4510', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>Behaviour score 8/10</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E7ECF7', color: '#12203F', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
                  <Icon name="lock" size={14} stroke={2} /> Next level unlocked
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--pf-line)' }}>
        <div className="mk-wrap" style={{ padding: '28px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px 48px' }}>
          {[['mic', 'Voice-first practice'], ['chart', 'Automatic scoring'], ['lock', 'Level-by-level progress'], ['users', 'Team reports']].map(([ic, t]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15 }}><Icon name={ic} size={22} color="#12203F" />{t}</div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">HOW IT WORKS</div>
            <h2 className="mk-h2">Three steps from first call to confident closer</h2>
          </div>
          <div className="mk-cols" style={{ marginTop: 56 }}>
            {[
              ['1', 'Call a dealer', 'Pick a persona and talk to them out loud, in Hindi or English. No scripts and no typing.'],
              ['2', 'Get scored', 'When the call ends you get an outcome, a behaviour score out of 10 and clear feedback on what to improve.'],
              ['3', 'Level up', 'Pass a level to unlock a tougher dealer. Your progress is saved automatically, so you always pick up where you stopped.'],
            ].map(([n, t, d]) => (
              <div key={n} className="mk-card"><div className="mk-num">{n}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT BAND */}
      <section className="mk-sec white">
        <div className="mk-wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 56 }}>
          <div style={{ flex: '1 1 440px', minWidth: 0 }}>
            <div className="mk-eyebrow">ABOUT TRANSCEND</div>
            <h2 className="mk-h2">Practice should feel like the real call, without the real risk.</h2>
            <p className="mk-lead">Sales skills are built by doing. But a real customer is an expensive place to make mistakes. Transcend gives every salesperson a safe place to rehearse difficult negotiations, and gives managers proof that the practice is working.</p>
            <Link href="/about" className="pf-link" style={{ display: 'inline-block', marginTop: 24, fontSize: 16 }}>More about Transcend →</Link>
          </div>
          <div style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['Safe to fail', 'Make the mistakes here, not with a real customer.'], ['Honest feedback', 'Every call is scored and explained.'], ['Proof for managers', 'See who practiced and how they are improving.']].map(([t, d], i) => (
              <div key={t} style={{ background: i === 2 ? '#12203F' : '#F4F5F9', color: i === 2 ? '#fff' : 'inherit', borderRadius: 18, padding: '24px 26px' }}>
                <div style={{ fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 20, color: i === 2 ? '#C9A55C' : '#12203F' }}>{t}</div>
                <div style={{ marginTop: 6, fontSize: 15.5, color: i === 2 ? '#B8C2DA' : '#5A6378' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LMS: TWO WAYS */}
      <section className="mk-sec" id="lms">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">THE LMS</div>
            <h2 className="mk-h2">One platform, two ways to start</h2>
            <p className="mk-lead">Practice on your own, or set up your whole company. Pick the one that fits you.</p>
          </div>
          <div className="mk-cols" style={{ marginTop: 56, alignItems: 'stretch' }}>
            <div className="mk-card" style={{ flexBasis: 460, padding: 40, display: 'flex', flexDirection: 'column' }}>
              <div className="mk-tag">PRACTICE APP</div>
              <h3 style={{ margin: '20px 0 0', fontSize: 28 }}>For individuals</h3>
              <p style={{ marginTop: 12 }}>Create an account and start practicing sales calls on your own, whenever you want.</p>
              <Checks items={['Voice calls with AI dealer personas', 'A score and feedback after every call', 'Harder levels unlock as you improve', 'Sign in with Google or email']} />
              <Link href="/login?mode=signup" className="mk-btn navy" style={{ marginTop: 32, alignSelf: 'flex-start' }}>Start practicing <Icon name="arrow" size={18} color="#fff" stroke={2} /></Link>
            </div>
            <div className="mk-card" style={{ flexBasis: 460, padding: 40, display: 'flex', flexDirection: 'column', background: '#12203F', color: '#fff', border: 'none' }}>
              <div className="mk-tag" style={{ background: '#24345C', color: '#E8C879' }}>ENTERPRISE</div>
              <h3 style={{ margin: '20px 0 0', fontSize: 28 }}>For companies</h3>
              <p style={{ marginTop: 12, color: '#B8C2DA' }}>Bring your whole team. Manage employees, assign training and follow everyone's progress from one dashboard.</p>
              <Checks color="#C9A55C" items={['Company dashboard with team progress', 'Add, edit and remove employees', 'Assign practice and training', 'Notifications and reminders']} />
              <Link href="/company-signup" className="mk-btn gold" style={{ marginTop: 32, alignSelf: 'flex-start' }}>Sign up your company <Icon name="arrow" size={18} color="#12203F" stroke={2} /></Link>
            </div>
          </div>
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 15.5, color: 'var(--pf-muted)' }}>
            Not sure which one fits? <Link href="/contact" className="pf-link">Talk to us</Link>
          </div>
        </div>
      </section>

      {/* DEALERS */}
      <section className="mk-sec white">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">THE PRACTICE APP</div>
            <h2 className="mk-h2">Meet the dealers</h2>
            <p className="mk-lead">Each dealer is harder to convince than the last. Pass one to unlock the next.</p>
          </div>
          <div style={{ marginTop: 56, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {DEALERS.map((d, i) => (
              <div key={d.name} style={{ flex: '1 1 240px', minWidth: 0, background: '#F4F5F9', border: '1px solid var(--pf-line)', borderRadius: 20, padding: 24, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#12203F', color: '#C9A55C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 17 }}>{d.initials}</div>
                  {i === 0 ? <span className="pf-badge" style={{ background: '#F6EBD0', color: '#5C4510' }}>Start here</span> : <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#E7ECF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={16} color="#12203F" stroke={2} /></span>}
                </div>
                <div style={{ marginTop: 20, fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 20 }}>{d.name}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: '#5A6378' }}>Level {d.level}</div>
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#5A6378' }}>Difficulty</span>
                  <span role="img" aria-label={`Difficulty ${d.dots} of 5`} style={{ display: 'flex', gap: 5 }}>
                    {[1, 2, 3, 4, 5].map((n) => <span key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n <= d.dots ? '#12203F' : '#CBD2E3', display: 'block' }} />)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY FEATURES */}
      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">FOR COMPANIES</div>
            <h2 className="mk-h2">Everything a training manager needs</h2>
            <p className="mk-lead">Add your team, assign practice and see who is improving. Each company only ever sees its own data.</p>
          </div>
          <div className="mk-cols" style={{ marginTop: 56 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="mk-card" style={{ flexBasis: 340, padding: 28 }}>
                <div className="mk-ico"><Icon name={f.icon} size={24} color="#12203F" /></div>
                <h3 style={{ fontSize: 19 }}>{f.title}</h3>
                <p style={{ fontSize: 15.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="mk-sec navy">
        <div className="mk-wrap" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 56 }}>
          <div style={{ flex: '1 1 360px', minWidth: 0 }}>
            <div className="mk-eyebrow">COMPANY DASHBOARD</div>
            <h2 className="mk-h2">Your whole team, at a glance</h2>
            <p className="mk-lead">Know who practiced this week, who needs a nudge and who is ready for the next level.</p>
            <Checks color="#C9A55C" items={['Practice activity for every employee', 'Scores, levels and progress side by side', 'Add, edit or remove people in a few clicks']} />
            <Link href="/company-signup" className="mk-btn gold" style={{ marginTop: 32 }}>Sign up your company</Link>
          </div>
          <div style={{ flex: '1.4 1 520px', minWidth: 0 }}>
            <div style={{ background: '#fff', color: '#1A2036', borderRadius: 20, boxShadow: '0 30px 60px rgba(0,0,0,.35)', overflow: 'hidden' }}>
              <div aria-hidden="true" style={{ background: '#E7ECF7', padding: '12px 18px', display: 'flex', gap: 7 }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#B9C2D8' }} />)}
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 18 }}>Team overview</div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: '#5A6378' }}>SAMPLE DATA</div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {[['Active employees', '24'], ['Calls this week', '61'], ['Average score', '7.4/10']].map(([l, v]) => (
                    <div key={l} style={{ flex: '1 1 130px', background: '#F4F5F9', borderRadius: 14, padding: 16 }}>
                      <div style={{ fontSize: 13, color: '#5A6378' }}>{l}</div>
                      <div style={{ marginTop: 4, fontFamily: 'var(--pf-display)', fontWeight: 700, fontSize: 26 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, overflowX: 'auto' }}>
                  <div style={{ minWidth: 520 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr .9fr 1.4fr', gap: 12, padding: '10px 0', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', color: '#5A6378' }}>
                      <div>EMPLOYEE</div><div>LEVEL</div><div>LAST SCORE</div><div>PROGRESS</div>
                    </div>
                    {ROWS.map(([n, l, s, p]) => (
                      <div key={n} style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr .9fr 1.4fr', gap: 12, alignItems: 'center', padding: '14px 0', borderTop: '1px solid #E3E6EE', fontSize: 15 }}>
                        <div style={{ fontWeight: 700 }}>{n}</div><div>{l}</div><div>{s}</div>
                        <div style={{ height: 8, borderRadius: 4, background: '#E3E6EE' }}><div style={{ width: `${p}%`, height: 8, borderRadius: 4, background: '#12203F' }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </MarketingLayout>
  );
}

Home.public = true;
