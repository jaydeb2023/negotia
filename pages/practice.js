import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const SILENCE_THRESHOLD = 10;      // volume level (0-255) below which we count as "quiet"
const SILENCE_DURATION_MS = 1200;  // how long you must be quiet before we auto-stop
const MIN_SPEECH_MS = 500;         // must detect real speech for at least this long first

export default function Practice() {
  const router = useRouter();
  const { scenario: scenarioId } = router.query;
  const { user, profile } = useAuth();

  const [scenario, setScenario] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [history, setHistory] = useState([]);

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
      setScenario(data);
      setLoadingScenario(false);
    }
    load();
  }, [scenarioId]);

  useEffect(() => {
    return () => stopEverything(); // cleanup on unmount
  }, []);

  function addBubble(who, text) {
    setTranscript((t) => [...t, { who, text }]);
  }

  function speak(text, onEnd) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.onend = onEnd || (() => {});
    setStatus('speaking');
    speechSynthesis.speak(utter);
  }

  function stopEverything() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }

  async function startCall() {
    setStarted(true);
    setTranscript([]);
    setHistory([]);
    addBubble(scenario.name, scenario.opening_line);
    speak(scenario.opening_line, startListening);
  }

  async function startListening() {
    try {
      setStatus('listening');
      chunksRef.current = [];
      spokeSinceRef.current = null;
      quietSinceRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = handleRecordingStop;
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);

      monitorVolume();
    } catch (err) {
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
    if (audioCtxRef.current) audioCtxRef.current.close();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function manualStop() {
    // fallback button, in case auto-silence-detection doesn't trigger
    stopListeningAndSend();
  }

  async function handleRecordingStop() {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setStatus('transcribing');

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const base64 = await blobToBase64(blob);

    const tRes = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' }),
    });
    const tData = await tRes.json();
    const said = tData.text?.trim();

    if (!said) {
      setStatus('missed');
      setTimeout(() => { if (started) startListening(); }, 1200);
      return;
    }

    addBubble('You', said);
    const newHistory = [...history, { role: 'user', content: said }];
    setHistory(newHistory);

    setStatus('thinking');
    const cRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: newHistory,
        systemPrompt: scenario.system_prompt,
        openingLine: scenario.opening_line,
      }),
    });
    const cData = await cRes.json();
    const reply = cData.reply || 'Thik hai, aage boliye.';
    addBubble(scenario.name, reply);
    setHistory([...newHistory, { role: 'assistant', content: reply }]);

    speak(reply, () => { if (started) startListening(); }); // auto-loop back to listening
  }

  async function endCall() {
    speechSynthesis.cancel();
    stopEverything();
    setStarted(false);
    setStatus('saving');

    const lastLine = [...transcript].reverse().find((t) => t.who === scenario.name)?.text || '';
    let outcome = 'incomplete';
    let casesOrdered = 0;
    if (/5 cases/i.test(lastLine)) { outcome = 'RP2_success'; casesOrdered = 5; }
    else if (/2 cases|trial/i.test(lastLine)) { outcome = 'RP1_success'; casesOrdered = 2; }
    else if (/next week|think/i.test(lastLine)) { outcome = 'WP1'; }
    else if (/call kar lunga|busy/i.test(lastLine)) { outcome = 'WP2'; }

    await supabase.from('sessions').insert([{
      user_id: user.id,
      trainee_name: profile?.full_name || user.email,
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      transcript,
      outcome,
      cases_ordered: casesOrdered,
      behaviour_score: 0,
    }]);

    setStatus('idle');
  }

  const statusLabel = {
    idle: 'Ready',
    listening: 'Listening… (auto-stops when you finish talking)',
    transcribing: 'Transcribing…',
    thinking: `${scenario?.name || 'They'} is thinking…`,
    speaking: `${scenario?.name || 'They'} is speaking…`,
    saving: 'Saving session…',
    missed: "Didn't catch that — listening again…",
    'mic-denied': "Microphone blocked — allow it in your browser's site settings, then reload",
    'mic-error': 'Could not access microphone — try again',
  }[status] || status;

  const ringClass =
    status === 'listening' ? 'ring-listen' :
    status === 'speaking' ? 'ring-speak' :
    status === 'thinking' ? 'ring-think' : '';

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
          <button className="btn-primary" style={{ marginTop: 22 }} onClick={startCall}>Start Call</button>
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