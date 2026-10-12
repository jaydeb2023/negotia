import MarketingLayout from '../components/MarketingLayout';
import LeadForm from '../components/LeadForm';
import { Checks } from '../components/marketing';

export default function CompanySignup() {
  return (
    <MarketingLayout title="Sign up your company" description="Request a Transcend company account for your sales team.">
      <section className="mk-hero">
        <div className="mk-wrap" style={{ paddingTop: 64, paddingBottom: 72 }}>
          <div style={{ maxWidth: 740 }}>
            <div className="mk-eyebrow">ENTERPRISE</div>
            <h1>Sign up your company.</h1>
            <p className="sub">Tell us about your team. We set up a private company space for you, then you invite your employees and start assigning practice.</p>
          </div>
        </div>
      </section>
      <section className="mk-sec">
        <div className="mk-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          <div style={{ flex: '1.4 1 460px', minWidth: 0 }}><LeadForm kind="company" /></div>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div className="mk-card">
              <h3>What your company gets</h3>
              <Checks items={['A private company dashboard', 'Employee management with invitations', 'Practice and training assignments', 'Notifications and reports']} />
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

CompanySignup.public = true;
