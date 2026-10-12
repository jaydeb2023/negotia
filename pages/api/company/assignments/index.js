import { query } from '../../../../lib/db';
import { route, fail } from '../../../../lib/api';
import { requireCompanyContext } from '../../../../lib/companyCtx';
import { notify } from '../../../../lib/notify';
import { audit } from '../../../../lib/audit';
import { isUuid, str } from '../../../../lib/util';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default route({
  GET: async (req, res) => {
    const { companyId } = await requireCompanyContext(req, res);
    const { rows } = await query(
      `select a.id, a.kind, a.title, a.instructions, a.resource_url, a.scenario_id, a.due_date, a.created_at,
              s.name as scenario_name, u.full_name as created_by_name,
              (select count(*)::int from assignment_users where assignment_id = a.id) as total,
              (select count(*)::int from assignment_users where assignment_id = a.id and status = 'completed') as completed
         from assignments a
         left join scenarios s on s.id = a.scenario_id
         left join users u on u.id = a.created_by
        where a.company_id = $1
        order by a.created_at desc limit 200`,
      [companyId]
    );
    res.status(200).json(rows);
  },

  // Create an assignment and give it to chosen people ({ userIds }) or everyone ({ all: true }).
  POST: async (req, res) => {
    const { user, companyId } = await requireCompanyContext(req, res);
    const b = req.body || {};

    const kind = b.kind === 'training' ? 'training' : 'practice';
    const title = str(b.title, 160);
    if (!title) fail(400, 'Please enter a title.');
    const dueDate = b.due_date ? String(b.due_date) : null;
    if (dueDate && !DATE.test(dueDate)) fail(400, 'Invalid due date.');

    let resourceUrl = str(b.resource_url, 500) || null;
    if (resourceUrl && !/^https?:\/\//i.test(resourceUrl)) fail(400, 'The link must start with http:// or https://');

    let scenarioId = null;
    if (kind === 'practice') {
      if (!isUuid(b.scenario_id)) fail(400, 'Choose which persona to practice with.');
      const sc = await query(
        'select id from scenarios where id = $1 and is_active = true and (company_id is null or company_id = $2)',
        [b.scenario_id, companyId]
      );
      if (!sc.rows[0]) fail(400, 'That persona is not available to this company.');
      scenarioId = sc.rows[0].id;
      resourceUrl = null;
    }

    // Who gets it: only active people of THIS company.
    const wanted = (Array.isArray(b.userIds) ? b.userIds : []).filter(isUuid);
    const people = b.all
      ? await query("select id from users where company_id = $1 and status = 'active' and role = 'employee'", [companyId])
      : await query("select id from users where company_id = $1 and status = 'active' and id = any($2::uuid[])", [companyId, wanted]);
    if (!people.rows.length) fail(400, 'Choose at least one person.');
    const targetIds = people.rows.map((r) => r.id);

    const created = await query(
      `insert into assignments (company_id, created_by, kind, title, instructions, resource_url, scenario_id, due_date)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [companyId, user.id, kind, title, str(b.instructions, 2000) || null, resourceUrl, scenarioId, dueDate]
    );
    const id = created.rows[0].id;
    await query('insert into assignment_users (assignment_id, user_id) select $1, unnest($2::uuid[])', [id, targetIds]);

    await notify(targetIds, {
      kind: 'assignment',
      title: kind === 'practice' ? 'New practice assigned' : 'New training assigned',
      body: `${title}${dueDate ? ` (due ${dueDate})` : ''}`,
      link: '/app/assignments',
    });
    await audit(user, 'assignment.create', { companyId, target: title, meta: { kind, people: targetIds.length } });
    res.status(201).json({ ok: true, id, people: targetIds.length });
  },
});
