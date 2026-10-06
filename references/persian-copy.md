# Persian copy for motion

Type in motion is read in a second or two, so awkward Persian is louder on screen than on a page. Machine-written Persian goes wrong in predictable ways.

## Rules

- **One register.** Pick formal (شما، می‌کنید) or warm-colloquial (می‌کنی، رو) for the whole piece and stay there. Mixing them in one line is the most common machine-copy tell.
- **Say it the Persian way.** Translate the meaning, not the words. "Seamless" is روان و یکپارچه, not بی‌درز; "game-changer" is something like تحولی واقعی or just drop it.
- **Short lines.** Kinetic type works best at 1–4 words per beat. Write for the beat grid, not for a paragraph.
- **Brand names stay Latin** unless the brand has an official Persian name; isolate them with `<bdi>`.
- **Persian characters and punctuation** (see `persian-typography.md` §5), then run the linter.
- **A native reader signs off** on every line before the render. If the user is a native speaker, show them the copy as a table (line, timing, Persian, English gloss) and get an explicit yes.

## Common machine-copy mistakes

| Wrong | Right | Why |
|---|---|---|
| میشود / می شود | می‌شود | Half-space after می |
| خانه ها / بزرگ ترین | خانه‌ها / بزرگ‌ترین | A full space splits the word, including in word-by-word animation |
| يك كيفيت عالي | یک کیفیت عالی | Arabic letters; the final ي shows its dots |
| ٢٠٢٦ / 1,234.5 | ۲۰۲۶ / ۱٬۲۳۴٫۵ | Wrong digits change the look and the ordering |
| آماده‌اید? "Hermes" را امتحان کنید, حالا! | آماده‌اید؟ «Hermes» را امتحان کنید، حالا! | Persian punctuation and quote marks |
| تجربه‌ای بی‌درز / تغییردهندهٔ بازی | تجربه‌ای روان و یکپارچه / تحولی واقعی | Word-for-word copies of English idioms |
| امتحانش کن؛ شما عاشقش خواهید شد | امتحانش کنید؛ عاشقش می‌شوید | Mixed informal and formal "you"; stiff future tense |

## Tools

- `python3 scripts/lint_persian.py copy copy.txt` flags Arabic letters and digits, missing half-spaces in common patterns, English punctuation and misplaced kashida.
- [Virastar](https://github.com/brothersincode/virastar) (MIT) fixes letters, digits, punctuation and half-spaces automatically. It deletes kashida by default; switch off `cleanup_kashidas` if you placed any on purpose.
