// Imports personas exported from the old Supabase project.
//   npm run db:import-scenarios -- scenarios.json
const fs = require('fs');
const { Pool } = require('pg');

(async () => {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npm run db:import-scenarios -- scenarios.json');
  let rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) rows = [rows];
  // Supabase's "json_agg" export can come wrapped as [{ "json_agg": [...] }]
  if (rows.length === 1 && Array.isArray(rows[0].json_agg)) rows = rows[0].json_agg;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let n = 0;
  for (const r of rows) {
    await pool.query(
      `insert into scenarios (id, name, avatar_emoji, difficulty, tagline, opening_line, system_prompt, is_active)
       values (coalesce($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         name = excluded.name, avatar_emoji = excluded.avatar_emoji, difficulty = excluded.difficulty,
         tagline = excluded.tagline, opening_line = excluded.opening_line,
         system_prompt = excluded.system_prompt, is_active = excluded.is_active`,
      [
        r.id || null, r.name, r.avatar_emoji || '🧑‍💼', Number(r.difficulty) || 1,
        r.tagline || null, r.opening_line || 'Hello, haan boliye.', r.system_prompt || '',
        r.is_active === undefined ? true : Boolean(r.is_active),
      ]
    );
    n++;
  }
  console.log(`Imported ${n} persona(s).`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
