import { query } from '../../../../lib/db';
import { route } from '../../../../lib/api';
import { requireSuper } from '../../../../lib/auth';
import { str } from '../../../../lib/util';

const ROLES = ['super_admin', 'company_admin', 'employee', 'individual'];

// Every account on the platform. Filter with ?q= (name or email) and ?role=.
export default route({
  GET: async (req, res) => {
    await requireSuper(req, res);
    const q = str(req.query.q, 100);
    const role = ROLES.includes(req.query.role) ? req.query.role : null;
    const { rows } = await query(
      `select u.id, u.email, u.full_name, u.role, u.status, u.last_login_at, u.created_at, c.name as company_name
         from users u left join companies c on c.id = u.company_id
        where ($1::text is null or u.email ilike '%' || $1 || '%' or u.full_name ilike '%' || $1 || '%')
          and ($2::text is null or u.role = $2)
        order by u.created_at desc limit 300`,
      [q || null, role]
    );
    res.status(200).json(rows);
  },
});
