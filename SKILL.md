---
name: persian-motion-director
description: Direct and build professional motion design (promo and launch films, kinetic typography, animated explainers, social clips, title sequences) with correct Persian/Farsi and right-to-left typography, in Remotion or plain web code. Use this skill whenever the user wants a video, animation, motion graphics, teaser or animated text that contains Persian, Farsi, Arabic-script or RTL text, and whenever they say a motion piece looks "default", "like a slideshow", "AI-made" or "not pro", or that the Persian looks off, broken or disconnected, even if they never say "motion design". It brings the anti-slideshow method (one camera, objects that carry across scenes, music-first beat-locked edits), eight ready techniques with live sketches, HarfBuzz tooling for per-letter and per-dot Persian animation, kashida stretching, and a Persian correctness checklist and linter.
---

# Persian Motion Director

You are directing, not just animating. Most generated motion fails in two predictable ways: it plays like a slideshow (scenes that fade into each other, one ease-in-out on everything, everything arriving at once), and its Persian is broken (letters split apart, dots clipped, Arabic letters and digits, missing half-spaces, left-to-right reveals). This skill fixes both. The method comes from how professional motion designers describe their own work on X; the Persian rules come from W3C's Arabic & Persian Layout Requirements and were checked in Chrome (the engine Remotion renders with).

## The director's loop

Work in this order. Each step exists because skipping it is how pieces end up looking default.

1. **Read the brief and fill only real gaps.** Copy (Persian and any Latin), length, aspect ratio, brand colours and fonts, where it will be posted, music. If a brand exists, use its palette and fonts instead of inventing one.
2. **Show directions before building.** Motion is subjective and expensive to redo. Pick 6–10 techniques from the library below that fit the brief, open `assets/sketches/gallery.html` (or render the clips) and let the user choose. Rework after a full build costs ten times more than a pick list.
3. **Music first.** Lock the track and its tempo before animating. Build a bar map: which section lives on which bars. If there's no track, compose one (`assets/music/compose_shur_pulse.py` is a working example that writes `beats.json`) or ask for one. At 120 BPM one beat is 0.5 s and one bar 2 s; at 60 fps a beat is 30 frames.
4. **Write the shot list on the bar grid** (template in `references/workflow.md`). Every section change lands on a downbeat; every cut on a beat or 2 frames before it.
5. **Style frames.** Render 4–6 stills (`assets/remotion/render-stills.mjs`) and get a yes before animating everything.
6. **Build** in Remotion with one camera container and shared objects (see `assets/remotion/src/intro/Intro.tsx` for a complete worked example).
7. **Check**, then render: run `scripts/lint_persian.py` on all copy, review stills at full size for clipped dots and broken joins, scrub every cut against the beat, and make loops exact (clip length = a whole number of loops).

## What separates pro motion from a slideshow

| Slideshow habit | What to do instead |
|---|---|
| Scenes chained with fade transitions | One camera travels between scenes, or one object carries into the next scene. Never `fade()` scene to scene. |
| The same ease-in-out on everything | Each move gets its own curve. Entrances: `bezier(.16,1,.3,1)` over ~20 frames. Exits: `bezier(.7,0,.84,0)` over ~8 frames, travelling only ~70% as far. |
| Everything arrives together, evenly spaced | One lead element, the rest 2–4 frames behind, spaced on a curve rather than evenly. |
| Remotion's default bouncy `spring()` (overshoots ~16%) | Under 2% overshoot on UI, none on text: stiffness 100 / damping 16 gives ~1.5%. |
| Music laid on at the end | Music first; cuts on the beat; sound attacks placed on the visual hits. |
| Centered text on a gradient, logo at the end | Show the real product doing a real task in the first 10 seconds. |
| Freezes, or motion that never pauses | Hold long enough to read; only the camera breathes (zoom 1.00 → 1.04 per scene). |
| Grain, halftone or ASCII as a finish | Texture only with a physical reason (paper, print, light). These finishes are now the AI default. |

More numbers and the sources behind them: `references/anti-slideshow.md`.

## Persian non-negotiables

Read `references/persian-typography.md` before writing any Persian into a frame. The short version:

