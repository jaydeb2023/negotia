import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const SILENCE_THRESHOLD = 10;      // volume level (0-255) below which we count as "quiet"
const SILENCE_DURATION_MS = 1200;  // how long you must be quiet before we auto-stop
const MIN_SPEECH_MS = 500;         // must detect real speech for at least this long first
const MIN_AUDIO_BYTES = 1500;      // recordings smaller than this are treated as "nothing said"

// Split a reply into sentence-sized pieces for speech. Chrome's online voices tend to
// cut off after ~15 seconds of continuous speech, so we speak short pieces one by one.
function splitForSpeech(text, maxLen = 160) {
  const sentences = text.match(/[^।.!?]+[।.!?]*/g) || [text];
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > maxLen) {
      chunks.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// Find a Hindi text-to-speech voice. Without one, the browser reads Devanagari with
// its default English voice, which sounds wrong or stays silent.
function pickHindiVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  const isHindi = (v) => (v.lang || '').replace('_', '-').toLowerCase().startsWith('hi');
  return voices.find((v) => isHindi(v) && /google/i.test(v.name)) || voices.find(isHindi) || null;
}

// Backup scoring, only used if the AI judge (/api/score) fails.
function fallbackScore(lastLine) {
  if (/5\s*cases?|[५5]\s*केस|पाँच\s*केस|पांच\s*केस/i.test(lastLine)) return { outcome: 'RP2_success', casesOrdered: 5 };
  if (/2\s*cases?|trial|[२2]\s*केस|दो\s*केस|ट्रायल/i.test(lastLine)) return { outcome: 'RP1_success', casesOrdered: 2 };
  if (/next week|think|अगले\s*हफ्ते|सोच/i.test(lastLine)) return { outcome: 'WP1', casesOrdered: 0 };
  if (/call kar lunga|busy|व्यस्त|बिज़ी/i.test(lastLine)) return { outcome: 'WP2', casesOrdered: 0 };
  return { outcome: 'incomplete', casesOrdered: 0 };
}

