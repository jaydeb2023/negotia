import { useState, useRef } from 'react';
import { OPENING_LINE } from '../lib/guptaJiPrompt';

export default function Practice() {
  const [traineeName, setTraineeName] = useState('');
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [transcript, setTranscript] = useState([]); // [{who, text}]
  const [history, setHistory] = useState([]); // Groq-format messages
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  function addBubble(who, text) {
    setTranscript((t) => [...t, { who, text }]);
  }

  function speak(text, onEnd) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.onend = onEnd || (() => {});
    setStatus('Gupta Ji is speaking…');
    speechSynthesis.speak(utter);
  }

  async function startCall() {
    if (!traineeName.trim()) {
      alert('Enter your name first');
      return;
    }
    setStarted(true);
    setTranscript([]);
    setHistory([]);
    addBubble('Gupta Ji', OPENING_LINE);
    speak(OPENING_LINE, startListening);
  }

  async function startListening() {
    setStatus('Listening… (tap Stop when done speaking)');
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = handleRecordingStop;
    mr.start();
    mediaRecorderRef.current = mr;
  }

  function stopListening() {
    mediaRecorderRef.current?.stop();
  }

  async function handleRecordingStop() {
    setStatus('Transcribing…');
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
      setStatus('Didn\'t catch that — tap Speak to try again.');
      return;
    }
    addBubble('You', said);
    const newHistory = [...history, { role: 'user', content: said }];
    setHistory(newHistory);

    setStatus('Gupta Ji is thinking…');
    const cRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: newHistory }),
    });
    const cData = await cRes.json();
    const reply = cData.reply || 'Thik hai, aage boliye.';
    addBubble('Gupta Ji', reply);
    setHistory([...newHistory, { role: 'assistant', content: reply }]);
    speak(reply, () => setStatus('Tap Speak to reply'));
  }

  async function endCall() {
    speechSynthesis.cancel();
    setStarted(false);
    setStatus('Call ended. Saving…');

    // Simple heuristic outcome — replace with real scoring logic later.
    const lastGuptaLine = [...transcript].reverse().find((t) => t.who === 'Gupta Ji')?.text || '';
    let outcome = 'incomplete';
    let casesOrdered = 0;
    if (/5 cases/i.test(lastGuptaLine)) { outcome = 'RP2_success'; casesOrdered = 5; }
    else if (/2 cases/i.test(lastGuptaLine)) { outcome = 'RP1_success'; casesOrdered = 2; }
    else if (/next week/i.test(lastGuptaLine)) { outcome = 'WP1'; }
    else if (/push mat karo/i.test(lastGuptaLine)) { outcome = 'WP2'; }

    await fetch('/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        traineeName,
        transcript,
        outcome,
        casesOrdered,
        behaviourScore: 0, // placeholder until real scoring is built
      }),
    });
    setStatus('Saved. Tap Start Call to practice again.');
  }

  return (
    <div className="container">
      <h1>Gupta Ji — Voice Practice</h1>
      {!started && (
        <input
          className="input"
          placeholder="Your name"
          value={traineeName}
          onChange={(e) => setTraineeName(e.target.value)}
        />
      )}
      <p className="status">{status}</p>
      <div className="actions">
        {!started ? (
          <button className="primary" onClick={startCall}>Start Call</button>
        ) : (
          <>
            <button className="primary" onClick={startListening}>Speak</button>
            <button className="ghost" onClick={stopListening}>Stop</button>
            <button className="danger" onClick={endCall}>End Call</button>
          </>
        )}
      </div>
      <div className="transcript">
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
