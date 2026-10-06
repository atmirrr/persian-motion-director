# Workflow: from brief to render

## Contents
1. Brief checklist
2. Showing directions
3. Music and the bar map
4. Shot list template
5. Style frames
6. Build notes (Remotion)
7. Final checks
8. Delivery specs

## 1. Brief checklist

Ask only for what is missing:

- **Copy**: every Persian line, final wording. Machine-translated copy is the most common source of "the Persian feels off" (see `persian-copy.md`).
- **Length and aspect**: 16:9 for X and YouTube, 1:1 or 4:5 for feeds, 9:16 for stories.
- **Brand**: palette, fonts, logo rules. Use the brand's own system before inventing one.
- **Where it will be posted**: X autoplays muted, so burn in captions or carry the message in type.
- **Music**: an existing track, a request to compose one, or permission to choose.

## 2. Showing directions

Before building, show 6–10 directions and let the user pick. Each direction: a live sketch (from `assets/sketches/` or a quick new one), one sentence on what it does, how pros make it, and where it sits in the piece. Render the sketches as clips if the user can't open a local page (`node render-clips.mjs`).

## 3. Music and the bar map

Lock the track before animating. Find or set the tempo, then map sections to bars:

| Bars | Section | Notes |
|---|---|---|
| 1–2 | Cold open | Instrument alone; the problem shown |
| 3–4 | Build | Filtered drums; title assembles |
| 5–8 | Drop | Full groove; title punches in; kinetic claims cut on beats |
| ... | ... | ... |

At 120 BPM: beat = 0.5 s = 30 frames at 60 fps; bar = 2 s = 120 frames. Section changes land on downbeats; camera moves are centred on downbeats so the fastest frame is the beat. Place sound effects so their attack lands on the visual hit (a whoosh peaks on the downbeat it travels through).

If no track exists, compose one in code (see `assets/music/compose_shur_pulse.py`): you then know every beat exactly and can write `beats.json` for the edit.

## 4. Shot list template

Write it before animating. One row per beat group:

```
| Time  | Bars  | Beat | Shot / action                        | Type on screen (fa / en)          | Sound          |
|-------|-------|------|--------------------------------------|-----------------------------------|----------------|
| 0:00  | 1     | 1    | Broken "AI default" slide            | کارگردان موشن فارسی (broken)       | santur alone   |
| 0:03  | 2     | 3    | Letters fall, on twos                | —                                 |                |
| 0:04  | 3     | 1    | Title bodies wipe in, RTL, on beats  | کارگردان / موشن / فارسی            | drums enter    |
| 0:05.5| 3     | 4    | Dots drop on 16ths                   |                                   |                |
| 0:08  | 5     | 1    | HIT: invert to brand blue, punch-in  | title + persian-motion-director   | impact         |
```

## 5. Style frames

Render 4–6 stills at the moments that define the look (`node render-stills.mjs Intro 2,7.1,18.5,56.7,78.7`). Review at full size for: clipped dots and tails, broken joins, Arabic letters or digits, wrong text direction, contrast. Get a yes before the full build.

## 6. Build notes (Remotion)

- One camera container. Scenes are positions on a strip (RTL: next scene to the left, camera travels left), and transitions are camera moves with directional blur (`whip()` and `BlurDefs` in `assets/remotion/src/intro/kit.tsx`).
- Shared objects live above the scenes and never unmount (the full stop that becomes a bubble).
- Everything is a function of the frame. No CSS transitions, no `requestAnimationFrame`, no `Math.random()` in render paths; use seeded randomness.
- For multi-point moves, ease one overall progress value and map it through the points; Remotion eases each segment of a multi-point `interpolate()` separately, which stops motion dead at every waypoint.
- Plain-JS sketches run unchanged through `SketchPlayer` (mount once, `render(t)` in a layout effect).

## 7. Final checks

- `python3 scripts/lint_persian.py copy <file>` on all copy; `python3 scripts/lint_persian.py code src/` on the project.
- Scrub every cut: is it on a beat or 2 frames before?
- Every loop is exact: clip length is a whole number of loops, last frame matches the first.
- Fonts load before the first frame (no fallback on a render server).

## 8. Delivery specs

- X: H.264 + AAC, 1920×1080, 30 or 60 fps, up to 2:20, under 512 MB. Autoplay is muted: the message must work without sound.
- CRF 16–18, `yuv420p`, `bt709`. Render clips as whole loops so autoplay loops seamlessly.
