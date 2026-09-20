// AI "judge": reads the whole call and decides the outcome, instead of matching
// keywords in Gupta Ji's last line (which breaks when he speaks Devanagari Hindi).
//
// Request:  POST { scenarioId, transcript: [{ who, text }, ...] }
// Response: { outcome, casesOrdered, behaviourScore (0-10), feedback }

import { supabase } from '../../lib/supabaseClient';

const MODEL = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b';
const IS_REASONING_MODEL = MODEL.startsWith('openai/gpt-oss');

const OUTCOMES = ['RP1_success', 'RP2_success', 'WP1', 'WP2', 'incomplete'];
const CASES_FOR = { RP1_success: 2, RP2_success: 5 }; // same meaning the app used before

function extractJson(text) {
  const match = (text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GROQ_API_KEY is missing.' });
    }

    const { scenarioId, transcript } = req.body;
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: 'transcript is required' });
    }

    // Load the persona's own rules on the server (so the client can't feed us fake rules).
    let personaRules = '';
    if (scenarioId) {
      const { data } = await supabase
        .from('scenarios')
        .select('system_prompt')
        .eq('id', scenarioId)
        .single();
      personaRules = data?.system_prompt || '';
    }

    const callText = transcript
      .slice(-60)
      .map((t) => `${t.who === 'You' ? 'TRAINEE' : 'DEALER'}: ${String(t.text || '').slice(0, 600)}`)
      .join('\n');

    const judgePrompt = `You are a strict but fair sales-training evaluator.

Below are (A) the rules the AI dealer persona was given, which may define exactly how each call outcome is decided, and (B) the full call transcript between a TRAINEE salesperson and the DEALER. The transcript may be in Hindi (Devanagari), Roman Hinglish, English, or a mix. "दो केस" means 2 cases, "पाँच/पांच केस" means 5 cases.

Choose exactly ONE outcome code:
- "RP1_success": the dealer clearly agreed to a small trial order (about 2 cases)
- "RP2_success": the dealer clearly agreed to the larger order (about 5 cases)
- "WP1": the dealer did not commit and said he will think it over / talk next week
- "WP2": the dealer was busy or said he will call back
- "incomplete": the call ended before the dealer clearly committed, postponed or declined
If the persona rules in (A) define these outcomes differently, follow the persona rules. Judge the dealer's FINAL position, not what the trainee hoped for.

Also give "behaviour_score", an integer 0-10, for the trainee's conduct: polite and respectful tone, listened to the dealer's objection, answered it with a real benefit, did not pressure or lie, and closed clearly.

Write "feedback" as 2-3 simple English sentences: what the trainee did well and one thing to improve.

Reply with ONLY a JSON object, no other text, exactly in this shape:
{"outcome": "...", "behaviour_score": 0, "feedback": "..."}

(A) PERSONA RULES:
${personaRules || '(not available)'}

(B) CALL TRANSCRIPT:
${callText}`;

    const body = {
      model: MODEL,
      messages: [{ role: 'user', content: judgePrompt }],
      temperature: 0.1,
      max_completion_tokens: IS_REASONING_MODEL ? 2048 : 400,
    };
    if (IS_REASONING_MODEL) body.reasoning_effort = 'medium';

    let parsed = null;
    for (let attempt = 1; attempt <= 2 && !parsed; attempt++) {
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
        console.error('[score] Groq error:', groqRes.status, errText);
        return res.status(groqRes.status).json({ error: 'Scoring model request failed.' });
      }

      const data = await groqRes.json();
      const choice = data.choices?.[0];
      parsed = extractJson(choice?.message?.content);
      if (!parsed) {
        console.warn(`[score] unusable reply (attempt ${attempt}/2)`, {
          finish_reason: choice?.finish_reason,
          usage: data.usage,
        });
      }
    }

    if (!parsed) return res.status(502).json({ error: 'Scoring model returned no usable result.' });

    const outcome = OUTCOMES.includes(parsed.outcome) ? parsed.outcome : 'incomplete';
    const behaviourScore = Math.max(0, Math.min(10, Math.round(Number(parsed.behaviour_score) || 0)));

    res.status(200).json({
      outcome,
      casesOrdered: CASES_FOR[outcome] || 0,
      behaviourScore,
      feedback: String(parsed.feedback || '').slice(0, 600),
    });
  } catch (err) {
    console.error('Unhandled error in /api/score:', err);
    res.status(500).json({ error: err.message });
  }
}