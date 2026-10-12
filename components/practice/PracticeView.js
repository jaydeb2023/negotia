import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import Waveform from './Waveform';

// ---------- small helpers ----------
const STEPS = (name) => [
  'Press Start call and allow the microphone.',
  `${name} speaks first. Wait until you see “Your turn”.`,
  'Speak in Hindi or Hinglish, then pause for a second when you finish.',
  'End the call when he agrees, postpones or refuses.',
];

const TIPS = [
  'Start politely and introduce yourself.',
  'Ask questions to find his real concern before you pitch.',
  'Answer his concern with one clear benefit at a time.',
  'Offer a small first step (like a trial) instead of a big order.',
  'Confirm quantity and delivery before you end the call.',
];

const RESULT = {
  RP1_success: { tone: 'ok', title: 'Trial order won', win: true, line: (n) => `You convinced ${n} to start with a trial order. Next time, aim for a bigger first order.` },
  RP2_success: { tone: 'ok', title: 'Big order won', win: true, line: (n) => `Excellent. ${n} committed to a big order.` },
  WP1: { tone: 'warn', title: 'Dealer postponed', line: (n) => `${n} wants to think about it. Find his real concern, then offer a small first step.` },
  WP2: { tone: 'bad', title: 'Dealer declined', line: (n) => `${n} ended the call without an order. Listen first, then answer one concern at a time.` },
  incomplete: { tone: 'gray', title: 'Call not completed', line: () => 'We could not score this call. Wait until you see “Your turn”, then speak clearly.' },
};

function turnInfo(status, name, isRecording) {
  switch (status) {
    case 'listening':
      return { key: 'you', label: 'Your turn', sub: isRecording ? 'Speak now' : 'Getting your microphone ready…', mode: 'listen' };
    case 'speaking':
      return { key: 'wait', label: `${name} is speaking`, sub: 'Wait for him to finish', mode: 'speak' };
    case 'thinking':
      return { key: 'wait', label: `${name} is thinking`, sub: 'One moment…', mode: 'think' };
    case 'transcribing':
      return { key: 'wait', label: 'Processing what you said', sub: 'One moment…', mode: 'think' };
    case 'missed':
      return { key: 'you', label: "Didn't catch that", sub: 'Please say it again', mode: 'listen' };
    case 'error':
      return { key: 'wait', label: 'Something went wrong', sub: 'Listening again in a moment', mode: 'think' };
    case 'mic-denied':
      return { key: 'bad', label: 'Microphone is blocked', sub: '', mode: 'idle' };
    case 'mic-error':
      return { key: 'bad', label: 'Cannot reach the microphone', sub: '', mode: 'idle' };
    default:
      return { key: 'wait', label: 'Connecting…', sub: '', mode: 'idle' };
  }
}

const HINT = {
  you: 'Speak in Hindi or Hinglish. Pause for a second when you finish.',
  wait: 'Wait until he finishes. Then it is your turn.',
  bad: '',
};

function useElapsed(startedAt, running) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running || !startedAt) return undefined;
    const tick = () => setSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startedAt, running]);
  return sec;
}

