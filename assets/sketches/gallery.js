import { M } from './engine.js';

/* Card runtime: one rAF loop, visible cards only, scrub + play/pause. */
export const Board = (() => {
  const cards = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();

  function add(el, demo) {
    const stage = el.querySelector('.stage');
    const scrub = el.querySelector('input[type=range]');
    const tc = el.querySelector('.tc');
    const btn = el.querySelector('.play');
    const c = { el, demo, t: demo.still ?? 0, playing: !reduce, visible: false };
    demo.mount(stage);
    const draw = () => {
      demo.render(c.t);
      scrub.value = String(c.t / demo.duration);
      tc.textContent = M.fmtTC(c.t, demo.fps || 24);
    };
    c.draw = draw;
    scrub.addEventListener('input', () => {
      c.playing = false; btn.setAttribute('aria-pressed', 'false');
      c.t = Number(scrub.value) * demo.duration; draw();
    });
    btn.addEventListener('click', () => {
      c.playing = !c.playing; btn.setAttribute('aria-pressed', String(c.playing));
    });
    btn.setAttribute('aria-pressed', String(c.playing));
    new IntersectionObserver(es => { c.visible = es[0].isIntersecting; }, { rootMargin: '120px' }).observe(stage);
    draw();
    cards.push(c);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const c of cards) {
      if (!c.visible || !c.playing) continue;
      c.t = (c.t + dt) % c.demo.duration;
      c.draw();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { add };
})();
