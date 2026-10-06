/*
 * Tiny deterministic motion helpers. Every sketch is a pure function of time,
 * the same way a Remotion composition is a function of the frame number.
 */
export const M = (() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const remap = (v, a, b) => clamp((v - a) / (b - a));

  // CSS-style cubic-bezier(x1, y1, x2, y2) -> f(x) = y
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = s => ((ax * s + bx) * s + cx) * s;
    const Y = s => ((ay * s + by) * s + cy) * s;
    const dX = s => (3 * ax * s + 2 * bx) * s + cx;
    const f = x => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let s = x;
      for (let i = 0; i < 8; i++) {
        const e = X(s) - x, d = dX(s);
        if (Math.abs(e) < 1e-6) return Y(s);
        if (Math.abs(d) < 1e-6) break;
        s -= e / d;
      }
      let lo = 0, hi = 1; s = x;
      for (let i = 0; i < 30; i++) {
        const v = X(s);
        if (Math.abs(v - x) < 1e-6) break;
        if (v < x) lo = s; else hi = s;
        s = (lo + hi) / 2;
      }
      return Y(s);
    };
    f.cp = [x1, y1, x2, y2];
    return f;
  }

  const ease = {
    linear: Object.assign(t => t, { cp: [0, 0, 1, 1] }),
    cssEase: bez(0.25, 0.1, 0.25, 1),       // the browser default
    inOut: bez(0.42, 0, 0.58, 1),           // "ease-in-out", the slideshow curve
    out: bez(0.16, 1, 0.3, 1),              // expo-ish out: fast arrival, long settle
    quint: bez(0.22, 1, 0.36, 1),
    snap: bez(0.7, 0, 0.1, 1),              // AE "graph-edited": slow start, whip, long tail
    whip: bez(0.85, 0, 0.15, 1),
    in: bez(0.55, 0, 1, 0.45),
  };

  // Damped spring from 0 to 1, closed form (deterministic, frame-exact).
  function spring({ k = 180, c = 14, m = 1, v0 = 0 } = {}) {
    const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
    return t => {
      if (t <= 0) return 0;
      if (z < 1) {
        const wd = w0 * Math.sqrt(1 - z * z);
        const A = 1, B = (z * w0 * A - v0) / wd;
        return 1 - Math.exp(-z * w0 * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
      }
      const B = w0 - v0;
      return 1 - Math.exp(-w0 * t) * (1 + B * t);
    };
  }

  // Keyframes: [[time, value, easeIntoThisKey?], ...]
  function kf(keys) {
    return t => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        const [t1, v1, e] = keys[i];
        if (t <= t1) {
          const [t0, v0] = keys[i - 1];
          const p = (t - t0) / (t1 - t0 || 1);
          return mix(v0, v1, (e || ease.inOut)(p));
        }
      }
      return keys[keys.length - 1][1];
    };
  }

  // Hold drawings for n frames at fps (n = 2 -> "on twos").
  const steps = (t, fps = 24, n = 2) => Math.floor((t * fps) / n) * n / fps;

  // Seeded PRNG + smooth 1D noise for hand-held drift and wobble.
  function rng(seed = 1) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function noise1(seed = 7) {
    const r = rng(seed), g = Array.from({ length: 256 }, () => r() * 2 - 1);
    return x => {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      const a = g[i & 255], b = g[(i + 1) & 255];
      return mix(a * f, b * (f - 1), u) * 2;
    };
  }

  const fmtTC = (t, fps = 24) => {
    const s = Math.floor(t), f = Math.floor((t - s) * fps);
    return `${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  };

  return { clamp, mix, remap, bez, ease, spring, kf, steps, rng, noise1, fmtTC };
})();