export default function Practice() {
  const router = useRouter();
  const { scenario: scenarioId } = router.query;
  const { user, profile } = useAuth();

  // ---- UI state (drives rendering only) ----
  const [scenario, setScenario] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [result, setResult] = useState(null);

  // ---- Live values (read from async callbacks) ----
  // startListening / handleRecordingStop / speak callbacks are created in one render
  // but run seconds later. Anything they read from React state would be the OLD value.
  // Refs always hold the current value.
  const startedRef = useRef(false);
  const historyRef = useRef([]);
  const transcriptRef = useRef([]);
  const scenarioRef = useRef(null);
  const utterRef = useRef([]); // keeps utterances alive so Chrome doesn't GC them before onend fires

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const spokeSinceRef = useRef(null);
  const quietSinceRef = useRef(null);

  useEffect(() => {
    if (!scenarioId) return;
    async function load() {
      const { data } = await supabase.from('scenarios').select('*').eq('id', scenarioId).single();
      scenarioRef.current = data;
      setScenario(data);
      setLoadingScenario(false);
    }
    load();
  }, [scenarioId]);

  // Chrome loads its voice list asynchronously. Touching it early makes sure the
  // Hindi voice is available by the time Gupta Ji first speaks.
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.getVoices();
    const onVoices = () => speechSynthesis.getVoices();
    speechSynthesis.addEventListener?.('voiceschanged', onVoices);
    return () => speechSynthesis.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  useEffect(() => {
    return () => {
      startedRef.current = false;
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      stopEverything(); // cleanup on unmount
    };
  }, []);

  function addBubble(who, text) {
    transcriptRef.current = [...transcriptRef.current, { who, text }];
    setTranscript(transcriptRef.current);
  }

  // Closing an AudioContext that's already closed throws InvalidStateError.
  function safeCloseAudioCtx() {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch((err) => console.warn('AudioContext close ignored:', err.message));
    }
    audioCtxRef.current = null;
  }

  function speak(text, onEnd) {
    speechSynthesis.cancel(); // clear any stuck queue

    const chunks = splitForSpeech(text);
    if (chunks.length === 0) {
      (onEnd || (() => {}))();
      return;
    }

    const voice = pickHindiVoice();
    console.log('[speak] voice:', voice ? `${voice.name} (${voice.lang})` : 'none found, using lang hint hi-IN');

    // Some browsers can silently fail to fire `onend`; a one-shot fallback timer
    // guarantees we always resume listening.
    let done = false;
    let fallbackTimer;
    function finish(reason) {
      if (done) return;
      done = true;
      clearTimeout(fallbackTimer);
      console.log('[speak] finished via:', reason);
      (onEnd || (() => {}))();
    }

    const estimatedMs = Math.max(2500, text.length * 90);
    fallbackTimer = setTimeout(() => finish('fallback-timeout'), estimatedMs + 4000);

    const utterances = chunks.map((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = voice?.lang || 'hi-IN';
      if (voice) u.voice = voice;
      u.rate = 0.95;
      if (i === chunks.length - 1) u.onend = () => finish('onend-event');
      u.onerror = (e) => {
        if (done) return;
        console.error('[speak] utterance error:', e.error);
        speechSynthesis.cancel();
        finish('onerror-event');
      };
      return u;
    });
    utterRef.current = utterances;

    setStatus('speaking');
    console.log('[speak] starting,', chunks.length, 'chunk(s), estimated duration ms:', estimatedMs);
    try {
      utterances.forEach((u) => speechSynthesis.speak(u));
    } catch (err) {
      console.error('speechSynthesis failed to start:', err);
      finish('sync-throw');
    }
  }

  function stopEverything() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    safeCloseAudioCtx();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }

  function startCall() {
    const sc = scenarioRef.current;
    startedRef.current = true;
    historyRef.current = [];
    transcriptRef.current = [];
    setResult(null);
    setStarted(true);
    setTranscript([]);
    addBubble(sc.name, sc.opening_line);
    speak(sc.opening_line, startListening);
  }

  async function startListening() {
    if (!startedRef.current) return; // call was ended while we were speaking/waiting
    console.log('[startListening] called');
    try {
      setStatus('listening');
      chunksRef.current = [];
      spokeSinceRef.current = null;
      quietSinceRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!startedRef.current) { // ended while the permission prompt / mic was opening
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleRecordingStop;
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      console.log('[startListening] mic + recorder ready, now listening');

      monitorVolume();
    } catch (err) {
      console.error('[startListening] failed:', err.name, err.message);
      setIsRecording(false);
      setStatus(err.name === 'NotAllowedError' ? 'mic-denied' : 'mic-error');
    }
  }

  function monitorVolume() {
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] - 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = Date.now();

      if (rms > SILENCE_THRESHOLD) {
        if (!spokeSinceRef.current) spokeSinceRef.current = now;
        quietSinceRef.current = null;
      } else {
        if (!quietSinceRef.current) quietSinceRef.current = now;
      }

      const hasSpokenEnough = spokeSinceRef.current && (now - spokeSinceRef.current) > MIN_SPEECH_MS;
      const isQuietLongEnough = quietSinceRef.current && (now - quietSinceRef.current) > SILENCE_DURATION_MS;

      if (hasSpokenEnough && isQuietLongEnough) {
        stopListeningAndSend();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopListeningAndSend() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    safeCloseAudioCtx();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') mr.stop(); // stop() on an inactive recorder throws
    setIsRecording(false);
  }

  function manualStop() {
    // fallback button, in case auto-silence-detection doesn't trigger
    stopListeningAndSend();
  }

  function listenAgain(delayMs) {
    setTimeout(() => { if (startedRef.current) startListening(); }, delayMs);
  }

  async function handleRecordingStop() {
    console.log('[handleRecordingStop] triggered');
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (!startedRef.current) return; // call was ended (this fires when tracks stop too)

    const sc = scenarioRef.current;

    try {
      setStatus('transcribing');

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      if (blob.size < MIN_AUDIO_BYTES) {
        setStatus('missed');
        listenAgain(1200);
        return;
      }
      const base64 = await blobToBase64(blob);

      const tRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
      });
      if (!tRes.ok) throw new Error(`transcribe failed (${tRes.status})`);
      const tData = await tRes.json();
      const said = tData.text?.trim();
      console.log('[handleRecordingStop] transcribed:', said);

      if (!startedRef.current) return;
      if (!said) {
        setStatus('missed');
        listenAgain(1200);
        return;
      }

      addBubble('You', said);
      historyRef.current = [...historyRef.current, { role: 'user', content: said }];

      setStatus('thinking');
      const cRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyRef.current,
          systemPrompt: sc.system_prompt,
          openingLine: sc.opening_line,
        }),
      });
      if (!cRes.ok) throw new Error(`chat failed (${cRes.status})`);
      const cData = await cRes.json();
      const reply = cData.reply || 'ठीक है, आगे बोलिए।';
      console.log('[handleRecordingStop] AI reply:', reply, '| started:', startedRef.current);

      if (!startedRef.current) return;
      addBubble(sc.name, reply);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }];

      // auto-loop back to listening once Gupta Ji finishes speaking
      speak(reply, () => { if (startedRef.current) startListening(); });
    } catch (err) {
      // A single failed request should not kill the whole conversation.
      console.error('[handleRecordingStop] error:', err);
      if (!startedRef.current) return;
      setStatus('error');
      listenAgain(1500);
    }
  }

  async function endCall() {
    startedRef.current = false; // must be first: tells every pending callback to stop
    speechSynthesis.cancel();
    stopEverything();
    setStarted(false);
    setStatus('scoring');

    const sc = scenarioRef.current;
    const finalTranscript = transcriptRef.current;
    const traineeSpoke = finalTranscript.some((t) => t.who === 'You');

    let outcome = 'incomplete';
    let casesOrdered = 0;
    let behaviourScore = 0;
    let feedback = '';

    if (traineeSpoke) {
      try {
        const sRes = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: sc.id, transcript: finalTranscript }),
        });
        if (!sRes.ok) throw new Error(`score failed (${sRes.status})`);
        const s = await sRes.json();
        outcome = s.outcome;
        casesOrdered = s.casesOrdered;
        behaviourScore = s.behaviourScore;
        feedback = s.feedback || '';
      } catch (err) {
        console.error('[endCall] AI scoring failed, using keyword fallback:', err);
        const lastLine = [...finalTranscript].reverse().find((t) => t.who === sc.name)?.text || '';
        const fb = fallbackScore(lastLine);
        outcome = fb.outcome;
        casesOrdered = fb.casesOrdered;
      }
    }

    setStatus('saving');
    const { error: saveError } = await supabase.from('sessions').insert([{
      user_id: user.id,
      trainee_name: profile?.full_name || user.email,
      scenario_id: sc.id,
      scenario_name: sc.name,
      transcript: finalTranscript,
      outcome,
      cases_ordered: casesOrdered,
      behaviour_score: behaviourScore,
    }]);

    if (saveError) {
      console.error('[endCall] failed to save session:', saveError.message);
    } else {
      console.log('[endCall] session saved successfully');
    }

    setResult({ outcome, casesOrdered, behaviourScore, feedback, saved: !saveError });
    setStatus('idle');
  }

  const statusLabel = {
    idle: 'Ready',
    listening: 'Listening… (auto-stops when you finish talking)',
    transcribing: 'Transcribing…',
    thinking: `${scenario?.name || 'They'} is thinking…`,
    speaking: `${scenario?.name || 'They'} is speaking…`,
    scoring: 'Scoring your call…',
    saving: 'Saving session…',
    missed: "Didn't catch that — listening again…",
    error: 'Something went wrong — listening again…',
    'mic-denied': "Microphone blocked — allow it in your browser's site settings, then reload",
    'mic-error': 'Could not access microphone — try again',
  }[status] || status;

  const ringClass =
    status === 'listening' ? 'ring-listen' :
    status === 'speaking' ? 'ring-speak' :
    status === 'thinking' ? 'ring-think' : '';

  const busyAfterCall = status === 'scoring' || status === 'saving';

  if (loadingScenario) return <div className="page">Loading…</div>;
  if (!scenario) return <div className="page">Scenario not found. <a href="/">Go back</a></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{scenario.name}</h1>
        <p>{scenario.tagline}</p>
      </div>

      {!started ? (
        <div className="card call-stage">
          <div className={`avatar-circle ${ringClass}`}><span>{scenario.avatar_emoji}</span></div>
          <button
            className="btn-primary"
            style={{ marginTop: 22 }}
            onClick={startCall}
            disabled={busyAfterCall}
          >
            {status === 'scoring' ? 'Scoring your call…' : status === 'saving' ? 'Saving…' : 'Start Call'}
          </button>
        </div>
      ) : (
        <div className="card call-stage">
          <div className={`avatar-circle ${ringClass}`}><span>{scenario.avatar_emoji}</span></div>
          <p className="call-status">{statusLabel}</p>
          <div className="call-controls">
            {isRecording && (
              <button className="btn-ghost" onClick={manualStop}>Done speaking</button>
            )}
            <button className="fab-end" onClick={endCall} aria-label="End call">✕</button>
          </div>
        </div>
      )}

      {!started && result && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Call result</h3>
          <p>
            <span className={`outcome-tag ${result.outcome}`}>{result.outcome}</span>
            {' · '}Cases: <strong>{result.casesOrdered}</strong>
            {' · '}Behaviour: <strong>{result.behaviourScore}/10</strong>
          </p>
          {result.feedback && <p>{result.feedback}</p>}
          {!result.saved && (
            <p style={{ color: 'var(--muted)' }}>
              Note: this result could not be saved to the dashboard (check the console).
            </p>
          )}
        </div>
      )}

      <div className="card transcript">
        {transcript.map((t, i) => (
          <div key={i} className={t.who === 'You' ? 'bubble you' : 'bubble gupta'}>
            <span className="who">{t.who}</span>{t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}