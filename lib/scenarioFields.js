// Only these columns can be written from the persona editor.
const FIELDS = ['name', 'avatar_emoji', 'difficulty', 'tagline', 'opening_line', 'system_prompt', 'is_active'];

export function pickScenarioFields(body = {}) {
  const out = {};
  for (const key of FIELDS) {
    if (body[key] === undefined) continue;
    if (key === 'difficulty') out[key] = Math.max(1, Math.min(10, Number(body[key]) || 1));
    else if (key === 'is_active') out[key] = Boolean(body[key]);
    else out[key] = typeof body[key] === 'string' ? body[key] : String(body[key] ?? '');
  }
  return out;
}

export const SCENARIO_FIELDS = FIELDS;
