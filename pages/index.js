import { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '../components/MarketingLayout';
import Icon from '../components/Icon';
import { Checks, CtaBand } from '../components/marketing';

const BARS = Array.from({ length: 30 }, (_, i) => i);

const TOUR = [
  { title: 'Talk to the dealer', text: 'Pick a persona and have a real voice conversation in Hindi or Hinglish. No scripts, no typing.' },
  { title: 'Get scored and coached', text: 'Every call ends with an outcome, a behaviour score out of 10 and clear written feedback.' },
  { title: 'Follow your team', text: 'Managers see who practiced, how they scored and who needs a nudge, all in one dashboard.' },
];

const STEPS = [
  { icon: 'mic', title: 'Call a dealer', text: 'Pick a persona and talk to them out loud. They push back like real customers do.' },
  { icon: 'chart', title: 'Get scored', text: 'You get an outcome, a behaviour score out of 10 and feedback on what to improve.' },
  { icon: 'lock', title: 'Level up', text: 'Pass a level to unlock a tougher dealer. Your progress is saved automatically.' },
];

const PATH = [
  { initials: 'GJ', name: 'Guptaji', level: 1, note: 'Start here' },
  { initials: 'SJ', name: 'Sharma Ji', level: 3, note: 'Unlocks after Level 1' },
  { initials: 'MJ', name: 'Mehta Ji', level: 4, note: 'Unlocks after Level 3' },
  { initials: 'VJ', name: 'Verma Ji', level: 5, note: 'The toughest dealer' },
];

const FEATURES = [
  { icon: 'grid', title: 'Company dashboard', text: 'See practice activity, scores and progress for the whole team in one place.' },
  { icon: 'users', title: 'Employee management', text: 'Add, edit or remove employees, and invite new people with a link.' },
  { icon: 'clipboard', title: 'Assignments with deadlines', text: 'Give practice calls and training to people, and see who has finished.' },
  { icon: 'bell', title: 'Notifications', text: 'Reminders and announcements, so nobody falls behind on their training.' },
  { icon: 'chart', title: 'Reports you can export', text: 'Results for each employee, ready to review or open in Excel.' },
  { icon: 'shield', title: 'Private to your company', text: "Every company has its own space. Nobody can see another company's data." },
];

const FAQ = [
  ['Do I need to install anything?', 'No. Transcend runs in your browser. Chrome or Edge works best, and you need a microphone. Headphones are recommended so the dealer does not hear himself.'],
  ['Which languages can I speak?', 'Hindi and Hinglish (Hindi with English business words). The dealers speak Hindi, just like real dealers.'],
  ['How is a call scored?', 'You get an outcome (for example a trial order, or a refusal), a behaviour score out of 10, the number of cases ordered and short written feedback.'],
  ['Can my manager see my results?', 'If you joined through your company, your company admins can see your practice results and progress. If you signed up on your own, only you can see them.'],
  ['Can other companies see our data?', 'No. Each company has its own private space, and its admins only ever see their own people and results.'],
  ['How does my company get started?', 'Send a company request. We set up your private company space and your first admin, who then invites employees with a link and assigns practice.'],
];

const ROWS = [
  ['Rahul S.', 'Level 4', '8/10', 80],
  ['Priya M.', 'Level 3', '7/10', 55],
  ['Amit K.', 'Level 1', '5/10', 30],
  ['Neha R.', 'Level 3', '7/10', 65],
];

function TourMock({ tab }) {
  if (tab === 0) {
    return (
      <div className="hm-mock" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="hm-call-top">
          <div className="hm-who"><div className="hm-av">GJ</div><div><b>Guptaji</b><div style={{ fontSize: 13, color: '#5A6378' }}>Level 1 · Beginner</div></div></div>
          <span className="hm-live"><i />On call · 01:48</span>
        </div>
        <div className="hm-bub them">Haan boliye, kaunsa product hai?</div>
        <div className="hm-bub me">Namaste Guptaji, aapke liye ek nayi scheme hai.</div>
        <div className="hm-bub them">Scheme to bahut aati hain. Margin kitna milega?</div>
        <div className="hm-turn"><span>Your turn</span><small>Speak now</small></div>
      </div>
    );
  }
  if (tab === 1) {
    return (
      <div className="hm-mock">
        <div className="hm-ban">
          <div className="ico"><Icon name="trophy" size={24} /></div>
          <div><small>CALL RESULT</small><b>Trial order won</b><p>You convinced Guptaji to start with a trial order.</p></div>
        </div>
        <div className="hm-tiles">
          <div><b>8/10</b><span>Behaviour</span></div>
          <div><b>2</b><span>Cases ordered</span></div>
          <div><b>03:07</b><span>Call length</span></div>
        </div>
        <div className="hm-fb"><b>Coach feedback.</b> You listened to his margin concern before pitching. Next time, answer the stock-risk question directly.</div>
      </div>
    );
  }
  return (
    <div className="hm-mock">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h4>Team overview</h4>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.12em', color: '#5A6378' }}>SAMPLE DATA</span>
      </div>
      <div className="hm-stats">
        <div><span>Active people</span><b>24</b></div>
        <div><span>Calls this week</span><b>61</b></div>
        <div><span>Average score</span><b>7.4</b></div>
      </div>
      <div className="hm-row head"><div>EMPLOYEE</div><div>LEVEL</div><div>SCORE</div><div>PROGRESS</div></div>
      {ROWS.map(([n, l, s, p]) => (
        <div key={n} className="hm-row"><b>{n}</b><div>{l}</div><div>{s}</div><div className="hm-bar"><i style={{ width: `${p}%` }} /></div></div>
      ))}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState(0);

  return (
    <MarketingLayout active="/" description="Practice sales calls by voice with AI dealer personas. For individuals and companies.">
      {/* HERO */}
      <section className="hm-hero">
        <div className="mk-wrap">
          <div className="hm-copy">
            <span className="hm-pill"><Icon name="mic" size={15} /> AI VOICE PRACTICE FOR SALES TEAMS</span>
            <h1>Practice the sales call <span className="hm-mark">before it counts.</span></h1>
            <p className="sub">Talk to realistic AI dealer personas out loud. Every call is scored, and every level you pass unlocks a tougher dealer. Train on your own, or train your whole team.</p>
            <div className="hm-ctas">
              <Link href="/login?mode=signup" className="mk-btn gold">Start practicing <Icon name="arrow" size={18} color="#12203F" stroke={2} /></Link>
              <Link href="/company-signup" className="mk-btn ghost">Sign up your company</Link>
            </div>
            <ul className="hm-checks">
              <li><Icon name="check" size={18} stroke={2.4} /> Hindi and Hinglish</li>
              <li><Icon name="check" size={18} stroke={2.4} /> Scored on every call</li>
              <li><Icon name="check" size={18} stroke={2.4} /> Private company spaces</li>
            </ul>
          </div>

          <div className="hm-visual">
            <div className="hm-float a"><div className="ico"><Icon name="lock" size={20} /></div><div><b>Level unlocked</b><span>Sharma Ji is ready</span></div></div>
            <div className="hm-call">
              <div className="hm-call-top">
                <div className="hm-who"><div className="hm-av">GJ</div><div><b>Guptaji</b><div style={{ fontSize: 13, color: '#5A6378' }}>Level 1 · Beginner</div></div></div>
                <span className="hm-live"><i />On call · 02:14</span>
              </div>
              <div className="hm-turn"><span>Your turn</span><small>Speak now</small></div>
              <div className="hm-wave" aria-hidden="true">{BARS.map((i) => <i key={i} style={{ '--i': i }} />)}</div>
              <div className="hm-sample">SAMPLE CALL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="hm-bub them">Haan boliye, kaunsa product hai?</div>
                <div className="hm-bub me">Namaste Guptaji, main Transcend se bol raha hoon. Aapke liye ek nayi scheme hai.</div>
              </div>
            </div>
            <div className="hm-float b"><div className="ico"><Icon name="trophy" size={20} /></div><div><b>Behaviour score 8/10</b><span>Trial order won</span></div></div>
          </div>
        </div>
      </section>

      <section className="hm-strip">
        <div className="mk-wrap">
          {[['mic', 'Voice-first practice'], ['chart', 'Automatic scoring'], ['lock', 'Level-by-level progress'], ['users', 'Team reports']].map(([ic, t]) => (
            <div key={t}><Icon name={ic} size={22} />{t}</div>
          ))}
        </div>
      </section>

      {/* PRODUCT TOUR */}
      <section className="mk-sec white" id="tour">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">SEE IT IN ACTION</div>
            <h2 className="mk-h2">What a practice session feels like</h2>
            <p className="mk-lead">From the first hello to the manager's dashboard, in three steps.</p>
          </div>
          <div className="hm-tour">
            <div className="hm-tabs" role="tablist" aria-label="Product tour">
              {TOUR.map((t, i) => (
                <button key={t.title} role="tab" aria-selected={tab === i} className={`hm-tab ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)}>
                  <span className="n">{i + 1}</span>
                  <div><b>{t.title}</b><span>{t.text}</span></div>
                </button>
              ))}
            </div>
            <div className="hm-stage" role="tabpanel"><TourMock tab={tab} /></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">HOW IT WORKS</div>
            <h2 className="mk-h2">Three steps from first call to confident closer</h2>
          </div>
          <div className="hm-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="hm-step">
                <span className="no">0{i + 1}</span>
                <div className="ico"><Icon name={s.icon} size={26} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEARNING PATH */}
      <section className="mk-sec white">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">THE PRACTICE APP</div>
            <h2 className="mk-h2">A learning path, one dealer at a time</h2>
            <p className="mk-lead">Each dealer is harder to convince than the last. Pass one to unlock the next.</p>
          </div>
          <div className="hm-path">
            {PATH.map((d, i) => (
              <div key={d.name} className={`hm-node ${i ? 'locked' : ''}`}>
                <div className="av">{d.initials}{i > 0 && <span className="lock"><Icon name="lock" size={15} stroke={2} /></span>}</div>
                <h3>{d.name}</h3>
                <span className="lv">Level {d.level}</span>
                <div className="st">{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO WAYS */}
      <section className="mk-sec" id="lms">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">THE LMS</div>
            <h2 className="mk-h2">One platform, two ways to start</h2>
            <p className="mk-lead">Practice on your own, or set up your whole company. Pick the one that fits you.</p>
          </div>
          <div className="mk-cols" style={{ marginTop: 56, alignItems: 'stretch' }}>
            <div className="mk-card" style={{ flexBasis: 440, padding: 40, display: 'flex', flexDirection: 'column' }}>
              <div className="mk-tag">PRACTICE APP</div>
              <h3 style={{ margin: '20px 0 0', fontSize: 28 }}>For individuals</h3>
              <p style={{ marginTop: 12 }}>Create an account and start practicing sales calls on your own, whenever you want.</p>
              <Checks items={['Voice calls with AI dealer personas', 'A score and feedback after every call', 'Harder levels unlock as you improve', 'Sign in with Google or email']} />
              <Link href="/login?mode=signup" className="mk-btn navy" style={{ marginTop: 32, alignSelf: 'flex-start' }}>Start practicing <Icon name="arrow" size={18} color="#fff" stroke={2} /></Link>
            </div>
            <div className="mk-card" style={{ flexBasis: 440, padding: 40, display: 'flex', flexDirection: 'column', background: '#12203F', color: '#fff', border: 'none' }}>
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

      {/* COMPANY FEATURES */}
      <section className="mk-sec white">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">FOR COMPANIES</div>
            <h2 className="mk-h2">Everything a training manager needs</h2>
            <p className="mk-lead">Add your team, assign practice and see who is improving. Each company only ever sees its own data.</p>
          </div>
          <div className="hm-feat">
            {FEATURES.map((f) => (
              <div key={f.title} className="hm-ft">
                <div className="ico"><Icon name={f.icon} size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-sec" id="faq">
        <div className="mk-wrap">
          <div className="mk-center">
            <div className="mk-eyebrow">QUESTIONS</div>
            <h2 className="mk-h2">Things people ask before they start</h2>
          </div>
          <div className="hm-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 15.5, color: 'var(--pf-muted)' }}>
            Still have a question? <Link href="/contact" className="pf-link">Send us a message</Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </MarketingLayout>
  );
}

Home.public = true;
