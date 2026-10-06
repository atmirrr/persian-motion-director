# Persian typography in motion

Every rule here was checked in Chrome, the engine Remotion renders with. Sources: W3C [Arabic & Persian Layout Requirements](https://www.w3.org/TR/alreq/) (alreq), [CSS Text 3](https://drafts.csswg.org/css-text-3/), Unicode [ArabicShaping.txt](https://www.unicode.org/Public/UCD/latest/ucd/ArabicShaping.txt).

## Contents
1. Joining: boxes, spans and seams
2. Per-letter and per-dot animation that keeps joins
3. Masks, line height and clipping
4. Direction: bidi, reveals, camera, icons
5. Characters: ی ک, digits, half-space, punctuation
6. Kashida instead of letter-spacing
7. Fonts and loading
8. Review checklist

## 1. Joining: boxes, spans and seams

Persian letters change shape by position and join to their neighbours. The browser can only join letters that sit in the same text run.

- **Boxes break joins.** `display: inline-block`, flex items and grid items are shaped on their own, so a per-letter `inline-block` (needed for per-letter transforms) shows every letter in its isolated form. Measured: «بیشتر» goes from 125.8 px to 222.8 px wide with letter boxes. Remotion's `<AbsoluteFill>` is `display: flex`, so its direct children are boxes too: wrap each Persian line in one plain element.
- **Plain inline spans are safe** for colour, font-weight and `position: relative`; Chrome shapes across them ([CSS Text §7.3](https://drafts.csswg.org/css-text-3/#boundary-shaping)). A weight wave through a line can be per-letter inline spans.
- **`<bdi>` or `unicode-bidi: isolate` around part of a word breaks the join** (the spec requires it). Isolate whole words or Latin runs only.
- **Fade words, not letters.** Joined letters overlap slightly. Per-letter `opacity`, an `rgba()` text colour or `-webkit-text-stroke` doubles the overlap and leaves a seam at every join (alreq §4.3.7). Fade the word or line as one layer (element `opacity`).

## 2. Per-letter and per-dot animation that keeps joins

Two ways, depending on how much control you need:

**Outlines (full control).** `scripts/shape_persian.py` shapes the text with HarfBuzz (direction RTL, script Arab, language fa) and exports each glyph's outline in its joined form, at its exact position, split into the body and the dots, tagged with its connected letter group:

```bash
pip install uharfbuzz fonttools
python3 scripts/shape_persian.py Vazirmatn-VF.ttf --lines lines.tsv --js glyphs.js
# lines.tsv:  title<TAB>800<TAB>کارگردان موشن فارسی
```

Glyphs come out in visual order (index 0 is leftmost). Each entry is `[x, y, advance, cluster, bodyPath, [dotPaths], [dotBounds], group]` in font units (y up). Use it for: dots dropping in after the letters (`nuqta`), kashida stretching (`kashida`), paper pieces per connected group (`cutout`), any per-glyph move.

**Zero-width joiners (lighter).** Put U+200D on each side of a letter that joins its neighbour, so each letter box still takes its joined form. `scripts/split_fa.js` does it and keeps لا together, vowel marks and half-spaces attached. Limits: kerning between boxes is lost (words come out a few px wider at display sizes) and Nastaliq loses its cascade, so animate Nastaliq by whole word or line only.

## 3. Masks, line height and clipping

Arabic-script letters reach far above and below Latin (alreq §7.4). Vazirmatn at 100 px: ascent 103 px, descent 54 px, and گ reaches about 80 px above the baseline.

- `line-height: 1` with `overflow: hidden` cuts the top of گ and the dots under پ ی ب. Use line-height ≥ 1.6 for Naskh-style fonts, ≥ 2.4 for Nastaliq.
- Pad reveal masks generously:

```css
.reveal-rtl { clip-path: inset(-0.6em 0 -0.6em calc((1 - var(--p)) * 100%)); } /* opens from the right */
.mask       { overflow: clip; overflow-clip-margin: 0.5em; }
```

Nastaliq needs at least 1.2em of vertical slack and some room on the right edge, where the first letter sticks out.

## 4. Direction: bidi, reveals, camera, icons

- Set `dir="rtl" lang="fa"` on every Persian block (not `ar`). In a left-to-right box the full stop jumps to the wrong end.
- Wrap every Latin word or number inside Persian: `<bdi>Hermes 2.1</bdi>`, or in plain strings `"⁨Hermes⁩"` (FSI/PDI). Unwrapped, «از C++ و Hermes!» renders "++C" and "!Hermes".
- Don't use `dir="auto"` or `unicode-bidi: plaintext` on lines that start with a Latin brand: the whole line flips to left-to-right.
- Motion follows reading direction: reveals and staggers start on the right; the first word is the rightmost; "enter from the start" is `translateX(+x → 0)`; progress fills right to left; camera progress travels left (the next scene is to the left, so content moves right).
- Mirror back/next arrows yourself (→ is not mirrored automatically). Never mirror play buttons, clocks or numbers.
- Word-level splitting: `Intl.Segmenter('fa', {granularity: 'word'})` keeps می‌شود as one word.

## 5. Characters: ی ک, digits, half-space, punctuation

| Use | Not | Why |
|---|---|---|
| ی U+06CC, ک U+06A9 | ي U+064A, ك U+0643 | Arabic ي keeps two dots at the end of a word; ك has a mark inside |
| ۰۱۲۳۴۵۶۷۸۹ U+06F0–06F9 | ٠١٢٣٤٥٦٧٨٩ U+0660–0669 | ۴ ۵ ۶ are drawn differently, and the two sets order differently next to Latin |
| می‌شود, کتاب‌ها, بزرگ‌ترین, خانه‌ای (U+200C) | می شود, میشود | The half-space keeps the word one word without joining |
| ، ؛ ؟ « » | , ; ? " " | Persian punctuation and quotes |

- Never use U+200B (zero-width space) for a half-space: it doesn't stop joining.
- `new Intl.NumberFormat('fa-IR').format(1234567.89)` → ۱٬۲۳۴٬۵۶۷٫۸۹ with the right separators.
- Fontiran's "FaNum" builds draw ASCII digits as Persian; don't mix those with real Persian digits.

## 6. Kashida instead of letter-spacing

- Chrome ignores `letter-spacing` between Persian letters since version 137 (it only widens spaces), and other tools break the joins with it. "Tracking-in" animations don't work in Persian.
- Stretch the joining stroke instead (kashida, ـ U+0640):
  - only after a letter that joins forward: ب پ ت ث ج چ ح خ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ه ی;
  - never after ا آ د ذ ر ز ژ و ۀ, never inside لا, never next to a half-space, and after any vowel mark;
  - at most one per word (alreq §7.2.5). Preferred spots: after س ش ص ض at the start or middle of a word, then before a final ب ر ه ا.
- Each typed ـ is a fixed jump (~0.28em in Vazirmatn). For a smooth pull, scale the joining stroke between two shaped glyphs (as the `kashida` sketch does) or animate a font with a stretch axis (Fontiran's Dana and Morabba have one).
- Calligraphers measure stretches in rhombic dots (nuqta): a stretch of 6–12 dots is a gesture, not a gap.

## 7. Fonts and loading

- Persian-native fonts: Vazirmatn (OFL, Google Fonts, weight 100–900), Estedad (OFL, Google Fonts), Lalezar (OFL, display), Noto Nastaliq Urdu (OFL, but tuned for Urdu: check digits and ه/ی forms). Commercial (Fontiran): IRANSans, Yekan Bakh, Dana, Morabba, Pelak, Pesteh; check whether your licence covers embedding the font in a render pipeline.
- Arabic-styled fonts (generic Naskh or Kufi made for Arabic) draw ی, ه and the digits in Arabic shapes; Persian readers notice.
- Load the font before the first frame. In Remotion:

```ts
const handle = delayRender('Loading Vazirmatn');
const face = new FontFace('Vazirmatn', `url(${staticFile('fonts/Vazirmatn-VF.woff2')}) format('woff2')`, {weight: '100 900'});
face.load().then((f) => { document.fonts.add(f); continueRender(handle); });
// with @remotion/google-fonts: loadFont('normal', {weights: ['400', '800'], subsets: ['arabic', 'latin']})
```

Without the Arabic-script subset, Chrome falls back to a system font, and a Linux render server's fallback differs from your Mac's.

## 8. Review checklist

Before every render, at full size:

- [ ] No letter is in its isolated form inside a word (no per-letter boxes).
- [ ] No seams at joins (no per-letter fades).
- [ ] No clipped dots, tails or the top of گ.
- [ ] Every Persian block is `dir="rtl" lang="fa"`; Latin is isolated with `<bdi>`.
- [ ] `lint_persian.py copy` passes: Persian ی ک, Persian digits, half-spaces, Persian punctuation.
- [ ] Reveals, staggers, progress and camera travel run right to left.
- [ ] Emphasis uses kashida in allowed places, never letter-spacing.
- [ ] The Persian font is loaded (no fallback).
- [ ] A native reader has signed off on the copy.
