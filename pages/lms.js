import Link from 'next/link';
import MarketingLayout from '../components/MarketingLayout';
import Icon from '../components/Icon';
import { Checks, CtaBand } from '../components/marketing';

const ROWS = [
  ['Voice practice with AI dealer personas', true, true],
  ['Score and feedback after every call', true, true],
  ['Levels that unlock as you improve', true, true],
  ['Personal progress and call history', true, true],
  ['Company dashboard for managers', false, true],
  ['Add, edit and remove employees', false, true],
  ['Assign practice and training with deadlines', false, true],
  ['Notifications and announcements', false, true],
  ['Reports you can export to Excel', false, true],
  ['Private space, separate from other companies', false, true],
];
const ROLES = [
  ['Company admin', 'Manages the team: invites people, assigns practice and training, follows progress and sends announcements.'],
  ['Employee', 'Practices with the dealers, completes assigned work and sees personal progress and notifications.'],
  ['Transcend super admin', 'Creates and manages company accounts, the persona library, seat limits and platform-wide activity.'],
];

const Mark = ({ yes }) => yes
  ? <Icon name="check" size={20} color="#1C7C54" stroke={2.4} />
  : <span aria-label="Not included" style={{ color: '#9AA3B5' }}>—</span>;

export default function Lms() {
  return (
    <MarketingLayout active="/lms" title="The LMS" description="The Transcend practice app for individuals and the Enterprise LMS for companies.">
      <section className="mk-hero">
        <div className="mk-wrap" style={{ paddingTop: 64, paddingBottom: 80 }}>
          <div style={{ maxWidth: 780 }}>
            <div className="mk-eyebrow">THE TRANSCEND LMS</div>
            <h1>One learning platform. Two ways to use it.</h1>
            <p className="sub">Start on your own with the practice app, or give your whole company its own private space with the Enterprise LMS.</p>
          </div>
        </div>
      </section>

      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-cols" style={{ alignItems: 'stretch' }}>
            <div className="mk-card" style={{ flexBasis: 460, padding: 40, display: 'flex', flexDirection: 'column' }}>
              <div className="mk-tag">PRACTICE APP</div>
              <h3 style={{ margin: '20px 0 0', fontSize: 28 }}>For individuals</h3>
              <p>You sign up, pick a dealer and start talking. Your scores and progress are saved on your account, and harder dealers unlock as you pass each level.</p>
              <Checks items={['Voice calls in Hindi or English', 'Outcome, score out of 10 and feedback', 'Level-by-level progress', 'Call history you can review']} />
              <Link href="/login?mode=signup" className="mk-btn navy" style={{ marginTop: 32, alignSelf: 'flex-start' }}>Start practicing</Link>
            </div>
            <div className="mk-card" style={{ flexBasis: 460, padding: 40, display: 'flex', flexDirection: 'column', background: '#12203F', color: '#fff', border: 'none' }}>
              <div className="mk-tag" style={{ background: '#24345C', color: '#E8C879' }}>ENTERPRISE</div>
              <h3 style={{ margin: '20px 0 0', fontSize: 28 }}>For companies</h3>
              <p style={{ color: '#B8C2DA' }}>Each company gets a private space with its own admins and employees. Managers assign work and follow results. Nobody sees another company's data.</p>
              <Checks color="#C9A55C" items={['Company dashboard and reports', 'Employee management with invitations', 'Practice and training assignments', 'Notifications and announcements']} />
              <Link href="/company-signup" className="mk-btn gold" style={{ marginTop: 32, alignSelf: 'flex-start' }}>Sign up your company</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-sec white">
        <div className="mk-wrap" style={{ maxWidth: 900 }}>
          <div className="mk-center"><div className="mk-eyebrow">COMPARE</div><h2 className="mk-h2">What is included</h2></div>
          <div style={{ marginTop: 48, overflowX: 'auto', border: '1px solid var(--pf-line)', borderRadius: 18 }}>
            <table style={{ minWidth: 560, fontSize: 15.5 }}>
              <thead>
                <tr><th style={{ padding: '16px 20px' }}>Feature</th><th style={{ textAlign: 'center' }}>Practice app</th><th style={{ textAlign: 'center' }}>Enterprise</th></tr>
              </thead>
              <tbody>
                {ROWS.map(([f, a, b]) => (
                  <tr key={f}>
                    <td style={{ padding: '14px 20px' }}>{f}</td>
                    <td style={{ textAlign: 'center' }}><Mark yes={a} /></td>
                    <td style={{ textAlign: 'center' }}><Mark yes={b} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-center"><div className="mk-eyebrow">WHO USES IT</div><h2 className="mk-h2">Clear roles for every company</h2></div>
          <div className="mk-cols" style={{ marginTop: 56 }}>
            {ROLES.map(([t, d]) => (
              <div key={t} className="mk-card"><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}

Lms.public = true;
