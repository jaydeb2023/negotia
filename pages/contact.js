import MarketingLayout from '../components/MarketingLayout';
import LeadForm from '../components/LeadForm';
import { SITE } from '../lib/site';

export default function Contact() {
  return (
    <MarketingLayout active="/contact" title="Contact" description="Talk to the Transcend team.">
      <section className="mk-hero">
        <div className="mk-wrap" style={{ paddingTop: 64, paddingBottom: 72 }}>
          <div style={{ maxWidth: 740 }}>
            <div className="mk-eyebrow">CONTACT</div>
            <h1>Let's talk about your sales team.</h1>
            <p className="sub">Questions about the practice app, the company plan or a demo? Send a message and we will get back to you.</p>
          </div>
        </div>
      </section>
      <section className="mk-sec">
        <div className="mk-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start' }}>
          <div style={{ flex: '1.4 1 460px', minWidth: 0 }}><LeadForm kind="contact" /></div>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div className="mk-card">
              <h3>Other ways to reach us</h3>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16, lineHeight: 1.5 }}>
                {SITE.email && <div><b>Email</b><br /><a href={`mailto:${SITE.email}`} className="pf-link">{SITE.email}</a></div>}
                {SITE.phone && <div><b>Phone</b><br />{SITE.phone}</div>}
                {SITE.address && <div><b>Office</b><br />{SITE.address}</div>}
                {!SITE.email && !SITE.phone && !SITE.address && <div className="pf-muted">Use the form and we will reply by email.</div>}
              </div>
            </div>
            <div className="mk-card" style={{ marginTop: 20 }}>
              <h3>Setting up a company?</h3>
              <p>Use the company request form instead, so we can prepare your account.</p>
              <a href="/company-signup" className="pf-link" style={{ display: 'inline-block', marginTop: 12 }}>Sign up your company →</a>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

Contact.public = true;
