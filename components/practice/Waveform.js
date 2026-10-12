import { useEffect, useRef } from 'react';

const BARS = 32;

// Animated bars. In "listen" mode they follow the real microphone level (levelRef.current),
// updated directly on the DOM so React does not re-render 60 times a second.
// mode: 'listen' | 'speak' | 'think' | 'idle'
export default function Waveform({ mode, levelRef }) {
  const bars = useRef([]);

  useEffect(() => {
    const reset = () => bars.current.forEach((b) => b && (b.style.transform = ''));
    if (mode !== 'listen') {
      reset();
      return undefined;
    }
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let smooth = 0;
    const t0 = performance.now();
    const loop = (t) => {
      const level = Math.min(1, (levelRef?.current || 0) / 38); // rms 0..~38 -> 0..1
      smooth = smooth * 0.8 + level * 0.2;
      bars.current.forEach((b, i) => {
        if (!b) return;
        const wave = reduce ? 1 : 0.5 + 0.5 * Math.sin((t - t0) / 170 + i * 0.7);
        const h = 0.1 + smooth * (0.3 + 0.7 * wave);
        b.style.transform = `scaleY(${Math.min(1, h).toFixed(3)})`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      reset();
    };
  }, [mode, levelRef]);

  return (
    <div className={`pr-wave ${mode}`} aria-hidden="true">
      {Array.from({ length: BARS }, (_, i) => (
        <i key={i} ref={(el) => { bars.current[i] = el; }} style={{ '--i': i }} />
      ))}
    </div>
  );
}
