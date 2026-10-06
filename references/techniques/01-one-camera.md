# 01 · One camera, no cuts

**Sketch:** `oner` in `assets/sketches/sketches.js` · **Clip:** `Clip-01-oner`

## What it is
All scenes sit on one long strip, laid out right to left like the script reads. Every transition is the camera travelling: a small wind-up, a fast whip with motion blur, a settle. Background layers move slower than the foreground, so the frame has depth.

## Why it reads as pro
The viewer never "starts over" on a new slide; space is continuous. It is the opposite of chaining scenes with fades.

## Recipe
- One camera container around the film; scenes are positions on it (`x = -k * width`), the camera position is the sum of eased moves.
- Move curve: `cubic-bezier(.62,-.18,.18,1.04)` (small anticipation, whip, tiny overshoot) over ~0.7 s; or centre a symmetric whip on the downbeat so the fastest frame is the beat (`whip()` in `assets/remotion/src/intro/kit.tsx`).
- Directional blur proportional to speed: SVG `feGaussianBlur stdDeviation="v*k 0"`, capped around 36–46 px at 1080p.
- Scale dip of 4–6% at mid-move and a lean of about 1° in the travel direction.
- Parallax: background layers at 0.5×, foreground accents at 1.3–1.4× camera speed.
- Inside a scene the camera breathes (zoom 1.00 → 1.04); the next scene starts at that zoom.
- RTL: the next scene is to the left; the camera travels left; content moves right.

## Persian notes
Labels on each scene reveal right to left after the camera settles (~0.1 s), on the beat.

## From X
- [@notdwd](https://x.com/notdwd/status/2104684539142648062): shots arrive already moving, blur follows speed, no crossfades.
- [@visualsbywlroo](https://x.com/visualsbywlroo/status/1660573341701357568): cut where the motion is fastest.
- [@RaphaelAubryy](https://x.com/RaphaelAubryy/status/2104502744010629269): real motion blur needs ~8 sub-frame samples.
