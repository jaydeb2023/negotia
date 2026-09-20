// Speech-to-text via Groq's hosted Whisper model.
// Receives raw audio (webm/wav) as a base64 string in the JSON body,
// forwards it to Groq as multipart form-data.

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

// Trainees speak Hinglish (Hindi + English mixed).
// - Auto-detect sometimes picks URDU and writes Arabic-style script, so we pin the
//   language to Hindi ('hi').
// - Pinning Hindi alone turned English words into Devanagari gibberish
//   (e.g. "hello" -> "आवारीओ"). The prompt below fixes that: it is written the way
//   we WANT the output to look (Hindi in Devanagari, English business words in
//   English letters), and Whisper copies that style. Max ~224 tokens.
// EDIT this to include names / product words your trainees actually say.
const HINGLISH_PROMPT =
  'नमस्ते गुप्ता जी, मैं Transcend से बोल रहा हूँ। क्या मैं आपको अपने product के बारे में बता सकता हूँ? ' +
  'हमारा margin अच्छा है और delivery time पर होती है। आप दो case का trial order confirm कर दीजिए। ' +
  'Price, discount, scheme और stock के बारे में बात करते हैं।';

// Override without a code change: set WHISPER_LANGUAGE in Vercel env vars
// (e.g. "en"). Defaults to Hindi.
const LANGUAGE = process.env.WHISPER_LANGUAGE || 'hi';

// Whisper sometimes echoes its prompt back when the clip is silent or very short.
function looksLikePromptEcho(text) {
  const norm = (s) =>
    s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
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
    form.append('language', LANGUAGE);
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