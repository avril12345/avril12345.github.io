/**
 * Shimmering star speckles behind the landing page. Pure CSS, rendered on the server:
 * each layer is one tiny dot whose box-shadows (positioned in vw/vh) are the stars, and
 * the layers twinkle by animating opacity only, so the compositor does all the work.
 * Seeded, so every build produces the same sky. Static under prefers-reduced-motion.
 */

// mulberry32: tiny deterministic PRNG
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAYERS = [
  // size px, stars, twinkle seconds, delay seconds
  { size: 1, count: 70, duration: 4.5, delay: 0 },
  { size: 1, count: 70, duration: 6, delay: -2.1 },
  { size: 1, count: 60, duration: 5.2, delay: -3.7 },
  { size: 1.5, count: 34, duration: 7, delay: -1.2 },
  { size: 1.5, count: 30, duration: 5.6, delay: -4.4 },
  { size: 2, count: 14, duration: 8, delay: -5.3 },
];

function layerShadows(count: number, rand: () => number) {
  return Array.from({ length: count }, () => {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 100).toFixed(2);
    return `${x}vw ${y}vh currentColor`;
  }).join(",");
}

export function Starfield() {
  const rand = rng(20261110);
  const layers = LAYERS.map((l) => ({ ...l, shadow: layerShadows(l.count, rand) }));
  // A few brighter stars with a soft glow that pulse on their own timings.
  const bright = Array.from({ length: 10 }, () => ({
    left: (rand() * 100).toFixed(2),
    top: (rand() * 85).toFixed(2),
    duration: (3.5 + rand() * 4).toFixed(2),
    delay: (-rand() * 8).toFixed(2),
  }));

  return (
    <div aria-hidden className="starfield">
      {layers.map((l, i) => (
        <span
          key={i}
          className="star-layer"
          style={{
            width: l.size,
            height: l.size,
            boxShadow: l.shadow,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
          }}
        />
      ))}
      {bright.map((s, i) => (
        <span
          key={`b${i}`}
          className="star-bright"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
