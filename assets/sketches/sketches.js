/*
 * persian-motion-director: the eight technique sketches.
 *
 * Every sketch is a factory: call it to get { duration, fps, still, mount(el), render(t) }.
 * mount() builds the DOM inside a stage element (16:9); render(t) draws the moment t
 * seconds into the loop. Nothing reads the clock, so the same code runs live in a page
 * (see gallery.html) and frame-exact inside Remotion (see ../remotion).
 *
 * Persian text is either live text in elements that keep letters joined, or outlines
 * shaped ahead of time with HarfBuzz (scripts/shape_persian.py -> glyphs.js), split into
 * letter bodies and dots.
 */
import { M } from './engine.js';
import { GLYPHS } from './glyphs.js';

let uidCount = 0;
const uid = (p) => `pmd-${p}-${++uidCount}-`;

const SVGNS = 'http://www.w3.org/2000/svg';
const h = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
};
const svgStage = (stage, bg) => {
  const svg = h('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid slice' });
  h('rect', { width: 1600, height: 900, fill: bg }, svg);
  stage.appendChild(svg);
  return svg;
};

/* Words in logical order from shaped glyphs (glyphs arrive in visual order, LTR). */
function wordsOf(run) {
  const words = [];
  let cur = [];
  for (let i = run.g.length - 1; i >= 0; i--) {   // walk right -> left = logical order
    const g = run.g[i];
    if (!g[4] && !g[5].length) { if (cur.length) words.push(cur); cur = []; continue; }
    cur.push(i);
  }
  if (cur.length) words.push(cur);
  return words;
}

/* Shaped phrase with per-word RTL wipes. Glyph 0 is the leftmost glyph (the period). */
function buildPhrase(defs, parent, run, { S, x0, base, fill, id, splitPeriod = false }) {
  const g = h('g', { transform: `translate(${x0} ${base}) scale(${S} ${-S})` }, parent);
  const words = wordsOf(run).map((idxs, wi) => {
    const own = splitPeriod ? idxs.filter(i => i !== 0) : idxs;
    const xs = own.map(i => run.g[i][0]), xe = own.map(i => run.g[i][0] + run.g[i][2]);
    const a = Math.min(...xs) - 80, b = Math.max(...xe) + 80;
    const clip = h('clipPath', { id: `${id}w${wi}` }, defs);
    const rect = h('rect', { x: a, y: -1500, width: b - a, height: 4200 }, clip);
    const wg = h('g', { 'clip-path': `url(#${id}w${wi})` }, g);
    const body = h('g', {}, wg);
    own.forEach(i => {
      const [gx, gy, , , d, ds] = run.g[i];
      const all = [d, ...ds].filter(Boolean).join(' ');
      if (all) h('path', { d: all, transform: `translate(${gx} ${gy})`, fill }, body);
    });
    return { rect, body, a, b };
  });
  let period = null;
  if (splitPeriod) {
    const [gx, gy, , , d] = run.g[0];
    period = h('path', { d, transform: `translate(${gx} ${gy})`, fill }, g);
  }
  // in: 0..1 per word (logical order), out: 0..1 per word
  const set = (pin, pout = () => 0) => words.forEach((w, i) => {
    const vi = pin(i), vo = pout(i), wd = w.b - w.a;
    const vis = wd * vi, cut = wd * vo;
    w.rect.setAttribute('x', w.b - vis);
    w.rect.setAttribute('width', Math.max(0, vis - cut));
    w.body.setAttribute('transform', `translate(${(1 - vi) * 300} 0)`);
  });
  // period centre in stage coordinates
  const pc = () => {
    const [gx, gy, , , , , ] = run.g[0];
    return { x: x0 + S * (gx + 305), y: base - S * (gy + 168), r: S * 174 };
  };
  return { g, set, period, pc, words };
}

