export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { history, systemPrompt, openingLine } = req.body;
    if (!systemPrompt) return res.status(400).json({ error: 'systemPrompt is required' });

    const messages = [
      { role: 'system', content: systemPrompt },
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