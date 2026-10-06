# 05 · On twos, with line boil

**Sketch:** `boil` · **Clip:** `Clip-05-boil`

## What it is
The drawing holds each pose for two frames (12 drawings a second at 24 fps) and its lines re-wobble with every new drawing, like redrawn cels, while the camera keeps moving smoothly every frame.

## Why it reads as human
Every frame looks redrawn by hand but stays consistent. The mix of stepped drawing and smooth camera is how hand-drawn work sits inside modern edits. On its own, "on twos" no longer proves handmade (AI prompts now ask for it); it needs real drawing on top.

## Recipe
- Boil: SVG `feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2"` into `feDisplacementMap scale="4–7"`; switch between 3 seeds every 2 frames: `seed = 1 + floor(t * 12) % 3`.
- Stepping: `tStep = floor(t * 24 / 2) * 2 / 24` for pose, path progress and boil. Camera, light and opacity use the real `t`.
- Step each layer once; stepping twice at different rates stutters.
- Hand-drawn extras: a dotted trail (`stroke-dasharray: 3 22`, round caps), speed lines only while moving fast, an underline that draws in.
- After Effects: Turbulent Displace or Scribble plus `posterizeTime()` on drawing layers only.
- Filters are slow to render; apply them to the drawn layer only.

## Persian notes
The boil filter runs after shaping, so live Persian text can boil without breaking joins.

## From X
- [@mannupaaji](https://x.com/mannupaaji/status/2053074064110129535): wobbly text from SVG filters that differ only by seed.
- [@motion_shia_](https://x.com/motion_shia_/status/2062490471847591990): Scribble plus Posterize Time.
- [@Inoshita0427](https://x.com/Inoshita0427/status/2029928178001817620): step single properties.
- [@pvonborries](https://x.com/pvonborries/status/1519577654625808384): the stutter from stepping twice.
