// Calls Groq's LLM (OpenAI-compatible endpoint) so Gupta Ji can reply.

import { GUPTA_JI_SYSTEM_PROMPT, OPENING_LINE } from '../../lib/guptaJiPrompt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { history } = req.body; // [{role:'user'|'assistant', content:string}, ...]

    const messages = [
      { role: 'system', content: GUPTA_JI_SYSTEM_PROMPT },
      { role: 'assistant', content: OPENING_LINE },
      ...(history || []),
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Thik hai, aage boliye.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
