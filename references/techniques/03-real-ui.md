# 03 · The real UI, directed

**Sketch:** `ui` · **Clip:** `Clip-03-ui`

## What it is
The product's real interface, rebuilt as vectors/DOM and set in 3D. The camera dollies in, a cursor travels on an arc and dips on the click, the reply lands, then focus racks to a second surface behind it.

## Why it reads as pro
Showing the real product working in the first 10 seconds beats any claim. Directed camera and cursor make a screen recording feel shot, not captured.

## Recipe
- Rebuild from the real design files or components, never screenshots on cards.
- CSS 3D: `perspective: 1400px`; scene rotates from `rotateY(-26deg) rotateX(14deg) translateZ(-260px)` to near-flat with `cubic-bezier(.2,.7,.1,1)`.
- Depth of field = blur on the out-of-focus layer (0 → ~4–5 px), swapped between layers during a lateral move.
- Cursor: cubic Bézier path, ease-out arrival, a dip of ~0.82 scale on click, a ripple behind the button, then the button presses (0.92 scale). Its arrival speed sets off a small spring on whatever it hits.
- Typing: uneven rhythm, faster mid-word, slower at word starts and punctuation.
- One camera move at a time.

## Persian notes (RTL UI)
- In RTL macOS the window controls sit on the right; your own chat bubbles align right, the other party's left; the send button is on the left of the input.
- Inline Latin inside a Persian prompt (or Persian inside a terminal) goes in `<bdi dir="rtl">`.
- Persian digits in timestamps (۰۹:۴۱).

## From X
- [@raycast](https://x.com/raycast/status/2029180822838759703) Glaze launch: built from Figma files, every interaction in After Effects (motion by @bricksdept).
- [@megxwayne](https://x.com/megxwayne/status/2036836760391741797): Linear Agent, made the old-fashioned way, all-vector After Effects.
- [@mattgperry](https://x.com/mattgperry/status/1948012473317285963): natural typing rhythm.
- [@benfryc](https://x.com/benfryc/status/2082891141519642964): the glass UI look in nine steps.
