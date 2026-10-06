# 04 · Cut on the beat

**Sketch:** `beat` · **Clip:** `Clip-04-beat` (with music, synced)

## What it is
Music first. Every beat is a hard cut to a new composition: huge, tiny, bleeding off the frame, stacked, inverted. Each cut lands slightly punched in and settles; small accents hit the off-beats. No crossfades.

## Recipe
- Beat grid: `framesPerBeat = fps * 60 / BPM` (120 BPM at 60 fps = 30 frames).
- Cut on the beat or 2 frames before it; start shape changes ~4 frames early.
- Punch-in: scale 1.06–1.07 → 1.00 over ~0.25 s with an ease-out.
- Off-beat accent: a bar that snaps across on the "and" (beat + 0.5).
- Flip foreground and background colours on some cuts.
- Sound: place each effect so its attack lands on the visual hit; pros layer many small sounds.

## Persian notes
- One to four words per beat. Variable weight (light on the beat, heavy on the "and") works on a whole word, never per letter with boxes.
- A beat counter or progress for RTL runs right to left.

## From X
- [@galshirart](https://x.com/galshirart/status/1975920588372771249) (Framer) with [@dean_maj's breakdown](https://x.com/dean_maj/status/1976230209327141241): a timing system with major and micro beats.
- [@nelsonnn000](https://x.com/nelsonnn000/status/2042753890592883116): music first, then script and boards; 53 hours, no AI.
- [@DIA_Mitch](https://x.com/DIA_Mitch/status/1671511766277189632): kinetic type as a system.
- [@rbakhtiarifard](https://x.com/rbakhtiarifard/status/1727335402737193330): Persian words and lines animated to music (Abar typeface, motion by Mobin Taheri).
