export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
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
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Thik hai, aage boliye.';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}