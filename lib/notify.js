import { query } from './db';

// Creates the same in-app notification for several users. Returns how many were created.
export async function notify(userIds, { kind = 'system', title, body = null, link = null }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length || !title) return 0;
  await query(
    `insert into notifications (user_id, kind, title, body, link)
     select unnest($1::uuid[]), $2, $3, $4, $5`,
    [ids, kind, title, body, link]
  );
  return ids.length;
}

export async function superAdminIds() {
  const { rows } = await query("select id from users where role = 'super_admin' and status = 'active'");
  return rows.map((r) => r.id);
}

export async function companyAdminIds(companyId) {
  const { rows } = await query(
    "select id from users where company_id = $1 and role = 'company_admin' and status = 'active'",
    [companyId]
  );
  return rows.map((r) => r.id);
}
