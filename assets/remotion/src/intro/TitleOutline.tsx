/*
 * The Persian title, drawn from HarfBuzz-shaped outlines (glyphs-intro.js), so it can:
 *  - wipe in word by word, right to left,
 *  - drop its dots in after the letter bodies, one by one,
 *  - stretch the joining stroke after گ (a kashida) without touching letter shapes.
 * lint-persian: allow no-rtl  (outlines, not live text)
 */
import React from 'react';
import {GLYPHS} from './glyphs-intro.js';

type Glyph = [number, number, number, number, string, string[], number[][], number];
type Run = {t: string; w: number; g: Glyph[]};
const RUN = (GLYPHS as unknown as Record<string, Run>).titleK;

const TATWEEL = RUN.g.findIndex((g) => g[3] === Array.from(RUN.t).indexOf('ـ'));

/* Words in logical order (rightmost first), as glyph indices. */
const WORDS: number[][] = (() => {
	const words: number[][] = [];
	let cur: number[] = [];
	for (let i = RUN.g.length - 1; i >= 0; i--) {
		const g = RUN.g[i];
		if (!g[4] && !g[5].length) {
			if (cur.length) words.push(cur);
			cur = [];
			continue;
		}
		cur.push(i);
	}
	if (cur.length) words.push(cur);
	return words;
})();

/* Every dot with its glyph, sorted right to left (the order they land). */
const DOTS = RUN.g
	.flatMap((g, gi) => g[5].map((d, k) => ({gi, d, b: g[6][k], x: g[0] + (g[6][k][0] + g[6][k][2]) / 2})))
	.sort((a, b) => b.x - a.x);
export const DOT_COUNT = DOTS.length;
export const WORD_COUNT = WORDS.length;

/* Fall with gravity, then squash and settle. u: seconds since this dot started. */
function dotPose(u: number, above: boolean) {
	if (u < 0) return {y: above ? 1400 : -1100, sx: 1, sy: 1, o: 0};
	const T = 0.2;
	if (u < T) {
		const p = u / T;
		return {y: (above ? 1400 : -1100) * (1 - p * p), sx: 1 - 0.12 * p, sy: 1 + 0.25 * p, o: Math.min(1, p * 3)};
	}
	const v = u - T;
	const k = Math.exp(-v * 16) * Math.cos(v * 34);
	return {y: (above ? 1 : -1) * 60 * Math.max(0, Math.sin(Math.min(1, v / 0.15) * Math.PI)) * Math.exp(-v * 6), sx: 1 + 0.26 * k, sy: 1 - 0.34 * k, o: 1};
}

export const TitleOutline: React.FC<{
	width: number; // px width of the closed title
	cx: number;
	baseline: number;
	color: string;
	wordP: (i: number) => number; // 0..1 reveal per word (logical order)
	dotT: (j: number) => number; // seconds since dot j started falling (negative = not yet)
	kashida: number; // stretch length, font units
}> = ({width, cx, baseline, color, wordP, dotT, kashida}) => {
	const adv = RUN.g[TATWEEL][2]; // the typed ـ's own width; closed means the stroke has zero length
	const closedW = RUN.w - adv;
	const S = width / closedW;
	const L = Math.max(0, kashida);
	const x0 = cx - ((closedW + L) * S) / 2;
	const shift = (gi: number) => (gi > TATWEEL ? L - adv : 0); // glyphs right of the stroke move with it
	return (
		<svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
			<defs>
				{WORDS.map((idxs, wi) => {
					const xs = idxs.map((i) => RUN.g[i][0] + shift(i));
					const xe = idxs.map((i) => RUN.g[i][0] + RUN.g[i][2] + shift(i));
					const a = Math.min(...xs) - 90;
					const b = Math.max(...xe) + 90;
					const vis = (b - a) * Math.max(0, Math.min(1, wordP(wi)));
					return (
						<clipPath key={wi} id={`tw${wi}`}>
							<rect x={b - vis} y={-1600} width={vis} height={4400} />
						</clipPath>
					);
				})}
			</defs>
			<g transform={`translate(${x0} ${baseline}) scale(${S} ${-S})`}>
				{WORDS.map((idxs, wi) => (
					<g key={wi} clipPath={`url(#tw${wi})`}>
						{idxs.map((i) => {
							const g = RUN.g[i];
							if (i === TATWEEL) {
								// the stretchable joining stroke: same thickness as the tatweel glyph
								return <rect key={i} x={g[0] - 20} y={0} width={Math.max(0, L + 40)} height={289} fill={color} opacity={L > 1 ? 1 : 0} />;
							}
							return g[4] ? <path key={i} d={g[4]} transform={`translate(${g[0] + shift(i)} ${g[1]})`} fill={color} /> : null;
						})}
					</g>
				))}
				{DOTS.map((dt, j) => {
					const g = RUN.g[dt.gi];
					const above = (dt.b[1] + dt.b[3]) / 2 > 300;
					const pose = dotPose(dotT(j), above);
					const ax = (dt.b[0] + dt.b[2]) / 2;
					const ay = above ? dt.b[1] : dt.b[3];
					return (
						<g
							key={j}
							opacity={pose.o}
							transform={`translate(${g[0] + shift(dt.gi)} ${g[1] + pose.y}) translate(${ax} ${ay}) scale(${pose.sx} ${pose.sy}) translate(${-ax} ${-ay})`}
						>
							<path d={dt.d} fill={color} />
						</g>
					);
				})}
			</g>
		</svg>
	);
};
