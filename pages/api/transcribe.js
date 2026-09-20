// Speech-to-text via Groq's hosted Whisper model.
// Receives raw audio (webm/wav) as a base64 string in the JSON body,
// forwards it to Groq as multipart form-data.

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

// Trainees speak Hinglish (Hindi + English mixed). Forcing language='hi' makes Whisper
// write every English word as Devanagari gibberish (e.g. "hello" -> "आवारीओ").
// Instead we leave the language on auto-detect and give Whisper a short Roman-script
// Hinglish sample. It uses this as a style + vocabulary hint (max ~224 tokens).
// EDIT this to include names / product words your trainees actually say.
const HINGLISH_PROMPT =
  'Namaste Gupta ji, main Transcend se bol raha hoon. Aapko cases ka trial order chahiye? ' +
  'Price, discount, scheme, delivery aur margin ke baare mein baat karte hain. Haan ji, theek hai.';

// Optional override without a code change: set WHISPER_LANGUAGE in Vercel env vars
// (e.g. "hi" or "en"). Leave unset for auto-detect.
const LANGUAGE = process.env.WHISPER_LANGUAGE;

// Whisper sometimes echoes its prompt back when the clip is silent or very short.
function looksLikePromptEcho(text) {
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  const t = norm(text);
  return t.length > 3 && norm(HINGLISH_PROMPT).includes(t);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in this environment.');
      return res.status(500).json({ error: 'Server misconfiguration: GROQ_API_KEY is missing.' });
    }

    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'No audio provided' });

    const buffer = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'speech.webm');
    form.append('model', 'whisper-large-v3');
    if (LANGUAGE) form.append('language', LANGUAGE);
    form.append('prompt', HINGLISH_PROMPT);
    form.append('temperature', '0');
    form.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq transcription error:', groqRes.status, errText);
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    let text = (data.text || '').trim();
    if (looksLikePromptEcho(text)) text = '';
    res.status(200).json({ text });
  } catch (err) {
    console.error('Unhandled error in /api/transcribe:', err);
    res.status(500).json({ error: err.message });
  }
}