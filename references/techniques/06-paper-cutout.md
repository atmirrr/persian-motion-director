# 06 · Paper cut-out letters

**Sketch:** `cutout` · **Clip:** `Clip-06-cutout`

## What it is
Each connected letter group of «پیام‌رسان» is a rigid paper piece, pinned at the baseline and placed by hand at 8 poses a second. One light, so every shadow agrees; a lifted piece casts a longer, softer one.

## Why it reads as human
Pieces never change shape (AI paper-style video warps them). Pins, one shadow direction and small nudges on held poses look like hands moving paper on a table.

## Recipe
- Pieces: the connected letter groups from `scripts/shape_persian.py` (field `group`). Persian already breaks words into these groups (پیا · م · ر · سا · ن), so the cuts fall where the script breaks anyway.
- Motion on threes: `tStep = floor(t * 24 / 3) * 3 / 24`. Rotate around a pin at the baseline; arrive with a small overshoot (`cubic-bezier(.3,.9,.3,1.1)`).
- Nudge moving poses by ~1–1.5 px and ~0.5–0.7° (seeded); held poses stay still.
- Shadow: `feDropShadow` with offset and blur growing with lift (flat: 5/8 px, blur 3; lifted: 21/32 px, blur 12), opacity falling slightly as it lifts.
- Lineage: Lotte Reiniger's silhouette film *The Adventures of Prince Achmed* (1926), drawn from the Thousand and One Nights.

## From X
- [@annaxmalina](https://x.com/annaxmalina/status/2065849932637180245): paper-collage loop for a NYT opinion essay.
- [@catsuka](https://x.com/catsuka/status/2104892933719695809): cut-out rigs in Moho and After Effects.
- [@claudeai](https://x.com/claudeai/status/2064394146916229443) and [how it was made](https://x.com/sammcallister/status/2064692964559835489): a launch film built from physical sources, no AI.
