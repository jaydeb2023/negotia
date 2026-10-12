import { query } from './db';
import { fail } from './api';
import { requireRoles } from './auth';
import { isUuid } from './util';

// Every company-scoped API route starts here.
// - A company admin is ALWAYS locked to their own company (any companyId they send is ignored).
// - A super admin must say which company with ?companyId=...
// Routes must then filter every query by ctx.companyId.
export async function requireCompanyContext(req, res) {
  const user = await requireRoles(req, res, ['company_admin', 'super_admin']);
  const companyId = user.role === 'company_admin' ? user.company_id : String(req.query.companyId || '');
  if (!isUuid(companyId)) fail(400, 'companyId is required');
  const { rows } = await query('select * from companies where id = $1', [companyId]);
  if (!rows[0]) fail(404, 'Company not found');
  return { user, companyId, company: rows[0] };
}
