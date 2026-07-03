import React, { useEffect, useRef } from 'react';

// Friendly goggle characters that gently float and drift toward the cursor.
// Purely decorative (pointer-events: none) but interactive via mouse parallax.

function Minion({ size, twoEyes }: { size: number; twoEyes?: boolean }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 64 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="9" y="6" width="46" height="84" rx="23" fill="#FFD63A" />
      {/* overalls */}
      <path d="M9 68 Q32 84 55 68 L55 80 Q32 95 9 80 Z" fill="#4C7FCB" />
      <rect x="22" y="62" width="6" height="14" rx="3" fill="#4C7FCB" />
      <rect x="36" y="62" width="6" height="14" rx="3" fill="#4C7FCB" />
      {/* goggle band */}
      <rect x="7" y="30" width="50" height="9" fill="#57575f" />
      {twoEyes ? (
        <>
          <circle cx="24" cy="34.5" r="11" fill="#9aa0aa" /><circle cx="40" cy="34.5" r="11" fill="#9aa0aa" />
          <circle cx="24" cy="34.5" r="7.5" fill="#fff" /><circle cx="40" cy="34.5" r="7.5" fill="#fff" />
          <circle cx="25.5" cy="34.5" r="3.3" fill="#5a4632" /><circle cx="38.5" cy="34.5" r="3.3" fill="#5a4632" />
          <circle cx="26.5" cy="33" r="1.1" fill="#fff" /><circle cx="39.5" cy="33" r="1.1" fill="#fff" />
        </>
      ) : (
        <>
          <circle cx="32" cy="34.5" r="14" fill="#9aa0aa" />
          <circle cx="32" cy="34.5" r="10" fill="#fff" />
          <circle cx="32" cy="34.5" r="4.5" fill="#5a4632" />
          <circle cx="33.6" cy="32.8" r="1.5" fill="#fff" />
        </>
      )}
      {/* smile */}
      <path d="M25 56 Q32 62 39 56" stroke="#5a4632" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const MINIONS = [
  { left: '6%', top: '18%', size: 46, depth: 1.4, dur: '6.5s', rot: '-8deg', twoEyes: false, opacity: 0.9 },
  { left: '84%', top: '14%', size: 60, depth: 2.2, dur: '8s', rot: '10deg', twoEyes: true, opacity: 0.95 },
  { left: '12%', top: '70%', size: 54, depth: 1.8, dur: '7.2s', rot: '6deg', twoEyes: true, opacity: 0.85 },
  { left: '78%', top: '72%', size: 42, depth: 1.2, dur: '6.8s', rot: '-12deg', twoEyes: false, opacity: 0.8 },
  { left: '46%', top: '8%', size: 34, depth: 0.9, dur: '9s', rot: '4deg', twoEyes: false, opacity: 0.7 },
  { left: '50%', top: '85%', size: 38, depth: 1.0, dur: '7.8s', rot: '-6deg', twoEyes: true, opacity: 0.75 },
];

export function MinionsBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        ref.current?.querySelectorAll<HTMLElement>('[data-depth]').forEach(n => {
          const depth = parseFloat(n.dataset.depth || '0');
          n.style.transform = `translate(${dx * depth * 36}px, ${dy * depth * 36}px)`;
        });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {MINIONS.map((m, i) => (
        <div key={i} data-depth={m.depth} className="absolute transition-transform duration-500 ease-out"
          style={{ left: m.left, top: m.top, opacity: m.opacity }}>
          <div className="minion-float" style={{ ['--dur' as any]: m.dur, ['--rot' as any]: m.rot, filter: 'drop-shadow(6px 10px 12px rgba(120,130,160,0.25))' }}>
            <Minion size={m.size} twoEyes={m.twoEyes} />
          </div>
        </div>
      ))}
    </div>
  );
}