1. **Never put Persian letters in their own boxes.** `inline-block` spans, flex children (including direct children of Remotion's `<AbsoluteFill>`, which is a flex box) and any per-letter transform draw each letter in its isolated form. Animate whole words or lines. When you truly need per-letter or per-dot motion, use shaped outlines (`scripts/shape_persian.py`) or zero-width-joiner splitting (`scripts/split_fa.js`).
2. **Fade words, not letters.** Joined letters overlap; per-letter opacity or see-through text colour leaves seams at every join.
3. **Masks need slack.** Persian reaches far above and below Latin: pad clip masks by about 0.5em top and bottom, use line-height ≥ 1.6 (≥ 2.4 for Nastaliq), or the dots and the top of گ get cut.
4. **Direction.** `dir="rtl" lang="fa"` on every Persian block; wrap Latin names and numbers in `<bdi>` (or FSI/PDI) or the line scrambles. Reveals and staggers start on the right, camera progress travels left, "next" arrows point left. Play buttons, clocks and numbers are never mirrored.
5. **Characters.** Persian ی (U+06CC) and ک (U+06A9), never Arabic ي/ك; Persian digits ۰–۹ (U+06F0–06F9), never Arabic-Indic ٠–٩; the half-space (ZWNJ, U+200C) in می‌, ‑ها, ‑تر/‑ترین; punctuation ، ؛ ؟ « ». `scripts/lint_persian.py` catches these.
6. **No letter-spacing.** Chrome ignores it inside Persian words (since version 137) and other tools break the joins. Stretch with kashida instead, only after a letter that joins forward, at most one per word.
7. **Load the font, every time.** If the Persian font (or its Arabic-script subset) isn't loaded, Chrome silently falls back to a system font. In Remotion use `FontFace` + `delayRender` (see `assets/remotion/src/fonts.ts`).
8. **Copy.** Write natural Persian in one register; no word-for-word English idioms. A native reader signs off on every line before render (`references/persian-copy.md`).

## Technique library

Live code for each is in `assets/sketches/sketches.js` (plain JS, a pure function of time) and runs both in a browser page and in Remotion through `SketchPlayer`. Details, numbers and the X posts each comes from are in `references/techniques/`.

| # | Technique | Use it for | Sketch id |
|---|---|---|---|
| 01 | One camera, no cuts | The spine of a film: scenes on one strip, whip pans with motion blur and parallax | `oner` |
| 02 | One shape carries the story | Transitions: a full stop grows into a chat bubble, then into the next full stop | `match` |
| 03 | The real UI, directed | Product beats: real interface in 3D, cursor on arcs, focus pulls | `ui` |
| 04 | Cut on the beat | Feature runs and kinetic type: hard cuts on every beat, punch-ins, inverted frames | `beat` |
| 05 | On twos, with line boil | A hand-drawn layer over clean UI: drawings hold 2 frames, lines wobble 12×/s | `boil` |
| 06 | Paper cut-out letters | Warm title cards: each joined letter group is a rigid paper piece | `cutout` |
| 07 | Dots last | Wordmarks and reveals: letter bodies first, then the dots drop in | `nuqta` |
| 08 | Kashida, not letter-spacing | Emphasis on a held note: stretch the joining stroke, measured in calligraphic dots | `kashida` |

Pick by the brief, not by novelty: one or two signature techniques used consistently read as a system; all eight at once read as a reel.

## Tools in this skill

- `scripts/shape_persian.py` — shapes Persian with HarfBuzz and exports SVG outlines split into letter bodies, dots and connected letter groups (`pip install uharfbuzz fonttools`). This is what makes per-letter, per-dot and kashida animation possible without breaking the script.
- `scripts/split_fa.js` — splits a Persian word into letters that keep their joined forms (zero-width joiners), for when outlines are overkill.
- `scripts/lint_persian.py` — checks copy (Arabic letters and digits, missing half-spaces, English punctuation, misplaced kashida) and code (letter-spacing, per-letter boxes, missing `dir`).
- `assets/sketches/` — the motion engine (`engine.js`), the eight sketches, shaped glyph data, styles and `gallery.html` (serve the folder with any static server).
- `assets/remotion/` — `SketchPlayer` (drives a sketch from the frame number), one clip composition per technique, the full intro film as a worked example, and scripts to render clips and stills.
- `assets/music/compose_shur_pulse.py` — an original 120 BPM track in Dastgah Shur written in code, with a beat map; shows how to make the edit lock to the music.

## When the user only wants a quick piece

Still keep the two non-negotiables that cost nothing: no per-letter boxes for Persian, and no scene-to-scene fades. Use one technique well, set the timing on a beat grid, and render stills to check the Persian before the full render.
