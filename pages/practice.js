import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Practice() {
  const router = useRouter();
  const { scenario: scenarioId } = router.query;

  const [scenario, setScenario] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [traineeName, setTraineeName] = useState('');
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | listening | transcribing | thinking | speaking | saving | missed
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [history, setHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!scenarioId) return;
    async function load() {
      const { data } = await supabase.from('scenarios').select('*').eq('id', scenarioId).single();
      setScenario(data);
      setLoadingScenario(false);
    }
    load();
  }, [scenarioId]);

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

  async function startCall() {
    if (!traineeName.trim()) { alert('Enter your name first'); return; }
    setStarted(true);
    setTranscript([]);
    setHistory([]);
    addBubble(scenario.name, scenario.opening_line);
    speak(scenario.opening_line, () => setStatus('idle'));
  }

  async function toggleMic() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    setStatus('listening');
    setIsRecording(true);
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = handleRecordingStop;
    mr.start();
    mediaRecorderRef.current = mr;
  }

  async function handleRecordingStop() {
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
    if (!said) { setStatus('missed'); return; }

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
    speak(reply, () => setStatus('idle'));
  }

  async function endCall() {
    speechSynthesis.cancel();
    setStarted(false);
    setIsRecording(false);
    setStatus('saving');

    const lastLine = [...transcript].reverse().find((t) => t.who === scenario.name)?.text || '';
    let outcome = 'incomplete';
    let casesOrdered = 0;
    if (/5 cases/i.test(lastLine)) { outcome = 'RP2_success'; casesOrdered = 5; }
    else if (/2 cases|trial/i.test(lastLine)) { outcome = 'RP1_success'; casesOrdered = 2; }
    else if (/next week|think/i.test(lastLine)) { outcome = 'WP1'; }
    else if (/call kar lunga|busy/i.test(lastLine)) { outcome = 'WP2'; }

    await fetch('/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        traineeName,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        transcript,
        outcome,
        casesOrdered,
        behaviourScore: 0,
      }),
    });
    setStatus('idle');
  }

  const statusLabel = {
    idle: 'Tap the mic to speak', listening: 'Listening…', transcribing: 'Transcribing…',
    thinking: `${scenario?.name || 'They'} is thinking…`, speaking: `${scenario?.name || 'They'} is speaking…`,
    saving: 'Saving session…', missed: "Didn't catch that — try again",
  }[status] || status;

  const ringClass = status === 'listening' ? 'ring-listen' : status === 'speaking' ? 'ring-speak' : status === 'thinking' ? 'ring-think' : '';

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
          <div className="field" style={{ maxWidth: 280, margin: '18px auto 0' }}>
            <label>Your name</label>
            <input className="input" value={traineeName} onChange={(e) => setTraineeName(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={startCall}>Start Call</button>
        </div>
      ) : (
        <div className="card call-stage">
          <div className={`avatar-circle ${ringClass}`}><span>{scenario.avatar_emoji}</span></div>
          <p className="call-status">{statusLabel}</p>
          <div className="call-controls">
            <button
              className={`fab-mic ${isRecording ? 'is-recording' : ''}`}
              onClick={toggleMic}
              disabled={status === 'thinking' || status === 'speaking'}
              aria-label="Toggle microphone"
            >
              {isRecording ? '■' : '🎤'}
            </button>
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