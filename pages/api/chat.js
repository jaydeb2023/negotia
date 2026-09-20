// Model can be switched without a code change by setting GROQ_CHAT_MODEL in Vercel
// (e.g. "llama-3.3-70b-versatile" for a non-reasoning model).
const MODEL = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b';

// gpt-oss models "think" before answering, and that hidden thinking is counted
// against the token limit. With a tiny limit (200) the thinking can use it all up,
// leaving an EMPTY reply. So: bigger budget + low reasoning effort for these models.
const IS_REASONING_MODEL = MODEL.startsWith('openai/gpt-oss');

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Fail fast and clearly if the key is missing.
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in this environment.');
      return res.status(500).json({ error: 'Server misconfiguration: GROQ_API_KEY is missing.' });
    }

    const { history, systemPrompt, openingLine } = req.body;
    if (!systemPrompt) return res.status(400).json({ error: 'systemPrompt is required' });

    const strictSuffix = `

STRICT ADHERENCE: Follow every rule above exactly as written — the objection, what you reveal and when, and the exact outcome triggers. Do not invent new objections, new outcomes, or new information beyond what is written above. Do not soften or skip the reveal-gradually rule.

VOICE CALL RULES:
- You are speaking out loud on a phone call. Reply with 1-2 SHORT spoken sentences (under 30 words). Never reply with an empty message.
- Respond ONLY to what the trainee just said. Never write the trainee's lines, never summarise the call, and never keep the conversation going on your own.
- Do not agree to any order, trial or number of cases until the trainee has actually pitched a benefit AND answered your objection. Share your concerns one at a time, exactly as your rules say.
- Language: speak natural Hindi in Devanagari script, keeping common business words (order, case, margin, delivery, stock, trial, price) in English letters. Your text is read aloud by a Hindi voice.`;

    const messages = [
      { role: 'system', content: systemPrompt + strictSuffix },
      { role: 'assistant', content: openingLine || 'Hello.' },
      ...(history || []),
    ];

    const body = {
      model: MODEL,
      messages,
      temperature: 0.35,
      max_completion_tokens: IS_REASONING_MODEL ? 1024 : 200,
    };
    // "low" is fast; if Gupta Ji ignores his rules, set GROQ_REASONING_EFFORT=medium in Vercel.
    if (IS_REASONING_MODEL) body.reasoning_effort = process.env.GROQ_REASONING_EFFORT || 'low';

    // Try up to 2 times: an occasional empty completion is retried instead of
    // being turned into a fake "Thik hai, aage boliye." line.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error('Groq API error:', groqRes.status, errText);
        return res.status(groqRes.status).json({
          error: 'Failed to get a response from the AI model.',
          details: errText,
        });
      }

      const data = await groqRes.json();
      const choice = data.choices?.[0];
      const rawReply = choice?.message?.content?.trim();
      const reply = rawReply ? cleanReply(rawReply) : '';

      if (reply) return res.status(200).json({ reply });

      // Shows up in Vercel > Logs. finish_reason "length" = ran out of tokens.
      console.warn(`[chat] empty reply (attempt ${attempt}/2)`, {
        model: MODEL,
        finish_reason: choice?.finish_reason,
        usage: data.usage,
      });
    }

    return res.status(502).json({ error: 'The AI model returned an empty reply.' });
  } catch (err) {
    console.error('Unhandled error in /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
}