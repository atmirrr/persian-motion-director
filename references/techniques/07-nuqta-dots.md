# 07 · Dots last

**Sketch:** `nuqta` · **Clip:** `Clip-07-nuqta`

## What it is
The words arrive as bare letter shapes, right to left; then the dots fall in one by one and land with a small squash: ب gets one, ی two, ش three. The script was first written without dots, which were added later to tell letters apart, so this replays the alphabet's own history.

## Recipe
- Shape the line with `scripts/shape_persian.py`; each glyph gives a body path and separate dot paths with bounds.
- Bodies: per-word RTL wipe (clip rect growing leftward), the type sliding ~20 px inside the mask, `cubic-bezier(.16,1,.3,1)` over ~0.75 s, words ~0.24 s apart.
- Dots: sorted right to left, ~55 ms apart with ±15 ms seeded jitter. Dots above the line fall from above, dots below rise from below: accelerate for ~0.26 s (`y = H(1 - p²)`, stretching up to 1.25×), then squash on landing (`sy = 1 - 0.34·e^(-16u)cos(34u)`, `sx` opposite) with a tiny rebound.
- Hold with a slow push (scale 1 → 1.014); exit dots first, lifting away, then the words wipe out to the left.

## Why it works for Persian specifically
Dots are what make Persian letters distinct (ب پ ت ث). Giving them their own timing is a move only this script has, and it never breaks a join because the bodies stay whole.

## From X
- [@FontIRAN](https://x.com/FontIRAN/status/1460958308735635464) Dana 3: its main feature is timing how dots and marks change shape, separately from the letters.
- [@FontIRAN](https://x.com/FontIRAN/status/1822285234919919912) Pesteh: a modern Nastaliq animated through its variable axes.
