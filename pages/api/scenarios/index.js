import { query } from '../../../lib/db';
import { route, fail } from '../../../lib/api';
import { requireUser, requireSuper } from '../../../lib/auth';
import { pickScenarioFields } from '../../../lib/scenarioFields';
import { audit } from '../../../lib/audit';
import { isUuid } from '../../../lib/util';

export default route({
  // Personas the signed-in person can practice with: the shared library plus their own company's.
  // ?all=1 (super admin only) lists everything, including switched-off and company-specific ones.
  GET: async (req, res) => {
    if (req.query.all === '1') {
      await requireSuper(req, res);
      const { rows } = await query(
        `select s.*, c.name as company_name from scenarios s left join companies c on c.id = s.company_id
          order by s.difficulty, s.created_at`
      );
      return res.status(200).json(rows);
    }
    const user = await requireUser(req, res);
    // The dealer's secret rules (system_prompt) stay on the server; trainees never receive them.
    const { rows } = await query(
      `select id, name, avatar_emoji, difficulty, tagline, opening_line, is_active, company_id, created_at
         from scenarios
        where is_active = true and (company_id is null or company_id = $1)
        order by difficulty, created_at`,
      [user.company_id]
    );
    res.status(200).json(rows);
  },

  POST: async (req, res) => {
    const user = await requireSuper(req, res);
    const f = pickScenarioFields(req.body);
    if (!f.name || !f.system_prompt) fail(400, 'Name and system prompt are required');
    const companyId = isUuid(req.body?.company_id) ? req.body.company_id : null;

    const { rows } = await query(
      `insert into scenarios (name, avatar_emoji, difficulty, tagline, opening_line, system_prompt, is_active, company_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [
        f.name,
        f.avatar_emoji ?? '🧑‍💼',
        f.difficulty ?? 1,
        f.tagline ?? null,
        f.opening_line ?? 'Hello, haan boliye.',
        f.system_prompt,
        f.is_active ?? true,
        companyId,
      ]
    );
    await audit(user, 'persona.create', { companyId, target: f.name });
    res.status(201).json(rows[0]);
  },
});
