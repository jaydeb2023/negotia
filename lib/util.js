const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v) => UUID.test(String(v || ''));

// Trimmed string with a maximum length ('' if not a string).
export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Whole number clamped between lo and hi (falls back to d).
export function int(v, lo, hi, d = lo) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
}

export const emailOk = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// CSV cell: quotes when needed, and neutralises spreadsheet formulas (=, +, -, @).
export function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
