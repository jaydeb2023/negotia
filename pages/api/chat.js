// Server-side bridge to the Groq chat model: the dealer's replies.
// The browser sends only { scenarioId, history }. The dealer's secret rules and opening line
// are loaded here, so trainees never receive them.
import { query } from '../../lib/db';
import { route, fail } from '../../lib/api';
import { requireUser } from '../../lib/auth';
import { allow } from '../../lib/ratelimit';
import { isUuid } from '../../lib/util';

// Model can be switched without a code change by setting GROQ_CHAT_MODEL in .env.local
// (e.g. "llama-3.3-70b-versatile" for a non-reasoning model).
const GROQ_BASE = process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1'; // override only for tests
const MODEL = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b';

// gpt-oss models "think" before answering, and that hidden thinking is counted against the
// token limit. So: bigger budget for these models. "medium" follows the persona rules more
// carefully than "low" (a little slower). Override with GROQ_REASONING_EFFORT in .env.local.
const IS_REASONING_MODEL = MODEL.startsWith('openai/gpt-oss');
const REASONING_EFFORT = process.env.GROQ_REASONING_EFFORT || 'medium';

// ---- Safety net: remove leaked "thinking" from the spoken reply ----
// Reasoning models sometimes paste their private notes into the answer, e.g.
// "We need outcome: he should agree to trial." That would be read aloud to the trainee.
const LEAK_PHRASES =
  /\b(we need|we should|we must|we have to|i need to|i should respond|the user|the trainee|the dealer|system prompt|should agree|outcome:|respond as|reply as)\b/i;

const latinLetters = (s) => (s.match(/[A-Za-z]/g) || []).length;
const devanagariLetters = (s) => (s.match(/[\u0900-\u097F]/g) || []).length;

// A sentence is a leak only if it is mostly English AND talks about the task itself.
function isLeak(sentence) {
  return LEAK_PHRASES.test(sentence) && latinLetters(sentence) > devanagariLetters(sentence) * 2;
}

function cleanReply(text) {
  const parts = text.match(/[^।.!?\n]+[।.!?]*/g) || [text];
  if (!parts.some(isLeak)) return text; // nothing suspicious: leave the reply untouched
  console.warn('[chat] removed leaked reasoning from reply:', parts.filter(isLeak));
  return parts.filter((p) => !isLeak(p)).join(' ').replace(/\s+/g, ' ').trim();
}

// ---- Safety net: stop the dealer repeating himself ----
const words = (s) =>
  new Set(
    String(s || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );

// True if `reply` is (almost) the same as one of the dealer's recent lines.
function tooSimilar(reply, previous) {
  const a = words(reply);
  if (a.size < 4) return false;
  return previous.some((p) => {
    const b = words(p);
    if (!b.size) return false;
    let shared = 0;
    for (const w of a) if (b.has(w)) shared++;
    return shared / (a.size + b.size - shared) >= 0.8;
  });
}

const STRICT_SUFFIX = `

STRICT ADHERENCE: Follow every rule above exactly as written — the objection, what you reveal and when, and the exact outcome triggers. Do not invent new objections, new outcomes, or new information beyond what is written above. Do not soften or skip the reveal-gradually rule.

VOICE CALL RULES:
- You are speaking out loud on a phone call. Reply with 1-2 SHORT spoken sentences (under 30 words). Never reply with an empty message.
- Respond ONLY to what the trainee just said. Never write the trainee's lines, never summarise the call, and never keep the conversation going on your own.
- Do not agree to any order, trial or number of cases until the trainee has actually pitched a benefit AND answered your objection. Share your concerns one at a time, exactly as your rules say.
- Language: speak natural Hindi in Devanagari script, keeping common business words (order, case, margin, delivery, stock, trial, price) in English letters. Your text is read aloud by a Hindi voice.

GROUNDING AND REPETITION:
- Only use facts that appear in your rules. If the trainee asks about something that is not covered (exact prices, schemes, product details), do NOT invent it: say in character that you are not sure and ask them to explain. Never make up numbers, names or offers.
- Never repeat a sentence you already said. If the trainee has not solved your concern, say it in a different way, or move on to the next point in your rules.`;

const REPEAT_NUDGE =
  "Your previous reply repeated something you already said. Say something NEW that answers the trainee's latest words and moves the conversation forward. Do not repeat earlier lines.";

// One call to Groq. Returns { status, reply } (reply is '' when empty).
async function askGroq(messages, temperature) {
  const body = {
    model: MODEL,
    messages,
    temperature,
    max_completion_tokens: IS_REASONING_MODEL ? 1024 : 200,
  };
  if (IS_REASONING_MODEL) body.reasoning_effort = REASONING_EFFORT;

  const r = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    console.error('Groq API error:', r.status, (await r.text()).slice(0, 300));
    return { status: r.status, reply: '' };
  }
  const data = await r.json();
  const choice = data.choices?.[0];
  const raw = choice?.message?.content?.trim();
  const reply = raw ? cleanReply(raw) : '';
  if (!reply) console.warn('[chat] empty reply', { model: MODEL, finish_reason: choice?.finish_reason, usage: data.usage });
  return { status: 200, reply };
}

export default route({
  POST: async (req, res) => {
    const user = await requireUser(req, res);
    if (!allow(`chat:${user.id}`, 60, 5 * 60 * 1000)) fail(429, 'You are going too fast. Please wait a moment.');
    if (!process.env.GROQ_API_KEY) fail(500, 'Server misconfiguration: GROQ_API_KEY is missing.');

    const { scenarioId, history } = req.body || {};
    if (!isUuid(scenarioId)) fail(400, 'scenarioId is required');

    // Load the dealer's rules on the server, only if this person may use this persona.
    const { rows } = await query(
      `select system_prompt, opening_line from scenarios
        where id = $1 and (($2 = 'super_admin') or (is_active = true and (company_id is null or company_id = $3)))`,
      [scenarioId, user.role, user.company_id]
    );
    if (!rows[0]) fail(404, 'Persona not found');

    // Only user/assistant turns from the browser are accepted (no injected "system" messages).
    const turns = (Array.isArray(history) ? history : [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-24)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

    const messages = [
      { role: 'system', content: rows[0].system_prompt + STRICT_SUFFIX },
      { role: 'assistant', content: rows[0].opening_line || 'Hello.' },
      ...turns,
    ];
    const previous = [rows[0].opening_line, ...turns.filter((t) => t.role === 'assistant').map((t) => t.content)]
      .filter(Boolean)
      .slice(-3);

    // Up to 2 tries: an occasional empty completion is retried instead of faking a reply.
    let out = { status: 200, reply: '' };
    for (let attempt = 1; attempt <= 2 && !out.reply; attempt++) {
      out = await askGroq(messages, attempt === 1 ? 0.35 : 0.5); // a little more variety on the retry
      if (out.status !== 200) fail(out.status === 429 ? 429 : 502, 'The AI service is busy. Please try again.');
    }
    // If he is repeating himself, ask once more with a gentle push to move forward.
    if (out.reply && tooSimilar(out.reply, previous)) {
      const retry = await askGroq([...messages, { role: 'system', content: REPEAT_NUDGE }], 0.7);
      if (retry.reply) out = retry;
    }
    if (!out.reply) fail(502, 'The AI model returned an empty reply.');
    res.status(200).json({ reply: out.reply });
  },
});