/* Nuqta: letter bodies arrive first, right to left; dots drop in after. */
const nuqta = () => {
  const U = uid('nuqta');
  const run = GLYPHS.nuqta, S = 1180 / run.w, X0 = (1600 - 1180) / 2, BASE = 520;
  const INK = 'var(--ink)', PAPER = 'var(--paper)';
  let words, wordEls = [], dots = [], group;
  const r = M.rng(11);
  const duration = 5.2;

  function mount(stage) {
    const svg = svgStage(stage, PAPER);
    const defs = h('defs', {}, svg);
    group = h('g', {}, svg);
    const inner = h('g', { transform: `translate(${X0} ${BASE}) scale(${S} ${-S})` }, group);
    words = wordsOf(run);
    words.forEach((idxs, wi) => {
      const xs = idxs.map(i => run.g[i][0]), xe = idxs.map(i => run.g[i][0] + run.g[i][2]);
      const x0 = Math.min(...xs) - 60, x1 = Math.max(...xe) + 60;
      const clip = h('clipPath', { id: `${U}w${wi}` }, defs);
      const rect = h('rect', { x: x0, y: -1400, width: x1 - x0, height: 4000 }, clip);
      const wg = h('g', { 'clip-path': `url(#${U}w${wi})` }, inner);
      const body = h('g', {}, wg);
      idxs.forEach(i => {
        const [gx, gy, , , d] = run.g[i];
        if (d) h('path', { d, transform: `translate(${gx} ${gy})`, fill: INK }, body);
      });
      wordEls.push({ rect, body, x0, x1 });
      idxs.forEach(i => {
        const [gx, gy, , , , ds, bs] = run.g[i];
        ds.forEach((d, k) => {
          const b = bs[k];
          const g = h('g', {}, inner);
          const p = h('path', { d, fill: INK }, g);
          const above = (b[1] + b[3]) / 2 > 300;
          dots.push({ g, p, gx, gy, b, above, word: wi, x: gx + (b[0] + b[2]) / 2 });
        });
      });
    });
    // dots land right -> left, with a little human jitter
    dots.sort((a, b) => b.x - a.x).forEach((d, i) => { d.delay = i * 0.055 + (r() - 0.5) * 0.03; });
  }

  const reveal = (t, start) => M.ease.out(M.remap(t, start, start + 0.75));
  const hide = (t, start) => M.ease.snap(M.remap(t, start, start + 0.6));

  function render(t) {
    const breathe = 1 + 0.014 * M.ease.inOut(M.remap(t, 1.6, 4.4));
    group.setAttribute('transform', `translate(800 450) scale(${breathe}) translate(-800 -450)`);
    wordEls.forEach((w, wi) => {
      const pin = reveal(t, 0.12 + wi * 0.24);
      const pout = hide(t, 4.25 + wi * 0.1);
      const width = w.x1 - w.x0;
      // RTL wipe: grow from the right edge leftward, then exit leftward
      const vis = width * pin;
      const cut = width * pout;
      w.rect.setAttribute('x', w.x1 - vis);
      w.rect.setAttribute('width', Math.max(0, vis - cut));
      w.body.setAttribute('transform', `translate(${(1 - pin) * 260} 0)`);
    });
    const fallStart = 0.95;
    for (const d of dots) {
      const t0 = fallStart + d.delay, T = 0.26;
      const lt = t - t0;
      let y = 0, sx = 1, sy = 1, op = 1;
      const H = d.above ? 1500 : -1150;      // font units, y-up
      if (lt < 0) { op = 0; }
      else if (lt < T) {                      // accelerate like it's dropped
        const p = lt / T;
        y = H * (1 - p * p);
        op = M.clamp(p * 3);
        sy = 1 + 0.25 * p; sx = 1 - 0.12 * p; // stretch on the way down
      } else {                                // squash on landing, settle
        const u = lt - T;
        const k = Math.exp(-u * 16) * Math.cos(u * 34);
        sy = 1 - 0.34 * k; sx = 1 + 0.26 * k;
        y = (d.above ? 1 : -1) * 70 * Math.max(0, Math.sin(Math.min(1, u / 0.16) * Math.PI)) * Math.exp(-u * 6);
      }
      // exit: dots leave first, lifting away
      const e = M.ease.in(M.remap(t, 4.0 + (1 - d.x / run.w) * 0.25, 4.3 + (1 - d.x / run.w) * 0.25));
      y += (d.above ? 1 : -1) * 900 * e; op *= 1 - e;
      const ax = (d.b[0] + d.b[2]) / 2, ay = d.above ? d.b[1] : d.b[3];
      d.g.setAttribute('transform',
        `translate(${d.gx} ${d.gy + y}) translate(${ax} ${ay}) scale(${sx} ${sy}) translate(${-ax} ${-ay})`);
      d.g.setAttribute('opacity', op.toFixed(3));
    }
  }
  return { duration, fps: 24, still: 2.4, mount, render };
};

/* Kashida: the joining stroke between م and س is pulled out like a pen stroke,
   measured in rhombic dots (the calligrapher's unit), then springs back. */
const kashida = () => {
  const U = uid('kashida');
  const run = GLYPHS.hermes, bar = GLYPHS.kashida.g[1];   // tatweel glyph: a baseline bar
  const barD = bar[4];                                     // M-20 289V0H585V289H-20Z at wght 800
  const S = 0.105, BASE = 560, DOT = 330, MAXL = 3300;
  const duration = 4.8;
  let svg, word, left, right, barEl, ruler = [], rulerG;

  function mount(stage) {
    svg = svgStage(stage, 'var(--ink)');
    word = h('g', {}, svg);
    const inner = h('g', { transform: `scale(${S} ${-S})` }, word);
    left = h('g', {}, inner);   // س (visual index 0)
    right = h('g', {}, inner);  // م ر ه
    run.g.forEach((g, i) => {
      const [gx, gy, , , d] = g;
      h('path', { d, transform: `translate(${gx} ${gy})`, fill: 'var(--paper)' }, i === 0 ? left : right);
    });
    barEl = h('rect', { y: 0, height: 289, fill: 'var(--paper)' }, inner);
    rulerG = h('g', {}, inner);
    for (let i = 0; i < 12; i++) {
      const s = 150;
      ruler.push(h('path', { d: `M0 ${-s}L${s} 0L0 ${s}L${-s} 0Z`, fill: 'var(--spot)' }, rulerG));
    }
  }

  // pull: slow start, decisive middle, long settle. release: spring back with a little overshoot.
  const pull = M.bez(0.65, 0, 0.12, 1);
  const back = M.spring({ k: 210, c: 15 });

  function render(t) {
    let L;
    if (t < 0.5) L = 0;
    else if (t < 2.0) L = MAXL * pull(M.remap(t, 0.5, 2.0));
    else if (t < 3.3) L = MAXL;
    else L = MAXL * (1 - back(t - 3.3));
    const sx = run.g[0][2];                 // س advance: the joint sits at x = sx
    const W = run.w + L;
    const x0 = (1600 - W * S) / 2;
    word.setAttribute('transform', `translate(${x0} ${BASE})`);
    right.setAttribute('transform', `translate(${L} 0)`);
    barEl.setAttribute('x', sx - 20);
    barEl.setAttribute('width', Math.max(0, L + 40));
    const n = Math.floor((L + 1) / DOT);
    ruler.forEach((p, i) => {
      const on = i < n;
      const age = on ? M.clamp((L - i * DOT) / DOT) : 0;
      const sc = on ? 0.6 + 0.4 * M.ease.out(age) : 0;
      p.setAttribute('transform', `translate(${sx + DOT * (i + 0.5)} -700) scale(${sc})`);
      p.setAttribute('opacity', on ? 1 : 0);
    });
  }
  return { duration, fps: 24, still: 2.6, mount, render };
};

