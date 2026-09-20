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
// Keep it to plain vocabulary (NOT a full sales sentence): on quiet or unclear audio Whisper can
// repeat prompt text as if it had been spoken. EDIT the word list to match your products.
const HINGLISH_PROMPT =
  'नमस्ते जी, मैं Transcend से बोल रहा हूँ। Product, contractor, Jodi, margin, delivery, stock, price, discount, scheme, trial और order के बारे में बात हो रही है।';

// Override without a code change: set WHISPER_LANGUAGE in Vercel env vars
// (e.g. "en"). Defaults to Hindi.
const LANGUAGE = process.env.WHISPER_LANGUAGE || 'hi';

// Whisper sometimes echoes its prompt back when the clip is silent or very short.
function looksLikePromptEcho(text, prompt) {
  const norm = (s) =>
    s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  const t = norm(text);
  return t.length > 3 && norm(prompt).includes(t);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in this environment.');
      return res.status(500).json({ error: 'Server misconfiguration: GROQ_API_KEY is missing.' });
    }

    const { audioBase64, mimeType, nameHint } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'No audio provided' });

    // The dealer's name (e.g. "Gupta Ji") helps Whisper spell it correctly instead of
    // hearing "पुक्ता जी". Only letters/digits/spaces are kept, max 40 characters.
    const name = typeof nameHint === 'string'
      ? nameHint.replace(/[^\p{L}\p{M}\p{N} ]/gu, '').trim().slice(0, 40)
      : '';
    const prompt = name ? `${HINGLISH_PROMPT} ${name} से बात हो रही है।` : HINGLISH_PROMPT;

    const buffer = Buffer.from(audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), 'speech.webm');
    form.append('model', 'whisper-large-v3');
    form.append('language', LANGUAGE);
    form.append('prompt', prompt);
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
    if (looksLikePromptEcho(text, prompt)) text = '';
    res.status(200).json({ text });
  } catch (err) {
    console.error('Unhandled error in /api/transcribe:', err);
    res.status(500).json({ error: err.message });
  }
}