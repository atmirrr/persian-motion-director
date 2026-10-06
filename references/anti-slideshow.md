# Anti-slideshow: timing, continuity and rhythm

Why generated motion looks "default": scenes fade into each other, every element uses the same ease-in-out, things arrive together and evenly spaced, springs bounce too much, music is added last, and nothing ever pauses (or everything freezes). Jake Bartlett describes one-shot AI motion as flat, fast pacing with the same easing everywhere ([post](https://x.com/jakeinmotion/status/2104022458865218019)). Remotion's own example code for agents uses long opacity fades and `fade()` transitions, which is exactly that look.

## Continuity

- **One camera.** Lay scenes out on one strip and move a camera between them; every transition is the camera travelling: a small wind-up, a whip, motion blur, a settle ([@notdwd](https://x.com/notdwd/status/2104684539142648062)).
- **One object carries across.** Keep the hero element mounted above the scenes and change its position, size, radius and colour into the next state; swap what's inside it behind a short blur ([Greg Stewart](https://x.com/jdgstewart/status/1423347260159635461), [Austin Bauwens](https://x.com/AustinBauwens/status/2104560709359284322)).
- **Cut on the fastest frame.** If you do cut, cut where the motion is fastest and continue the move in the next shot at the same speed; the eye carries the motion across the cut ([Will Taylor](https://x.com/visualsbywlroo/status/1660573341701357568)).
- **Never crossfade scene to scene.** A dissolve reads as a slide change.

## Timing and curves

- Entrances: `cubic-bezier(.16,1,.3,1)` over about 20 frames (60 fps). Exits: `cubic-bezier(.7,0,.84,0)` over about 8 frames and only ~70% of the travel; let opacity and blur finish the job.
- After Effects equivalent: arrival keys at 70–90% influence in the speed graph. With keyframe speeds at 0, outgoing influence `a` and incoming influence `b` map to `cubic-bezier(a/100, 0, 1-b/100, 1)`; Easy Ease is `(.33,0,.67,1)`, which is the "default" look ([Ryan Summers](https://x.com/Oddernod/status/1624502487544627201), [Steve Savalle](https://x.com/Steve_Savalle/status/1798366003014889683)).
- Stagger 2–4 frames (30–80 ms), on a curve rather than evenly; lead with one element.
- Never scale up from 0: start at ~0.93 with opacity 0 ([Emil Kowalski](https://x.com/emilkowalski/status/1954891053032755560)).
- Springs: Remotion's default `spring()` (mass 1, damping 10, stiffness 100) overshoots ~16%; that is the template bounce. Stiffness 100 / damping 16 overshoots ~1.5%; stiffness 350 / damping 32 settles in ~0.25 s. Overshoot a little on UI, never on text ([Jonny Burger](https://x.com/JNYBGR/status/2069438949467013559)).
- Multi-point moves: ease one progress value and map it through the points. Per-segment easing stops dead at every waypoint.

## Holds and camera life

- Hold long enough to read. The current AI-default prompt asks for "no pauses"; a real hold reads as authored.
- During holds, only the camera breathes: zoom 1.00 → 1.04 across a scene, the next scene starting at that zoom.

## Motion blur

- Blur along the direction of travel, proportional to speed, fading out as things settle.
- Real blur: 8 sub-frame samples per frame (`<CameraMotionBlur shutterAngle={180} samples={8}>`); 4 leaves visible ghosts ([Raphael Aubry](https://x.com/RaphaelAubryy/status/2104502744010629269)). Cheap version: an SVG `feGaussianBlur stdDeviation="x 0"` driven by speed (`whip()` in `assets/remotion/src/intro/kit.tsx`).
- Never blend across a cut.

## Rhythm and sound

- Pick the music first, then write the script and boards ([nelson](https://x.com/nelsonnn000/status/2042753890592883116)).
- Beat grid: frames per beat = fps × 60 ÷ BPM. Big changes on bars, details on half-beats. Cut on the beat or 2 frames before; start shape changes ~4 frames early.
- Sound is half the perceived quality; place each effect so its attack lands on the visual hit ([Gal Shir's Framer piece](https://x.com/galshirart/status/1975920588372771249), [breakdown](https://x.com/dean_maj/status/1976230209327141241)).

## Restraint

- Every move must mean something; give the brand one signature behaviour and reuse it ([Good Boy Ninja](https://x.com/goodboyninja/status/2011456691846656322)).
- Texture only with a physical reason. Plain film grain, halftone finales and ASCII shaders are now what AI prompts ask for.
- Build a system (3 curves × 3 durations, a grid, a type scale), not one-off animations ([Mitch Paone, DIA](https://x.com/DIA_Mitch/status/1671511766277189632)).