/* On twos + line boil: every drawing holds for 2 frames at 24 fps and its lines
   re-wobble 12 times a second (3 cycling seeds, like redrawn cels). The camera
   drift stays smooth, which is how hand-drawn work sits inside a modern edit. */
const boil = () => {
  const U = uid('boil');
  const duration = 5.0;
  let cam, turb, plane, trail, speed, word, under, underLen, clipR, tw = 0, tl = 0;
  const uidb = U;
  const P = u => {                        // flight path: right -> left, one loop, glide down
    const x = 1720 - 1330 * u;
    const loopC = 0.42, k = Math.exp(-Math.pow((u - loopC) / 0.085, 2));
    const a = (u - loopC) * 37;
    return {
      x: x + k * 120 * Math.sin(a),
      y: 300 - 120 * Math.sin(u * Math.PI * 0.9) + 210 * u * u - k * 120 * (1 - Math.cos(a)),
    };
  };
  function mount(stage) {
    const svg = svgStage(stage, 'var(--paper)');
    const defs = h('defs', {}, svg);
    const f = h('filter', { id: uidb, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    turb = h('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.022', numOctaves: 2, seed: 1, result: 'n' }, f);
    h('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 6, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
    const clip = h('clipPath', { id: uidb + 'c' }, defs);
    clipR = h('rect', { x: 0, y: 0, width: 0, height: 900 }, clip);
    cam = h('g', {}, svg);
    const drawn = h('g', { filter: `url(#${uidb})` }, cam);
    trail = h('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-dasharray': '3 22', 'stroke-linecap': 'round' }, drawn);
    speed = h('g', { stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' }, drawn);
    [0, 1, 2].forEach(i => h('line', { x1: 0, y1: (i - 1) * 26, x2: 70 + i * 18, y2: (i - 1) * 26 }, speed));
    plane = h('g', {}, drawn);
    const s = { fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 6, 'stroke-linejoin': 'round' };
    h('path', { d: 'M-120 0 L100 -70 L30 10 Z', ...s }, plane);
    h('path', { d: 'M-120 0 L30 10 L-10 66 Z', ...s }, plane);
    h('path', { d: 'M30 10 L100 -70', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 5 }, plane);
    const tg = h('g', { 'clip-path': `url(#${uidb}c)` }, drawn);
    word = h('text', { x: 860, y: 690, 'text-anchor': 'middle', direction: 'rtl', class: 'svg-fa', 'font-size': 128, 'font-weight': 800, fill: 'var(--ink)' }, tg);
    word.textContent = 'پیامت رسید.';
    under = h('path', { fill: 'none', stroke: 'var(--spot)', 'stroke-width': 9, 'stroke-linecap': 'round' }, drawn);
  }
  function measure() {
    if (tw) return;
    const b = word.getBBox();
    if (b.width > 10) { tw = b.width; tl = b.x; }
    const x1 = tl + tw, x0 = tl;
    under.setAttribute('d', `M${x1} 740 C ${x1 - tw * 0.3} 728, ${x0 + tw * 0.55} 756, ${x0 + tw * 0.2} 742 S ${x0 - 10} 736, ${x0 - 20} 744`);
    underLen = under.getTotalLength ? under.getTotalLength() : tw;
    under.setAttribute('stroke-dasharray', underLen);
  }
  function render(t) {
    measure();
    cam.setAttribute('transform', `translate(800 450) scale(${1 + 0.025 * t / duration}) translate(${-800 + 10 * Math.sin(t * 0.8)} -450)`);
    const ts = M.steps(t, 24, 2);                   // drawings on twos
    turb.setAttribute('seed', 1 + (Math.floor(ts * 12) % 3));
    const u = M.bez(0.3, 0, 0.35, 1)(M.remap(ts, 0.25, 2.55));
    const p = P(u), q = P(Math.max(0, u - 0.008));
    const ang = Math.atan2(p.y - q.y, p.x - q.x) * 180 / Math.PI + 180;
    const v = Math.hypot(p.x - q.x, p.y - q.y);
    const out = M.remap(ts, 4.3, 4.6);
    plane.setAttribute('transform', `translate(${p.x} ${p.y - 40 * out}) rotate(${u > 0 ? ang : 0}) scale(${1 - 0.15 * out})`);
    plane.setAttribute('opacity', (1 - out).toFixed(2));
    speed.setAttribute('transform', `translate(${p.x + 140} ${p.y}) rotate(${u > 0 ? ang : 0} -140 0)`);
    speed.setAttribute('opacity', v > 9 && u < 0.95 ? 1 : 0);
    let d = '';
    const n = Math.floor(u * 90);
    for (let i = 0; i <= n; i++) { const r = P(i / 90); d += `${i ? 'L' : 'M'}${r.x.toFixed(1)} ${r.y.toFixed(1)}`; }
    trail.setAttribute('d', d);
    trail.setAttribute('opacity', (1 - M.remap(ts, 3.6, 4.2)).toFixed(2));
    // words wipe in right to left, on twos
    const wi = M.remap(ts, 2.35, 2.9), wo = M.remap(ts, 4.35, 4.75);
    const x1 = (tl + tw) || 1300, w = tw || 900;
    clipR.setAttribute('x', x1 + 30 - (w + 60) * wi);
    clipR.setAttribute('width', Math.max(0, (w + 60) * (wi - wo)));
    const ul = M.ease.out(M.remap(ts, 2.95, 3.5));
    under.setAttribute('stroke-dashoffset', ((underLen || 1) * (1 - ul)).toFixed(1));
    under.setAttribute('opacity', (1 - wo).toFixed(2));
  }
  return { duration, fps: 24, still: 3.7, mount, render };
};

/* Match cut: the full stop grows into Hermes' reply bubble, then shrinks into
   the full stop of the next line. No cut, no fade-to-black. */
const match = () => {
  const U = uid('match');
  const duration = 6.2, S = 0.074;
  let A, B, D, cam, blob, typing, tick, tickLen, bubbleG, tail;
  function mount(stage) {
    const svg = svgStage(stage, 'var(--paper)');
    const defs = h('defs', {}, svg);
    cam = h('g', {}, svg);
    A = buildPhrase(defs, cam, GLYPHS.sendA, { S, x0: (1600 - GLYPHS.sendA.w * S) / 2, base: 482, fill: 'var(--ink)', id: U + 'mA', splitPeriod: true });
    B = buildPhrase(defs, cam, GLYPHS.restB, { S, x0: (1600 - GLYPHS.restB.w * S) / 2, base: 482, fill: 'var(--ink)', id: U + 'mB', splitPeriod: true });
    bubbleG = h('g', {}, svg);
    tail = h('path', { d: 'M0 0 L46 0 L0 40 Z', fill: 'var(--ink)' }, bubbleG);
    blob = h('rect', { fill: 'var(--ink)' }, bubbleG);
    typing = [0, 1, 2].map(i => h('circle', { r: 13, fill: 'var(--paper)' }, bubbleG));
    D = buildPhrase(defs, bubbleG, GLYPHS.done, { S: 0.06, x0: 800 - GLYPHS.done.w * 0.06 / 2 + 40, base: 488, fill: 'var(--paper)', id: U + 'mD' });
    tick = h('path', { d: 'M0 0 L22 22 L62 -26', fill: 'none', stroke: 'var(--paper)', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bubbleG);
    tickLen = 31 + 62.5;
    tick.setAttribute('stroke-dasharray', tickLen);
  }

  const grow = M.bez(0.75, 0, 0.2, 1), settle = M.spring({ k: 260, c: 20 });
  const shrink = M.bez(0.6, 0, 0.15, 1);

  function render(t) {
    const pa = A.pc(), pb = B.pc();
    // sentence A in, then pushed aside as the camera follows the dot
    A.set(i => M.ease.out(M.remap(t, 0.1 + i * 0.18, 0.8 + i * 0.18)));
    const aOut = M.ease.snap(M.remap(t, 1.35, 1.95));
    A.g.parentNode === cam && A.g.setAttribute('opacity', 1 - aOut);
    A.g.setAttribute('transform', `translate(${(1600 - GLYPHS.sendA.w * S) / 2 + 220 * aOut} 482) scale(${S} ${-S})`);
    A.period.setAttribute('opacity', t < 1.3 && t > 0.7 ? 1 : 0);
    A.period.setAttribute('transform', `translate(0 0) scale(${M.ease.out(M.remap(t, 0.7, 0.95))})`);
    // B arrives as the dot lands, leaves at the end of the loop
    B.set(i => M.ease.out(M.remap(t, 3.95 + i * 0.15, 4.6 + i * 0.15)),
          i => M.ease.snap(M.remap(t, 5.6 + i * 0.08, 6.1 + i * 0.08)));
    B.period.setAttribute('opacity', t > 4.42 && t < 5.75 ? 1 : 0);

    // the travelling shape: x, y, w, h, rx
    let x = pa.x, y = pa.y, w = pa.r * 2, hh = pa.r * 2, op = 0;
    if (t >= 1.3 && t < 1.45) {                     // anticipation: dip + squash
      const p = M.ease.inOut(M.remap(t, 1.3, 1.45));
      y = pa.y + 9 * p; w = pa.r * 2 * (1 + 0.25 * p); hh = pa.r * 2 * (1 - 0.2 * p); op = 1;
    } else if (t >= 1.45 && t < 3.72) {
      op = 1;
      const g1 = grow(M.remap(t, 1.45, 2.05));       // fly + grow as a circle
      const d = 26 + (380 - 26) * g1;
      x = M.mix(pa.x, 800, g1); y = M.mix(pa.y + 9, 450, g1) - 140 * Math.sin(Math.PI * g1);
      w = hh = d;
      const g2 = settle(t - 1.95);                   // circle -> bubble, with overshoot
      if (t > 1.95) { w = 380 + (900 - 380) * g2; hh = 380; }
    } else if (t >= 3.72 && t < 4.45) {              // bubble -> circle -> full stop of B
      op = 1;
      const s1 = M.ease.inOut(M.remap(t, 3.72, 3.92));
      w = M.mix(900, 380, s1); hh = 380;
      const s2 = shrink(M.remap(t, 3.88, 4.45));
      const dd = M.mix(380, pb.r * 2, s2);
      if (t > 3.88) { w = Math.min(w, dd); hh = dd; }
      x = M.mix(800, pb.x, s2); y = M.mix(450, pb.y, s2) - 120 * Math.sin(Math.PI * s2);
    }
    const rx = Math.min(w, hh) / 2 * (t > 1.95 && t < 3.9 ? M.mix(1, 0.34, M.clamp(w / 900 * 1.4 - 0.4)) : 1);
    blob.setAttribute('x', x - w / 2); blob.setAttribute('y', y - hh / 2);
    blob.setAttribute('width', Math.max(0, w)); blob.setAttribute('height', Math.max(0, hh));
    blob.setAttribute('rx', rx);
    blob.setAttribute('opacity', op);
    const tailOn = M.ease.out(M.remap(t, 2.25, 2.45)) * (1 - M.remap(t, 3.65, 3.75));
    tail.setAttribute('transform', `translate(${800 - 450 + 70} ${450 + 190 - 2}) scale(${tailOn})`);
    // typing dots, then the reply
    const typingOn = t > 2.3 && t < 3.0;
    typing.forEach((c, i) => {
      const b = Math.max(0, Math.sin((t - 2.3) * 9 - i * 0.9));
      c.setAttribute('cx', 830 - i * 46); c.setAttribute('cy', 452 - 14 * b);
      c.setAttribute('opacity', typingOn ? 1 : 0);
    });
    const rIn = (i) => M.ease.out(M.remap(t, 3.0 + i * 0.14, 3.5 + i * 0.14));
    const rOut = () => M.remap(t, 3.62, 3.72);
    D.set(rIn, rOut);
    D.g.setAttribute('opacity', t > 2.95 && t < 3.74 ? 1 : 0);
    const tk = M.ease.out(M.remap(t, 3.25, 3.55));
    tick.setAttribute('transform', `translate(${800 - GLYPHS.done.w * 0.06 / 2 - 60} 470)`);
    tick.setAttribute('stroke-dashoffset', tickLen * (1 - tk));
    tick.setAttribute('opacity', t > 3.2 && t < 3.72 ? 1 : 0);
    // a gentle camera push the whole time
    cam.setAttribute('transform', `translate(800 450) scale(${1 + 0.02 * Math.sin(t / duration * Math.PI)}) translate(-800 -450)`);
  }
  return { duration, fps: 60, still: 3.45, mount, render };
};

/* One continuous camera: scenes live on one long strip (laid out right to left),
   and every "transition" is the camera travelling: anticipation, whip, motion blur,
   parallax layers, settle. The last scene is the first one again, so it loops. */
const oner = () => {
  const U = uid('oner');
  const D = 2400, duration = 6.9;
  const MOVES = [1.35, 3.6, 5.85], MT = 0.72;
  const move = M.bez(0.62, -0.18, 0.18, 1.04);   // small anticipation, whip, tiny overshoot
  let world, blurF, layers = [], cards = [], ring, ringLen;

  function text(parent, str, x, y, size, weight, extra = {}) {
    const el = h('text', { x, y, 'text-anchor': 'middle', direction: 'rtl', class: 'svg-fa', 'font-size': size, 'font-weight': weight, fill: 'var(--ink)', ...extra }, parent);
    el.textContent = str; return el;
  }
  function scene(k, f) {
    const g = h('g', {}, world);
    layers.push({ g, k, f });
    return g;
  }
  function wordmark(parent) {
    const run = GLYPHS.hermes, S = 0.115;
    const g = h('g', { transform: `translate(${800 - run.w * S / 2} 470) scale(${S} ${-S})` }, parent);
    run.g.forEach(([gx, gy, , , d, ds]) => { const all = [d, ...ds].filter(Boolean).join(' '); if (all) h('path', { d: all, transform: `translate(${gx} ${gy})`, fill: 'var(--ink)' }, g); });
  }
  function mount(stage) {
    const svg = svgStage(stage, 'var(--paper)');
    const defs = h('defs', {}, svg);
    const f = h('filter', { id: U + 'blur', x: '-20%', y: '-5%', width: '140%', height: '110%' }, defs);
    blurF = h('feGaussianBlur', { stdDeviation: '0 0' }, f);
    world = h('g', { filter: `url(#${U}blur)` }, svg);
    [0, 3].forEach(k => {                               // scene 1 and its loop twin
      h('circle', { cx: 1140, cy: 290, r: 330, fill: 'var(--ink)', opacity: 0.05 }, scene(k, 0.5));
      const m = scene(k, 1);
      wordmark(m);
      text(m, 'دستیار همیشه بیدار', 800, 575, 44, 400);
      const fg = scene(k, 1.4);
      [0, 1, 2].forEach(i => h('circle', { cx: 330 + i * 34, cy: 700, r: 9, fill: 'var(--spot)' }, fg));
    });
    // scene 2: memory
    h('rect', { x: 150, y: 120, width: 700, height: 520, rx: 40, fill: 'var(--ink)', opacity: 0.05 }, scene(1, 0.5));
    text(scene(1, 1), 'یادش می‌ماند', 800, 300, 96, 800);
    const cg = scene(1, 1.3);
    [[-260, -6], [0, 2], [260, 7]].forEach(([dx, rot], i) => {
      const c = h('g', {}, cg);
      h('rect', { x: -170, y: -100, width: 340, height: 200, rx: 18, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 4 }, c);
      [0, 1, 2].forEach(j => h('rect', { x: -120, y: -52 + j * 42, width: j === 2 ? 140 : 240, height: 14, rx: 7, fill: 'var(--ink)', opacity: 0.8, transform: 'scale(-1 1)' }, c));
      cards.push({ c, dx, rot, i });
    });
    // scene 3: always on
    h('circle', { cx: 520, cy: 560, r: 300, fill: 'var(--ink)', opacity: 0.05 }, scene(2, 0.5));
    const m3 = scene(2, 1);
    text(m3, '۲۴', 960, 560, 300, 800);
    text(m3, 'ساعته', 560, 560, 110, 700);
    const r3 = scene(2, 1.25);
    ring = h('circle', { cx: 960, cy: 455, r: 250, fill: 'none', stroke: 'var(--spot)', 'stroke-width': 10, 'stroke-linecap': 'round', transform: 'rotate(-90 960 455)' }, r3);
    ringLen = 2 * Math.PI * 250;
    ring.setAttribute('stroke-dasharray', ringLen);
  }
  function camAt(t) {
    let x = 0;
    MOVES.forEach(m => { x += move(M.remap(t, m, m + MT)); });
    return -x * D;                                   // camera travels left
  }
  function render(t) {
    const camX = camAt(t), v = (camX - camAt(t - 1 / 60)) * 60;
    const speed = Math.abs(v) / D;                     // scenes per second
    let dip = 0;
    MOVES.forEach(m => { dip = Math.max(dip, Math.sin(Math.PI * M.remap(t, m, m + MT))); });
    const sc = 1 - 0.06 * dip, lean = -1.2 * Math.sign(v) * Math.min(1, speed / 3);
    const drift = 6 * Math.sin(t * 1.3);
    world.setAttribute('transform', `translate(800 450) rotate(${lean}) scale(${sc}) translate(-800 -450)`);
    blurF.setAttribute('stdDeviation', `${Math.min(36, speed * 7).toFixed(2)} 0`);
    for (const L of layers) {
      const off = (-L.k * D - camX) * -1;               // scene k sits k*D to the left
      L.g.setAttribute('transform', `translate(${(-off * L.f + drift * L.f).toFixed(2)} 0)`);
    }
    cards.forEach(({ c, dx, rot, i }) => {
      const bob = 8 * Math.sin(t * 1.6 + i * 1.7);
      c.setAttribute('transform', `translate(${800 + dx} ${620 + bob}) rotate(${rot + Math.sin(t + i) * 1.2})`);
    });
    const p = (t % 2.25) / 2.25;
    ring.setAttribute('stroke-dashoffset', ringLen * (1 - M.ease.inOut(p)));
  }
  return { duration, fps: 60, still: 0.6, mount, render };
};

/* Cut on the beat: hard cuts on every beat (120 BPM), no fades. Each cut lands
   slightly punched-in and settles; off-beats get small accents. */
const beat = () => {
  const U = uid('beat');
  const BPM = 120, BEAT = 60 / BPM, N = 8, duration = BEAT * N;
  const FR = [
    { html: '<span style="font-weight:900">هرمس</span>', size: 26, inv: false, pos: 'c' },
    { html: 'می‌خواند', size: 7, inv: true, pos: 'tr' },
    { html: '<span style="font-weight:900">می‌نویسد</span>', size: 44, inv: false, pos: 'bleed' },
    { html: 'می‌فرستد<br>می‌فرستد<br>می‌فرستد', size: 11, inv: false, pos: 'stack' },
    { html: 'یادش <span style="font-weight:900">می‌ماند</span>', size: 13, inv: true, pos: 'c' },
    { html: 'همیشه', size: 20, inv: false, pos: 'c', flick: true },
    { html: 'بیدار', size: 20, inv: false, pos: 'c', flick: true },
    { html: '<span style="font-weight:900">هرمس</span>', size: 9, inv: true, pos: 'bl' },
  ];
  let frames = [], ticks = [], acc;
  function mount(stage) {
    const root = document.createElement('div');
    root.className = 'beat-root';
    FR.forEach(f => {
      const d = document.createElement('div');
      d.className = `beat-fr beat-${f.pos}` + (f.inv ? ' inv' : '');
      d.innerHTML = `<p dir="rtl" lang="fa" style="font-size:${f.size}cqw">${f.html}</p>`;
      root.appendChild(d); frames.push(d);
    });
    acc = document.createElement('i'); acc.className = 'beat-acc'; root.appendChild(acc);
    const tk = document.createElement('div'); tk.className = 'beat-ticks';
    for (let i = 0; i < N; i++) { const s = document.createElement('i'); tk.appendChild(s); ticks.push(s); }
    root.appendChild(tk);
    stage.appendChild(root);
  }
  function render(t) {
    const b = Math.floor(t / BEAT) % N, u = (t % BEAT) / BEAT;
    frames.forEach((f, i) => { f.hidden = i !== b; });
    const f = frames[b], spec = FR[b];
    const punch = 1 + 0.07 * (1 - M.ease.out(M.remap(u, 0, 0.45)));
    f.style.transform = `scale(${punch.toFixed(4)})`;
    if (spec.flick) {
      const p = f.querySelector('p');
      p.style.fontVariationSettings = `'wght' ${u < 0.5 ? 300 : 900}`;
    }
    // off-beat accent: a bar that snaps across on the "and"
    const a = M.remap(u, 0.5, 0.62);
    acc.style.opacity = u > 0.5 && u < 0.7 ? 1 : 0;
    acc.style.transform = `translateX(${(-a * 100).toFixed(1)}%)`;
    ticks.forEach((s, i) => s.classList.toggle('on', i === b));
    frames[b].parentNode.classList.toggle('dark', !!spec.inv);
  }
  return { duration, fps: 24, still: 0.3, mount, render };
};

/* Product UI in space: the real interface, set in 3D, with a camera dolly, a
   cursor that moves on a curve and squashes on click, and a focus pull to the
   task log behind it. RTL UI: window controls and the user's bubbles sit right. */
const ui = () => {
  const U = uid('ui');
  const duration = 6.4;
  let root, scene, win, log, cursor, btn, ripple, mine, typing, reply, rows = [];
  function mount(stage) {
    root = document.createElement('div');
    root.className = 'ui-root';
    root.innerHTML = `
      <div class="ui-scene">
        <div class="ui-log" dir="rtl" lang="fa">
          <div class="ui-log-h">کارهای امروز</div>
          <div class="ui-row"><span>خواندن ۴۲ ایمیل</span><b>۰۹:۴۱</b></div>
          <div class="ui-row"><span>جدا کردن موارد مهم</span><b>۰۹:۴۲</b></div>
          <div class="ui-row"><span>نوشتن خلاصه</span><b>۰۹:۴۲</b></div>
          <div class="ui-row"><span>ارسال در تلگرام</span><b>۰۹:۴۳</b></div>
        </div>
        <div class="ui-win" dir="rtl" lang="fa">
          <div class="ui-bar"><i></i><i></i><i></i><span>هرمس</span></div>
          <div class="ui-chat">
            <div class="ui-msg mine">خلاصه‌ی ایمیل‌های امروز رو بفرست</div>
            <div class="ui-typing"><i></i><i></i><i></i></div>
            <div class="ui-msg theirs">سه ایمیل مهم داری. خلاصه‌اش رو توی تلگرام فرستادم.</div>
          </div>
          <div class="ui-input"><span>خلاصه‌ی ایمیل‌های امروز رو بفرست</span><button tabindex="-1" aria-hidden="true">ارسال</button><em></em></div>
        </div>
      </div>
      <svg class="ui-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2l14 9.5-6.2 1.4 3.7 7.3-2.6 1.3-3.7-7.3L5 19z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    stage.appendChild(root);
    scene = root.querySelector('.ui-scene');
    win = root.querySelector('.ui-win'); log = root.querySelector('.ui-log');
    cursor = root.querySelector('.ui-cursor'); btn = root.querySelector('.ui-input button');
    ripple = root.querySelector('.ui-input em');
    mine = root.querySelector('.mine'); reply = root.querySelector('.theirs'); typing = root.querySelector('.ui-typing');
    rows = [...root.querySelectorAll('.ui-row')];
  }
  // cursor path: a curve from the lower left to the send button, slight overshoot
  const C0 = [8, 96], C1 = [14, 60], C2 = [40, 88], C3 = [31.5, 74.5];
  const bezPt = (p) => [0, 1].map(k => {
    const a = C0[k], b = C1[k], c = C2[k], d = C3[k], u = 1 - p;
    return u * u * u * a + 3 * u * u * p * b + 3 * u * p * p * c + p * p * p * d;
  });
  const dolly = M.bez(0.2, 0.7, 0.1, 1), pull = M.bez(0.65, 0, 0.2, 1);
  function render(t) {
    // camera: dolly in, then swing to the log, then drift back for the loop
    const d = dolly(M.remap(t, 0, 1.4));
    const s = pull(M.remap(t, 3.3, 4.4));
    const back = M.ease.inOut(M.remap(t, 5.5, 6.4));
    const ry = M.mix(M.mix(-26, -9, d), 6, s) * (1 - back) + -26 * back;
    const rx = M.mix(M.mix(14, 5, d), 4, s) * (1 - back) + 14 * back;
    const tz = M.mix(M.mix(-260, 0, d), 60, s) * (1 - back) + -260 * back;
    const tx = M.mix(0, -42, s) * (1 - back);
    scene.style.transform = `translateX(${tx}cqw) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    // depth of field: focus moves from the window to the log
    const fwin = 7 * s * (1 - back), flog = 7 * (1 - s) + 7 * back * s;
    win.style.filter = `blur(${(fwin / 1.6).toFixed(2)}px)`;
    log.style.filter = `blur(${(Math.min(7, flog) / 1.6).toFixed(2)}px)`;
    // cursor: enters on a curve, lands on send, clicks, leaves
    const cp = M.ease.out(M.remap(t, 0.7, 1.75));
    const [cx, cy] = bezPt(cp);
    const click = M.remap(t, 1.8, 1.95), rel = M.remap(t, 1.95, 2.15);
    const squash = 1 - 0.18 * Math.sin(Math.PI * M.clamp(click + rel * 0.0)) * (t < 2.15 ? 1 : 0);
    const leave = M.ease.in(M.remap(t, 2.5, 3.2));
    cursor.style.left = `${cx - leave * 4}%`; cursor.style.top = `${cy + leave * 30}%`;
    cursor.style.transform = `scale(${squash.toFixed(3)})`;
    cursor.style.opacity = t > 0.6 && t < 3.2 ? 1 : 0;
    btn.style.transform = `scale(${(1 - 0.08 * Math.sin(Math.PI * M.remap(t, 1.8, 2.1))).toFixed(3)})`;
    const rp = M.remap(t, 1.85, 2.4);
    ripple.style.opacity = rp > 0 && rp < 1 ? (1 - rp).toFixed(2) : 0;
    ripple.style.transform = `translate(-50%,-50%) scale(${(0.3 + 2.2 * M.ease.out(rp)).toFixed(3)})`;
    // chat: my bubble rises from the input, Hermes types, then replies
    const m = M.spring({ k: 260, c: 22 })(t - 2.0);
    mine.style.opacity = t > 2.0 ? 1 : 0;
    mine.style.transform = `translateY(${(1 - m) * 160}%) scale(${(0.92 + 0.08 * m).toFixed(3)})`;
    root.querySelector('.ui-input span').style.opacity = t > 2.0 ? 0 : 1;
    typing.style.opacity = t > 2.4 && t < 3.05 ? 1 : 0;
    [...typing.children].forEach((c, i) => { c.style.transform = `translateY(${-35 * Math.max(0, Math.sin((t - 2.4) * 10 - i * 0.9))}%)`; });
    const r = M.spring({ k: 240, c: 21 })(t - 3.05);
    reply.style.opacity = t > 3.05 ? 1 : 0;
    reply.style.transform = `scale(${(0.85 + 0.15 * r).toFixed(3)})`;
    // log rows tick in once the focus lands there
    rows.forEach((row, i) => {
      const p = M.ease.out(M.remap(t, 3.9 + i * 0.22, 4.3 + i * 0.22));
      row.style.opacity = (0.25 + 0.75 * p).toFixed(2);
      row.classList.toggle('done', p > 0.6);
    });
  }
  return { duration, fps: 60, still: 3.6, mount, render };
};

/* Paper cut-out: each connected letter group of پیام‌رسان is one rigid piece of
   black paper, pinned at the baseline and placed by hand, on threes (8 poses a
   second). One light, so every shadow agrees; a lifted piece casts a longer one. */
const cutout = () => {
  const U = uid('cutout');
  const run = GLYPHS.paws, S = 0.158, X0 = (1600 - run.w * S) / 2, BASE = 575;
  const duration = 5.6;
  let pieces = [];
  const jit = M.rng(5);
  function mount(stage) {
    const svg = svgStage(stage, 'var(--paper)');
    const defs = h('defs', {}, svg);
    // light-table glow behind the paper
    const rg = h('radialGradient', { id: U + 'light', cx: '50%', cy: '42%', r: '65%' }, defs);
    h('stop', { offset: '0', style: 'stop-color: var(--paper); stop-opacity: 0' }, rg);
    h('stop', { offset: '1', style: 'stop-color: var(--black); stop-opacity: .07' }, rg);
    h('rect', { width: 1600, height: 900, fill: `url(#${U}light)` }, svg);
    const groups = {};
    run.g.forEach((g, i) => { if (g[4] || g[5].length) (groups[g[7]] = groups[g[7]] || []).push(i); });   // g[7]: connected letter group
    Object.keys(groups).map(Number).sort((a, b) => a - b).forEach((k, n) => {
      const idx = groups[k];
      const xs = idx.map(i => run.g[i][0]), xe = idx.map(i => run.g[i][0] + run.g[i][2]);
      const pivot = (Math.min(...xs) + Math.max(...xe)) / 2;
      const f = h('filter', { id: `${U}p${k}`, x: '-30%', y: '-30%', width: '160%', height: '170%' }, defs);
      const ds = h('feDropShadow', { dx: 5, dy: 8, stdDeviation: 3, 'flood-color': '#000', 'flood-opacity': 0.28 }, f);
      const outer = h('g', { filter: `url(#${U}p${k})` }, svg);
      const inner = h('g', {}, outer);
      const glyphs = h('g', { transform: `scale(${S} ${-S}) translate(${-pivot} 0)` }, inner);
      idx.forEach(i => { const [gx, gy, , , d, ds] = run.g[i]; h('path', { d: [d, ...ds].join(' '), transform: `translate(${gx} ${gy})`, fill: 'var(--ink)' }, glyphs); });
      pieces.push({ outer, inner, ds, n, px: X0 + pivot * S, from: { x: (jit() - 0.5) * 300, y: 520 + jit() * 120, r: (jit() - 0.5) * 70 }, j: [jit(), jit(), jit()] });
    });
    pieces.reverse();                                 // logical order: پیا first (rightmost)
    pieces.sort((a, b) => b.px - a.px);
  }
  const place = M.bez(0.3, 0.9, 0.3, 1.1);
  function render(t) {
    const ts = M.steps(t, 24, 3);                     // on threes
    const pose = Math.floor(ts * 8);
    pieces.forEach((p, i) => {
      const a = 0.3 + i * 0.32;
      const pin = place(M.remap(ts, a, a + 0.75));
      const lift = M.ease.inOut(M.remap(ts, 4.1 + i * 0.16, 4.5 + i * 0.16));
      const gone = M.ease.in(M.remap(ts, 4.45 + i * 0.16, 5.0 + i * 0.16));
      const moving = pin > 0 && pin < 1 || lift > 0;
      const r = M.rng(pose * 13 + i * 7);
      const jx = moving ? (r() - 0.5) * 3 : 0, jr = moving ? (r() - 0.5) * 1.4 : 0;
      const x = p.px + p.from.x * (1 - pin) + jx + gone * 260 * (i % 2 ? 1 : -1) * 0.4;
      const y = BASE + p.from.y * (1 - pin) - lift * 22 - gone * 700;
      const rot = p.from.r * (1 - pin) + jr + gone * (i % 2 ? 14 : -10);
      const sc = 1 + 0.04 * lift;
      p.inner.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sc})`);
      // shadow: flat on the table vs lifted toward the light
      const L = Math.max(lift, pin < 1 ? 1 - pin : 0);
      p.ds.setAttribute('dx', (5 + 16 * L).toFixed(1));
      p.ds.setAttribute('dy', (8 + 24 * L).toFixed(1));
      p.ds.setAttribute('stdDeviation', (3 + 9 * L).toFixed(1));
      p.ds.setAttribute('flood-opacity', (0.28 - 0.1 * L).toFixed(2));
      p.outer.setAttribute('opacity', ts < a ? 0 : 1);
    });
  }
  return { duration, fps: 24, still: 3.2, mount, render };
};

export const SKETCHES = { oner, match, ui, beat, boil, cutout, nuqta, kashida };

export const SKETCH_INFO = [
  { id: 'oner', n: 1, title: 'One camera, no cuts', fa: 'یک دوربین، بدون کات' },
  { id: 'match', n: 2, title: 'One shape carries the story', fa: 'یک شکل، کل داستان' },
  { id: 'ui', n: 3, title: 'The real UI, directed', fa: 'رابط واقعی، کارگردانی‌شده' },
  { id: 'beat', n: 4, title: 'Cut on the beat', fa: 'کات روی ضرب' },
  { id: 'boil', n: 5, title: 'On twos, with line boil', fa: 'دوفریمی، با خط لرزان' },
  { id: 'cutout', n: 6, title: 'Paper cut-out letters', fa: 'حروف کاغذی' },
  { id: 'nuqta', n: 7, title: 'Dots last', fa: 'نقطه‌ها آخر' },
  { id: 'kashida', n: 8, title: 'Kashida, not letter-spacing', fa: 'کشیده، نه فاصله' },
];
