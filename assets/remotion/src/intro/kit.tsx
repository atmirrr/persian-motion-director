/*
 * Small building blocks for the intro film. Everything is a function of t (seconds),
 * so any frame can be rendered on its own.
 */
import React from 'react';
import {M} from '../../../sketches/engine.js';
import {FA, MONO} from '../fonts';

export const C = {
	ink: '#0000F2',
	paper: '#F2F2F2',
	spot: '#F2F200',
	black: '#0B0B0C',
	white: '#FFFFFF',
	wrong: '#D93636',
	right: '#14915A',
};

export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const bar = (n: number) => (n - 1) * BAR; // downbeat of 1-indexed bar, in seconds

export const ease = M.ease;
export const remap = M.remap;
export const clamp = M.clamp;
export const mix = M.mix;
export const bez = M.bez;
export const spring = M.spring;
export const steps = M.steps;

/* A cut that lands a little scaled up and settles (the "punch-in"). */
export const punch = (t: number, at: number, amount = 0.06, dur = 0.28) => 1 + amount * (1 - ease.out(remap(t, at, at + dur)));

/* Persian text: always its own RTL box, Vazirmatn, never split into letter boxes. */
export const Fa: React.FC<{
	children: React.ReactNode;
	size: number;
	weight?: number;
	color?: string;
	style?: React.CSSProperties;
}> = ({children, size, weight = 700, color = C.ink, style}) => (
	<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: size, fontWeight: weight, color, lineHeight: 1.7, whiteSpace: 'nowrap', ...style}}>
		{children}
	</div>
);

export const En: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties; mono?: boolean; weight?: number}> = ({
	children,
	size,
	color = C.ink,
	style,
	mono = true,
	weight = 500,
}) => (
	<div dir="ltr" style={{fontFamily: mono ? MONO : FA, fontSize: size, color, fontWeight: weight, letterSpacing: mono ? '0.02em' : 0, whiteSpace: 'nowrap', ...style}}>
		{children}
	</div>
);

/* Reveal right-to-left (reading direction) with generous vertical slack so dots and
   tails are never clipped. p: 0..1 */
export const WipeRTL: React.FC<{p: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, children, style}) => (
	<div style={{clipPath: `inset(-60% 0 -60% ${((1 - clamp(p)) * 100).toFixed(2)}%)`, ...style}}>{children}</div>
);
export const WipeLTR: React.FC<{p: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, children, style}) => (
	<div style={{clipPath: `inset(-60% ${((1 - clamp(p)) * 100).toFixed(2)}% -60% 0)`, ...style}}>{children}</div>
);

/* Typed text, one character per step (16ths by default). Persian is typed in logical
   order inside its own RTL span, so partial words still shape correctly. */
export const typed = (text: string, t: number, start: number, perChar = BEAT / 4) => {
	const chars = Array.from(text);
	const n = Math.max(0, Math.min(chars.length, Math.floor((t - start) / perChar) + 1));
	return t < start ? '' : chars.slice(0, n).join('');
};

/* Whip pan between two layers that share one camera: the old layer leaves to the right,
   the new one arrives from the left (the camera travels left, like the script reads).
   Peak speed lands on `at` (a downbeat). Returns x offsets and a horizontal blur. */
const whipCurve = bez(0.55, 0, 0.45, 1);
export const whip = (t: number, at: number, dur = 0.64) => {
	const p = whipCurve(remap(t, at - dur / 2, at + dur / 2));
	const p2 = whipCurve(remap(t - 1 / 60, at - dur / 2, at + dur / 2));
	const speed = Math.abs(p - p2) * 60; // screens per second
	return {p, blur: Math.min(46, speed * 9), scale: 1 - 0.045 * Math.sin(Math.PI * p)};
};

/* An SVG filter for directional (horizontal) motion blur, referenced by id. */
export const BlurDefs: React.FC<{id: string; x: number}> = ({id, x}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<filter id={id} x="-30%" y="-5%" width="160%" height="110%">
				<feGaussianBlur stdDeviation={`${x.toFixed(2)} 0`} />
			</filter>
		</defs>
	</svg>
);

/* Persian-digit odometer: each digit column rolls to its target on a spring. */
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export const Odometer: React.FC<{value: number; digits: number; t: number; start: number; size: number; color?: string}> = ({
	value,
	digits,
	t,
	start,
	size,
	color = C.ink,
}) => {
	const target = String(value).padStart(digits, '0');
	const cols = Array.from(target).map((d, i) => {
		const sp = spring({k: 120, c: 18})(t - start - i * 0.08);
		const turns = Number(d) + 10 * (digits - i); // every column spins; left ones further
		const pos = sp * turns;
		return {pos, i};
	});
	return (
		<div dir="ltr" style={{display: 'flex', gap: size * 0.06, height: size * 1.5, overflow: 'hidden', fontFamily: FA, fontWeight: 900, fontSize: size, color, lineHeight: 1.5, maskImage: 'linear-gradient(transparent, #000 7%, #000 93%, transparent)'}}>
			{cols.map(({pos, i}) => (
				<div key={i} style={{transform: `translateY(${(-(pos % 10) * 1.5).toFixed(4)}em)`, display: 'flex', flexDirection: 'column'}}>
					{Array.from(FA_DIGITS + FA_DIGITS[0]).map((ch, k) => (
						<span key={k} style={{height: '1.5em', display: 'block', textAlign: 'center'}}>
							{ch}
						</span>
					))}
				</div>
			))}
		</div>
	);
};

/* Per-letter boxes: what naive code does to Persian. Only used to show the mistake.
   lint-persian: allow letter-boxes */
export const BrokenFa: React.FC<{text: string; size: number; color: string; weight?: number; fall?: (i: number) => {y: number; r: number; o: number}}> = ({
	text,
	size,
	color,
	weight = 800,
	fall,
}) => (
	<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: size, fontWeight: weight, color, lineHeight: 1.6, whiteSpace: 'nowrap'}}>
		{Array.from(text).map((ch, i) => {
			const f = fall ? fall(i) : {y: 0, r: 0, o: 1};
			return ch === ' ' ? (
				<span key={i}> </span>
			) : (
				<span key={i} style={{display: 'inline-block', transform: `translateY(${f.y}px) rotate(${f.r}deg)`, opacity: f.o}}>
					{ch}
				</span>
			);
		})}
	</div>
);
