import { query } from '../../lib/db';
import { route, fail } from '../../lib/api';
import { allow, clientIp } from '../../lib/ratelimit';
import { emailOk, str } from '../../lib/util';
import { notify, superAdminIds } from '../../lib/notify';

// Public: contact form and "sign up your company" requests from the website.
export default route({
  POST: async (req, res) => {
    const b = req.body || {};
    if (b.website) return res.status(201).json({ ok: true }); // hidden field: only bots fill it
    if (!allow(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000)) fail(429, 'Too many requests. Please try again later.');

    const kind = b.kind === 'company' ? 'company' : 'contact';
    const name = str(b.name, 120);
    const email = str(b.email, 254).toLowerCase();
    if (!name) fail(400, 'Please enter your name.');
    if (!emailOk(email)) fail(400, 'Please enter a valid email address.');
    if (kind === 'company' && !str(b.company_name, 160)) fail(400, 'Please enter your company name.');

    await query(
      `insert into leads (kind, name, email, phone, company_name, team_size, message)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [kind, name, email, str(b.phone, 40) || null, str(b.company_name, 160) || null, str(b.team_size, 40) || null, str(b.message, 2000) || null]
    );

    await notify(await superAdminIds(), {
      kind: 'lead',
      title: kind === 'company' ? 'New company sign-up request' : 'New contact message',
      body: `${name} (${email})${b.company_name ? ' from ' + str(b.company_name, 160) : ''}`,
      link: '/super/requests',
    });
    res.status(201).json({ ok: true });
  },
});
