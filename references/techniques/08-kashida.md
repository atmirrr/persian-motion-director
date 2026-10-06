# 08 · Kashida, not letter-spacing

**Sketch:** `kashida` · **Clip:** `Clip-08-kashida`

## What it is
Persian adds rhythm and emphasis by stretching the joining stroke (kashida), not by spacing letters apart. The stroke between م and س in «هرمس» is pulled out like a pen stroke, measured in rhombic dots (the calligrapher's unit), then springs back.

## Recipe
- Shape the word once with a tatweel at the stretch point («هرمـس») to get the stroke's thickness and position, and once without (or subtract the tatweel's advance) for the closed state.
- Draw the stroke as a rect at the joint, width = L + ~40 units of overlap; move every glyph to the right of the joint by L; re-centre the word by L/2.
- Pull: `cubic-bezier(.65,0,.12,1)` over ~1.5 s (slow start, decisive middle, long settle). Release: spring (stiffness 210, damping 15) for a small overshoot.
- Ruler of rhombic dots under the stroke (one per ~330 units), each popping in as the stroke passes it.
- Sync the pull to a held note; land the release on a beat.

## Rules
Only after a letter that joins forward (ب پ ت ث ج چ ح خ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ه ی), never after ا آ د ذ ر ز ژ و ۀ, never inside لا, never next to a half-space, one per word. See `persian-typography.md` §6.

## From X
- [@FontIRAN](https://x.com/FontIRAN/status/1460958644707770377) Dana: kashida as a variable-font axis, so the stretch is smooth.
- [@TS_fonts](https://x.com/TS_fonts/status/1662706118081101825) TS Naskh: a variable cursive kashida.
- [@Saiffdesign](https://x.com/Saiffdesign/status/2106000832713851082): kashida used to carry meaning.
- [@Othman_Phy](https://x.com/Othman_Phy/status/1985077342146838978) Kashida Pro: an After Effects plugin that places stretches by the script's rules.
