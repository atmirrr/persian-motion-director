# 02 · One shape carries the story

**Sketch:** `match` · **Clip:** `Clip-02-match`

## What it is
The full stop of «یک پیام بفرست.» winds up, flies and opens into the reply bubble; the bubble then shrinks into the full stop of the next line. The eye follows one object the whole time, so there is nothing to cut.

## Why it reads as pro
Scenes become states of one object. Continuity replaces transitions.

## Recipe
- The hero shape lives above the scenes and never unmounts.
- Anticipation: dip ~9 px and squash (w × 1.25, h × 0.8) for ~0.15 s before it moves.
- Travel on an arc (control point above the line), grow as a circle with `cubic-bezier(.75,0,.2,1)`, then widen into a rounded rect on a spring (stiffness 260, damping 20) with corner radius easing from round to ~0.34 of the height.
- Content inside enters after the container starts changing and leaves before the next change (typing dots, then the reply wipes in right to left, then a check stroke draws).
- Reverse: rect → circle → shrink to the next full stop with `cubic-bezier(.6,0,.15,1)` while the next line wipes in, timed so the dot lands as the line completes.
- In Remotion, `interpolatePath()` from `@remotion/paths` morphs between arbitrary shapes.

## Persian notes
The full stop is the leftmost glyph of an RTL line (index 0 in shaped data). Shape the lines with `scripts/shape_persian.py` so you know its exact position.

## From X
- [@jdgstewart](https://x.com/jdgstewart/status/1423347260159635461) (Ordinary Folk): nearly every keyframe on one shape layer.
- [@AustinBauwens](https://x.com/AustinBauwens/status/2104560709359284322): plan where the eye goes; one object leads to the next.
- [@twoclipping](https://x.com/twoclipping/status/2103273003555402193): one element changes into every state (made in code with AI help; useful for its rules).