export const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function Dots({ level }) {
  return (
    <span className="pr-dots" role="img" aria-label={`Difficulty ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= level ? 'on' : ''} />)}
    </span>
  );
}

function Bubbles({ rows, dealer }) {
  return (
    <>
      {rows.map((t, i) => {
        const me = t.who === 'You';
        return (
          <div key={i} className={`pr-bubble ${me ? 'me' : 'them'}`}>
            <small>{me ? 'You' : dealer}</small>
            {t.text}
          </div>
        );
      })}
    </>
  );
}

function ScoreRing({ score }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const tone = score >= 7 ? 'ok' : score >= 4 ? 'warn' : 'bad';
  return (
    <div className={`pr-ring ${tone}`} role="img" aria-label={`Behaviour score ${score} out of 10`}>
      <svg viewBox="0 0 100 100" width="112" height="112">
        <circle cx="50" cy="50" r={r} className="track" />
        <circle cx="50" cy="50" r={r} className="val" strokeDasharray={`${(c * score) / 10} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <b>{score}<span>/10</span></b>
    </div>
  );
}

// ---------- 1. BRIEFING (before the call) ----------
function Brief({ scenario, attempts, onStart, backHref }) {
  const name = scenario.name;
  return (
    <div className="pr">
      <Link href={backHref} className="pr-back"><Icon name="back" size={18} /> All dealers</Link>
      <div className="pr-brief">
        <div className="pr-col">
          <section className="pr-card pr-hero">
            <div className="pr-hero-top">
              <div className="pr-avatar" aria-hidden="true">{scenario.avatar_emoji}</div>
              <div>
                <div className="pr-eyebrow">PRACTICE CALL</div>
                <h2 className="pr-name">{name}</h2>
                <div className="pr-meta"><span className="pr-chip">Level {scenario.difficulty}</span><Dots level={Math.min(5, scenario.difficulty)} /></div>
                {scenario.tagline && <p className="pr-tag">{scenario.tagline}</p>}
              </div>
            </div>

            <div className="pr-mission">
              <div className="pr-eyebrow"><Icon name="target" size={15} /> YOUR MISSION</div>
              <p>
                Convince <b>{name}</b> to agree to an order. A small trial order counts as a win. Listen to his
                concerns, because pushing too hard usually backfires.
              </p>
            </div>

            <ul className="pr-ready" aria-label="Before you start">
              <li><Icon name="headphones" size={20} /><span><b>Use headphones</b> in a quiet place, so he does not hear himself.</span></li>
              <li><Icon name="mic" size={20} /><span><b>Allow the microphone</b> when your browser asks.</span></li>
              <li><Icon name="info" size={20} /><span>Works best in <b>Chrome or Edge</b>.</span></li>
            </ul>

            <div className="pr-cta-desktop">
              <button className="pr-btn gold lg" onClick={onStart}><Icon name="play" size={18} stroke={2.2} /> Start call</button>
            </div>
          </section>
        </div>

        <div className="pr-col">
          <section className="pr-card">
            <h3 className="pr-h3">How the call works</h3>
            <ol className="pr-steps">
              {STEPS(name).map((t) => <li key={t}>{t}</li>)}
            </ol>
          </section>

          <section className="pr-card">
            <h3 className="pr-h3">How you are scored</h3>
            <ul className="pr-score-list">
              <li><b>Outcome</b><span>Did the dealer agree? A trial order is a win.</span></li>
              <li><b>Behaviour score</b><span>How well you handled him, from 0 to 10.</span></li>
              <li><b>Feedback</b><span>Short advice on what to improve next.</span></li>
            </ul>
          </section>

          <section className="pr-card">
            <h3 className="pr-h3">Your record with {name}</h3>
            {attempts.count === 0 ? (
              <p className="pr-muted">No calls yet. Your first call is the hardest. Take it slowly.</p>
            ) : (
              <div className="pr-record">
                <div><b>{attempts.count}</b><span>{attempts.count === 1 ? 'call' : 'calls'}</span></div>
                <div><b>{attempts.wins}</b><span>{attempts.wins === 1 ? 'win' : 'wins'}</span></div>
                <div><b>{attempts.best === null ? '—' : `${attempts.best}/10`}</b><span>best score</span></div>
              </div>
            )}
          </section>

          <details className="pr-card pr-tips">
            <summary>Tips from the trainer</summary>
            <ul>{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          </details>
        </div>
      </div>

      <div className="pr-sticky">
        <button className="pr-btn gold lg block" onClick={onStart}><Icon name="play" size={18} stroke={2.2} /> Start call</button>
      </div>
    </div>
  );
}

// ---------- 2. LIVE CALL ----------
function Call({ scenario, status, isRecording, transcript, startedAt, levelRef, onEnd, onDone }) {
  const name = scenario.name;
  const sec = useElapsed(startedAt, true);
  const turn = turnInfo(status, name, isRecording);
  const chat = useRef(null);

  useEffect(() => {
    const el = chat.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [transcript.length]);

  const blocked = status === 'mic-denied' || status === 'mic-error';

  return (
    <div className="pr pr-call" data-turn={turn.key}>
      <section className="pr-stage" aria-label={`Call with ${name}`}>
        <div className="pr-stage-top">
          <span className="pr-live"><i /> On call</span>
          <span className="pr-timer" aria-label="Call time"><Icon name="clock" size={15} /> {fmtClock(sec)}</span>
        </div>

        <div className={`pr-orb ${turn.mode}`}>
          <span className="r1" /><span className="r2" />
          <div className="pr-orb-core" aria-hidden="true">{scenario.avatar_emoji}</div>
        </div>

        <div className="pr-who">
          <h2>{name}</h2>
          {scenario.tagline && <p>{scenario.tagline}</p>}
        </div>

        <div className={`pr-turn ${turn.key}`} role="status" aria-live="polite">
          <b>{turn.label}</b>
          {turn.sub && <span>{turn.sub}</span>}
        </div>

        {blocked ? (
          <div className="pr-blocked">
            {status === 'mic-denied' ? (
              <>
                <p><b>Your browser blocked the microphone.</b></p>
                <ol>
                  <li>Click the lock icon next to the web address.</li>
                  <li>Set Microphone to Allow.</li>
                  <li>Reload this page and start the call again.</li>
                </ol>
              </>
            ) : (
              <p>We could not reach your microphone. Check that it is plugged in and not used by another app, then end the call and try again.</p>
            )}
          </div>
        ) : (
          <>
            <Waveform mode={turn.mode} levelRef={levelRef} />
            <p className="pr-hint">{HINT[turn.key]}</p>
          </>
        )}
      </section>

      <section className="pr-chat" aria-label="Conversation">
        <header><Icon name="chat" size={17} /> Conversation</header>
        <div className="pr-chat-body" ref={chat}>
          <Bubbles rows={transcript} dealer={name} />
        </div>
      </section>

      <div className="pr-controls">
        <button className="pr-btn line" onClick={onDone} disabled={!isRecording} aria-hidden={!isRecording} tabIndex={isRecording ? 0 : -1}>
          <Icon name="check2" size={18} /> Done speaking
        </button>
        <button className="pr-btn red" onClick={onEnd}>
          <span style={{ display: 'inline-flex', transform: 'rotate(135deg)' }}><Icon name="phone" size={18} stroke={2} /></span> End call
        </button>
      </div>
    </div>
  );
}

// ---------- 3. SCORING ----------
function Scoring({ scenario, status }) {
  const steps = [
    ['Call ended', 'done'],
    ['Scoring your call', status === 'scoring' ? 'now' : 'done'],
    ['Saving your result', status === 'saving' ? 'now' : 'todo'],
  ];
  return (
    <div className="pr">
      <section className="pr-card pr-scoring" role="status" aria-live="polite">
        <div className="pr-spin" aria-hidden="true" />
        <h2 className="pr-h2">Reviewing your call with {scenario.name}</h2>
        <p className="pr-muted">This takes a few seconds.</p>
        <ul>
          {steps.map(([t, s]) => <li key={t} className={s}><i />{t}</li>)}
        </ul>
      </section>
    </div>
  );
}

// ---------- 4. RESULT ----------
function Result({ scenario, result, transcript, nextDealer, status, onStart, onRetrySave, backHref }) {
  const info = RESULT[result.outcome] || RESULT.incomplete;
  const name = scenario.name;
  const busy = status === 'saving';
  const scored = result.outcome !== 'incomplete';

  return (
    <div className="pr">
      <Link href={backHref} className="pr-back"><Icon name="back" size={18} /> All dealers</Link>
      <div className="pr-result">
        <div className="pr-col">
          <section className={`pr-card pr-banner ${info.tone}`}>
            <div className="pr-banner-ico"><Icon name={info.win ? 'trophy' : info.tone === 'gray' ? 'info' : 'target'} size={30} /></div>
            <div>
              <div className="pr-eyebrow">CALL RESULT · {name.toUpperCase()}</div>
              <h2 className="pr-title">{info.title}</h2>
              <p>{info.line(name)}</p>
            </div>
          </section>

          {scored && (
            <div className="pr-tiles">
              <div className="pr-card pr-tile"><ScoreRing score={result.behaviourScore} /><span>Behaviour score</span></div>
              <div className="pr-card pr-tile"><b className="big">{result.casesOrdered}</b><span>Cases ordered</span></div>
              <div className="pr-card pr-tile"><b className="big">{fmtClock(result.durationSec || 0)}</b><span>Call length</span></div>
            </div>
          )}

          <section className="pr-card">
            <h3 className="pr-h3">Coach feedback</h3>
            {result.feedback
              ? <p className="pr-feedback">{result.feedback}</p>
              : <p className="pr-muted">There is no written feedback for this call.</p>}
          </section>

          <details className="pr-card pr-replay">
            <summary>Read the conversation</summary>
            <div className="pr-replay-body"><Bubbles rows={transcript} dealer={name} /></div>
          </details>
        </div>

        <div className="pr-col">
          {result.outcome.endsWith('success') && nextDealer && (
            <section className="pr-card pr-levelup">
              <div className="pr-eyebrow"><Icon name="trophy" size={15} /> LEVEL UNLOCKED</div>
              <h3>{nextDealer.avatar_emoji} {nextDealer.name} is ready</h3>
              <p>A tougher dealer. Level {nextDealer.difficulty}.</p>
              <Link href={`/practice?scenario=${nextDealer.id}`} className="pr-btn gold block">Meet {nextDealer.name}</Link>
            </section>
          )}

          <section className="pr-card pr-actions">
            <button className="pr-btn navy block" onClick={onStart} disabled={busy}><Icon name="refresh" size={18} /> Try {name} again</button>
            <Link href={backHref} className="pr-btn line block">Back to all dealers</Link>
            <Link href="/app/history" className="pr-btn line block">My progress</Link>
          </section>

          <section className="pr-card pr-save">
            {result.saved ? (
              <p className="pr-saved"><Icon name="check2" size={18} color="#1C7C54" /> Saved to your progress.</p>
            ) : (
              <>
                <p className="pr-save-err"><Icon name="alert" size={18} /> Could not save this result: <b>{result.saveError}</b></p>
                <button className="pr-btn line sm" onClick={onRetrySave} disabled={busy}>{busy ? 'Saving…' : 'Retry saving'}</button>
              </>
            )}
          </section>
        </div>
      </div>

      <div className="pr-sticky">
        <button className="pr-btn navy lg block" onClick={onStart} disabled={busy}><Icon name="refresh" size={18} /> Try again</button>
      </div>
    </div>
  );
}

// ---------- the screen ----------
// phase: 'brief' | 'call' | 'scoring' | 'result'
export default function PracticeView(props) {
  const { phase, scenario } = props;
  if (phase === 'call') return <Call {...props} />;
  if (phase === 'scoring') return <Scoring scenario={scenario} status={props.status} />;
  if (phase === 'result' && props.result) return <Result {...props} />;
  return <Brief {...props} />;
}
