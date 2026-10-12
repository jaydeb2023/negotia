import MarketingLayout from '../components/MarketingLayout';
import Icon from '../components/Icon';
import { CtaBand } from '../components/marketing';

const VALUES = [
  { icon: 'shield', title: 'Safe to fail', text: 'Salespeople learn fastest from mistakes. We give them a place to make those mistakes without losing a customer.' },
  { icon: 'chart', title: 'Honest feedback', text: 'Every call ends with an outcome, a behaviour score and plain feedback, so people know exactly what to work on.' },
  { icon: 'users', title: 'Proof for managers', text: 'Managers see who practiced, how often and how they are improving, instead of guessing.' },
];
const STEPS = [
  ['1', 'Tell us about your team', 'Send a request with your company name and team size.'],
  ['2', 'We set up your company', 'We create your private company space and your first admin account.'],
  ['3', 'Your team starts practicing', 'You invite employees, assign practice and follow the results.'],
];

export default function About() {
  return (
    <MarketingLayout active="/about" title="About" description="Why Transcend exists and how we work with companies.">
      <section className="mk-hero">
        <div className="mk-wrap" style={{ paddingTop: 64, paddingBottom: 80 }}>
          <div style={{ maxWidth: 780 }}>
            <div className="mk-eyebrow">ABOUT TRANSCEND</div>
            <h1>Better sales conversations, practiced before they happen.</h1>
            <p className="sub">Transcend Consultant builds practical training for sales teams. Our voice-based practice platform lets people rehearse real negotiations with AI dealer personas and get scored on every call.</p>
          </div>
        </div>
      </section>

      <section className="mk-sec white">
        <div className="mk-wrap" style={{ maxWidth: 820 }}>
          <div className="mk-eyebrow">WHY WE BUILT IT</div>
          <h2 className="mk-h2">Sales skills are built by doing</h2>
          <p className="mk-lead">Classroom training explains what good negotiation looks like. But the first time most salespeople try it is in front of a real customer, and that is an expensive place to make mistakes.</p>
          <p className="mk-lead">Transcend closes that gap. A trainee speaks to a dealer who behaves like a real one: sceptical, busy and full of objections. The call is scored, the feedback is explained, and the next, harder dealer unlocks when the trainee is ready.</p>
        </div>
      </section>

      <section className="mk-sec">
        <div className="mk-wrap">
          <div className="mk-center"><div className="mk-eyebrow">WHAT WE BELIEVE</div><h2 className="mk-h2">Three ideas behind the product</h2></div>
          <div className="mk-cols" style={{ marginTop: 56 }}>
            {VALUES.map((v) => (
              <div key={v.title} className="mk-card">
                <div className="mk-ico"><Icon name={v.icon} size={24} color="#12203F" /></div>
                <h3>{v.title}</h3><p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-sec white">
        <div className="mk-wrap">
          <div className="mk-center"><div className="mk-eyebrow">WORKING WITH US</div><h2 className="mk-h2">How a company gets started</h2></div>
          <div className="mk-cols" style={{ marginTop: 56 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="mk-card"><div className="mk-num">{n}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}

About.public = true;
