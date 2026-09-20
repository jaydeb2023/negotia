// Speech-to-text via Groq's hosted Whisper model.
// Receives raw audio (webm/wav) as a base64 string in the JSON body,
// forwards it to Groq as multipart form-data.

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'No audio provided' });

    const buffer = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'speech.webm');
    form.append('model', 'whisper-large-v3');
    form.append('language', 'hi');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    res.status(200).json({ text: data.text || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}