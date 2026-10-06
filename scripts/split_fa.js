/*
 * splitFa: split a Persian word into letters that keep their joined forms.
 *
 * Per-letter animation needs each letter in its own box, and a box is shaped on its
 * own, so letters fall back to their isolated forms. A zero-width joiner (U+200D) on
 * each side that joins a neighbour makes every box take its joined form again.
 *
 *   import { splitFa } from './split_fa.js';
 *   splitFa('می‌شود')  // ['م‍', '‍ی‌', 'ش‍', '‍و', 'د']
 *
 * Keeps لا together (a required ligature), keeps vowel marks and the half-space (ZWNJ)
 * on their letter. Limits: kerning between boxes is lost (words grow a few px at display
 * sizes) and Nastaliq loses its diagonal cascade, so animate Nastaliq by word or line.
 * For full control (dots, kashida, exact positions) use shape_persian.py outlines.
 *
 * Run `node split_fa.js --test` to print sample splits.
 */
const ZWJ = '‍';
const ZWNJ = '‌';
const ARABIC_LETTER = /[ؠ-يٮ-ۓۺ-ۿ]/;
const RIGHT_JOINING = /[آ-إاةد-زوژۀ]/; // آأؤإاةدذرزوژۀ
const MARK = /[ً-ٰٟ]/;
const ALEFS = /[آأإا]/;

const base = (s) => s.replace(/[ً-ٰٟ‌]/g, '');
const joinsForward = (s) => {
	const c = base(s).slice(-1);
	return !s.endsWith(ZWNJ) && ARABIC_LETTER.test(c) && !RIGHT_JOINING.test(c) && c !== 'ء';
};
const joinsBackward = (s) => {
	const c = base(s)[0];
	return ARABIC_LETTER.test(c) && c !== 'ء';
};

export function splitFa(word) {
	const parts = [];
	for (const ch of word) {
		const last = parts.length - 1;
		if (last >= 0 && (MARK.test(ch) || ch === ZWNJ)) parts[last] += ch; // marks and ZWNJ stay on their letter
		else if (last >= 0 && ALEFS.test(ch) && /ل[ً-ٰٟ]*$/.test(parts[last])) parts[last] += ch; // keep لا together
		else parts.push(ch);
	}
	return parts.map((p, i) => {
		const before = i > 0 && joinsForward(parts[i - 1]) && joinsBackward(p) ? ZWJ : '';
		const after = i < parts.length - 1 && joinsForward(p) && joinsBackward(parts[i + 1]) ? ZWJ : '';
		return before + p + after;
	});
}

/* Split a whole line: words stay separate units (split them with splitFa only when needed). */
export function splitWords(line) {
	const seg = new Intl.Segmenter('fa', {granularity: 'word'});
	return [...seg.segment(line)].map((s) => s.segment);
}

if (typeof process !== 'undefined' && process.argv && process.argv.includes('--test')) {
	const show = (s) => s.replace(/‍/g, '⁺').replace(/‌/g, '‿');
	for (const w of ['می‌شود', 'کتاب‌ها', 'مژده', 'لاله', 'ژرفِ', 'سؤال', 'آینده‌ای', 'کارگردان', 'بالا']) {
		console.log(w.padEnd(10), splitFa(w).map(show).join(' | '));
	}
}
