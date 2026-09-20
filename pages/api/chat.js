export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Fail fast and clearly if the key is missing, instead of letting Groq's
    // generic "model does not exist" error mask the real problem.
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in this environment.');
      return res.status(500).json({ error: 'Server misconfiguration: GROQ_API_KEY is missing.' });
    }

    const { history, systemPrompt, openingLine } = req.body;
    if (!systemPrompt) return res.status(400).json({ error: 'systemPrompt is required' });

    const strictSuffix = `

STRICT ADHERENCE: Follow every rule above exactly as written — the objection, what you reveal and when, and the exact outcome triggers. Do not invent new objections, new outcomes, or new information beyond what is written above. Do not soften or skip the reveal-gradually rule.`;

    const messages = [
      { role: 'system', content: systemPrompt + strictSuffix },
      { role: 'assistant', content: openingLine || 'Hello.' },
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
        temperature: 0.35,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      // Log the full Groq error server-side so it shows up in Vercel Runtime Logs,
      // even though the client only gets a generic message.
      console.error('Groq API error:', groqRes.status, errText);
      return res.status(groqRes.status).json({
        error: 'Failed to get a response from the AI model.',
        details: errText,
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Thik hai, aage boliye.';
    res.status(200).json({ reply });
  } catch (err) {
    console.error('Unhandled error in /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
}