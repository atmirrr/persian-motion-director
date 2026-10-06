/*
 * Intro film for persian-motion-director, built with its own rules:
 * music first (assets/music/compose_shur_pulse.py, 120 BPM, Shur on D), every cut on a
 * beat, one camera that whips right-to-left between sections, Persian set correctly.
 *
 * lint-persian: allow letter-boxes  (the "wrong" examples break Persian on purpose)
 *
 * Bar map (1 bar = 2 s): 1-2 cold open, 3-4 title, 5-8 drop, 9-24 techniques (2 bars each),
 * 25-28 checklist, 29-32 flips, 33-36 how-to, 37-41 end card (final hit on bar 40).
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MONO} from '../fonts';
import {SketchId, SketchPlayer} from '../SketchPlayer';
import {
	bez,
	BlurDefs,
	BrokenFa,
	C,
	clamp,
	ease,
	En,
	Fa,
	Odometer,
	punch,
	remap,
	spring,
	steps,
	typed,
	whip,
	WipeLTR,
	WipeRTL,
} from './kit';
import {TitleOutline} from './TitleOutline';

export const INTRO_SECONDS = 82;
const W = 1920;
const FA_NUM = '۰۱۲۳۴۵۶۷۸۹';
const faNum = (n: number) => String(n).replace(/\d/g, (d) => FA_NUM[Number(d)]);

/* Section changes that travel with the camera (whip pans peak on these downbeats). */
const WHIPS = {strip: 16, checklist: 48, flips: 56, howto: 64, end: 72};

/* Horizontal offset, blur and scale of a section layer that arrives with a whip at `tin`
   and leaves with one at `tout`. The camera travels left, so layers move right. */
function layer(t: number, tin: number | null, tout: number | null) {
	const a = tin === null ? {p: 1, blur: 0, scale: 1} : whip(t, tin);
	const b = tout === null ? {p: 0, blur: 0, scale: 1} : whip(t, tout);
	const x = -W * (1 - a.p) + W * b.p;
	return {x, blur: Math.max(a.blur, b.blur), scale: Math.min(a.scale, b.scale)};
}

const Layer: React.FC<{id: string; t: number; tin: number | null; tout: number | null; bg: string; children: React.ReactNode}> = ({id, t, tin, tout, bg, children}) => {
	const l = layer(t, tin, tout);
	return (
		<AbsoluteFill style={{transform: `translateX(${l.x.toFixed(2)}px) scale(${l.scale.toFixed(4)})`, filter: l.blur > 0.3 ? `url(#${id})` : undefined}}>
			<BlurDefs id={id} x={l.blur} />
			<AbsoluteFill style={{background: bg}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</AbsoluteFill>
);

/* ---------------------------------------------------------------- 0-4 s: the default */
const ColdOpen: React.FC<{t: number}> = ({t}) => {
	// the title is already up on frame 0 (X uses the first frame as the poster); the subtitle
	// still fades up on the default curve, which is the joke
	const a = 1;
	const b = ease.inOut(remap(t, 0.35, 1.25));
	const ts = steps(t, 24, 2);
	const fall = (i: number) => {
		const u = ts - 3.0 - (i % 7) * 0.04;
		if (u <= 0) return {y: 30 * (1 - a), r: 0, o: a};
		return {y: 0.5 * 3000 * u * u, r: (((i * 37) % 11) - 5) * u * 40, o: 1};
	};
	return (
		<AbsoluteFill style={{background: 'linear-gradient(135deg, #6D5BF5 0%, #3B82F6 55%, #22D3EE 100%)'}}>
			<En size={22} color="rgba(255,255,255,.8)" style={{position: 'absolute', top: 56, left: 72}}>
				AI DEFAULT · fade · ease-in-out · centered · gradient
			</En>
			<Center>
				<BrokenFa text="کارگردان موشن فارسی" size={124} color="#fff" fall={fall} />
				<Fa size={40} weight={400} color="rgba(255,255,255,.85)" style={{opacity: b * (1 - remap(ts, 3.0, 3.3)), transform: `translateY(${20 * (1 - b)}px)`}}>
					اسلایدِ اول
				</Fa>
			</Center>
			<div style={{position: 'absolute', bottom: 64, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, opacity: a * (1 - remap(ts, 3.0, 3.3))}}>
				{Array.from({length: 12}).map((_, i) => (
					<i key={i} style={{width: 12, height: 12, borderRadius: 6, background: i === 0 ? '#fff' : 'rgba(255,255,255,.35)'}} />
				))}
			</div>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 4-8 s: the title builds */
const pull = bez(0.65, 0, 0.12, 1);
const TitleBuild: React.FC<{t: number}> = ({t}) => {
	const wordP = (i: number) => ease.out(remap(t, 4.0 + i * 0.5, 4.45 + i * 0.5));
	const dotT = (j: number) => t - (5.5 + j * 0.125);
	const back = spring({k: 300, c: 18})(t - 7.7);
	const L = 2600 * pull(remap(t, 6.25, 7.25)) * (t < 7.7 ? 1 : 1 - back);
	const en = typed('persian-motion-director', t, 6.5, 1 / 24);
	return (
		<AbsoluteFill style={{background: C.paper}}>
			<TitleOutline width={1500} cx={960} baseline={575} color={C.ink} wordP={wordP} dotT={dotT} kashida={L} />
			<En size={46} color={C.ink} style={{position: 'absolute', top: 712, left: 0, right: 0, textAlign: 'center'}}>
				{en}
				<span style={{opacity: t > 6.5 && Math.floor(t * 4) % 2 === 0 ? 1 : 0}}>▍</span>
			</En>
			<div style={{position: 'absolute', top: 56, right: 80, opacity: ease.out(remap(t, 6.0, 6.4))}}>
				<Fa size={32} weight={600}>
					اسکیلِ متن‌باز برای <bdi dir="ltr">Claude</bdi>
				</Fa>
			</div>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 8-16 s: the drop */
const Drop: React.FC<{t: number}> = ({t}) => {
	const blue = (t >= 8 && t < 10) || (t >= 11 && t < 12) || t >= 14;
	const fg = blue ? C.paper : C.ink;
	const accent = blue ? C.spot : C.ink;
	let body: React.ReactNode = null;
	let at = 8;
	if (t < 10) {
		at = 8;
		body = (
			<>
				<TitleOutline width={1500} cx={960} baseline={560} color={fg} wordP={() => 1} dotT={() => 5} kashida={1700 * ease.out(remap(t, 9.0, 9.35)) * (1 - spring({k: 260, c: 17})(t - 9.75))} />
				<WipeLTR p={ease.out(remap(t, 8.5, 8.9))} style={{position: 'absolute', top: 700, left: 0, right: 0}}>
					<En size={46} color={accent} style={{textAlign: 'center'}}>
						persian-motion-director
					</En>
				</WipeLTR>
			</>
		);
	} else if (t < 11) {
		at = 10;
		body = (
			<Center>
				<Fa size={250} weight={900} color={fg} style={{lineHeight: 1.25}}>
					۸ تکنیک
				</Fa>
				<En size={38} color={accent}>8 techniques from how pros work</En>
			</Center>
		);
	} else if (t < 12) {
		at = 11;
		body = (
			<Center>
				<Fa size={170} weight={900} color={fg} style={{lineHeight: 1.3}}>
					۱ چک‌لیستِ فارسی
				</Fa>
				<En size={38} color={accent}>1 checklist for correct Persian</En>
			</Center>
		);
	} else if (t < 14) {
		at = 12;
		body = (
			<Center>
				<Odometer value={100} digits={3} t={t} start={12.05} size={300} color={fg} />
				<Fa size={64} weight={700} color={fg}>
					پست از حرفه‌ای‌های موشن در ایکس
				</Fa>
				<En size={32} color={accent} style={{marginTop: 6}}>
					X posts from pro motion designers, each one checked
				</En>
			</Center>
		);
	} else {
		at = 14;
		const arrow = ease.in(remap(t, 15.3, 15.68));
		body = (
			<Center>
				<Fa size={210} weight={900} color={fg} style={{lineHeight: 1.3}}>
					بدون اسلایدشو.
				</Fa>
				<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
					<En size={40} color={accent}>No slideshows.</En>
					<span style={{fontFamily: MONO, fontSize: 56, color: accent, transform: `translateX(${-arrow * 120}px)`, opacity: t > 14.5 ? 1 : 0}}>←</span>
				</div>
			</Center>
		);
	}
	return (
		<AbsoluteFill style={{background: blue ? C.ink : C.paper}}>
			<AbsoluteFill style={{transform: `scale(${punch(t, at)})`}}>{body}</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 16-48 s: the techniques */
const SCREENS: {id: SketchId; fa: string; en: string; off: number}[] = [
	{id: 'oner', fa: 'یک دوربین، بدون کات', en: 'One camera, no cuts', off: 0.6},
	{id: 'match', fa: 'یک شکل، کلِ داستان', en: 'One shape carries the story', off: 1.0},
	{id: 'ui', fa: 'رابطِ واقعی، کارگردانی‌شده', en: 'The real UI, directed', off: 0.6},
	{id: 'beat', fa: 'کات روی ضرب', en: 'Cut on the beat', off: 0},
	{id: 'boil', fa: 'دوفریمی، با خطِ لرزان', en: 'On twos, with line boil', off: 0.6},
	{id: 'cutout', fa: 'حروفِ کاغذی', en: 'Paper cut-out letters', off: 0.2},
	{id: 'nuqta', fa: 'نقطه‌ها آخر', en: 'Dots last', off: 0},
	{id: 'kashida', fa: 'کشیده، نه فاصله', en: 'Kashida, not letter-spacing', off: 0.3},
];

const Strip: React.FC<{t: number}> = ({t}) => {
	let pos = 0;
	let blur = 0;
	let scale = 1;
	for (let k = 1; k < SCREENS.length; k++) {
		const w = whip(t, 16 + 4 * k);
		pos += w.p;
		blur = Math.max(blur, w.blur);
		scale = Math.min(scale, w.scale);
	}
	return (
		<AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
			<BlurDefs id="stripBlur" x={blur} />
			<AbsoluteFill style={{transform: `translateX(${(pos * W).toFixed(2)}px) scale(${scale.toFixed(4)})`, filter: blur > 0.3 ? 'url(#stripBlur)' : undefined}}>
				{SCREENS.map((s, k) => {
					const s0 = 16 + 4 * k;
					const near = t > s0 - 0.7 && t < s0 + 4.7;
					const local = t - s0;
					const titleP = ease.out(remap(local, 0.12, 0.6));
					const enText = typed(`${String(k + 1).padStart(2, '0')}  ${s.en}`, t, s0 + 0.5, 1 / 40);
					return (
						<div key={s.id} style={{position: 'absolute', left: -k * W, top: 0, width: W, height: 1080}}>
							{/* background numeral, slower than the camera: depth */}
							<div style={{position: 'absolute', left: 60, top: -120, transform: `translateX(${((k - pos) * W * 0.45).toFixed(1)}px)`}}>
								<Fa size={980} weight={900} color="rgba(0,0,242,0.06)" style={{lineHeight: 1}}>
									{faNum(k + 1)}
								</Fa>
							</div>
							<div style={{position: 'absolute', left: 240, top: 60, width: 1440, height: 810, borderRadius: 28, overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,60,0.16), 0 0 0 1px rgba(0,0,60,0.06)'}}>
								<SketchPlayer id={s.id} time={Math.max(0, local) + s.off} active={near} />
							</div>
							<div style={{position: 'absolute', right: 240, top: 890}}>
								<WipeRTL p={titleP}>
									<Fa size={60} weight={800}>
										<span style={{color: C.ink}}>{faNum(k + 1)}</span>
										<span style={{color: 'rgba(0,0,242,0.35)'}}> / </span>
										{s.fa}
									</Fa>
								</WipeRTL>
							</div>
							<En size={26} color="rgba(11,11,12,0.6)" style={{position: 'absolute', left: 242, top: 924}}>
								{enText}
							</En>
						</div>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 48-56 s: the checklist */
const ITEMS = [
	{fa: 'اتصالِ درستِ حروف', en: 'Letters stay joined'},
	{fa: 'ماسکی که نقطه را نبُرد', en: 'Masks that keep the dots'},
	{fa: 'اعدادِ فارسی', en: 'Persian digits'},
	{fa: '«ی» و «ک» فارسی', en: 'Persian ye and kaf'},
	{fa: 'نیم‌فاصله', en: 'The half-space'},
	{fa: 'جهتِ راست به چپ', en: 'Right to left'},
];
const Checklist: React.FC<{t: number}> = ({t}) => (
	<AbsoluteFill>
		<div style={{position: 'absolute', right: 160, top: 110}}>
			<WipeRTL p={ease.out(remap(t, 48.3, 48.9))}>
				<Fa size={84} weight={900}>
					و یک چک‌لیست برای فارسیِ درست
				</Fa>
			</WipeRTL>
			<En size={30} color="rgba(11,11,12,0.6)" style={{textAlign: 'right', opacity: ease.out(remap(t, 48.8, 49.2))}}>
				And a checklist for correct Persian
			</En>
		</div>
		{ITEMS.map((it, i) => {
			const col = i % 2;
			const row = Math.floor(i / 2);
			const p = ease.out(remap(t, 49.0 + i * 0.5, 49.45 + i * 0.5));
			return (
				<div key={i} dir="rtl" style={{position: 'absolute', right: 160 + col * 820, top: 420 + row * 180, width: 760, opacity: p, transform: `translateY(${(1 - p) * 24}px)`, display: 'flex', alignItems: 'center', gap: 28}}>
					<div style={{width: 96, height: 96, borderRadius: 48, background: C.ink, display: 'grid', placeItems: 'center', flex: 'none'}}>
						<Fa size={50} weight={900} color={C.paper} style={{lineHeight: 1}}>
							{faNum(i + 1)}
						</Fa>
					</div>
					<div>
						<Fa size={56} weight={800} style={{lineHeight: 1.4}}>
							{it.fa}
						</Fa>
						<En size={24} color="rgba(11,11,12,0.55)">{it.en}</En>
					</div>
				</div>
			);
		})}
	</AbsoluteFill>
);

/* ---------------------------------------------------------------- 56-64 s: wrong / right on every beat */
const Tag: React.FC<{ok: boolean}> = ({ok}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '10px 26px', borderRadius: 999, background: ok ? C.right : C.wrong}}>
		<Fa size={40} weight={800} color="#fff" style={{lineHeight: 1.3}}>
			{ok ? '✓ درست' : '✗ غلط'}
		</Fa>
		<En size={26} color="rgba(255,255,255,0.85)">
			{ok ? 'right' : 'wrong'}
		</En>
	</div>
);

const SeamWord: React.FC<{text: string; size: number; color: string; perLetter: boolean}> = ({text, size, color, perLetter}) => (
	<div dir="rtl" lang="fa" style={{fontFamily: '"Vazirmatn"', fontWeight: 900, fontSize: size, color, lineHeight: 1.6, whiteSpace: 'nowrap', opacity: perLetter ? 1 : 0.4}}>
		{perLetter ? Array.from(text).map((c, i) => <span key={i} style={{opacity: 0.4}}>{c}</span>) : text}
	</div>
);

const Flips: React.FC<{t: number}> = ({t}) => {
	const k = clamp(Math.floor(t - 56), 0, 7);
	const ok = t - 56 - k >= 0.5;
	const local = t - 56 - k - (ok ? 0.5 : 0);
	const blue = k % 2 === 1;
	const fg = blue ? C.paper : C.ink;
	const size = 150;
	const items: {topic: string; en: string; show: (ok: boolean) => React.ReactNode}[] = [
		{topic: 'اتصالِ حروف', en: 'letter joining', show: (o) => (o ? <Fa size={size} weight={900} color={fg}>کارگردان</Fa> : <BrokenFa text="کارگردان" size={size} color={fg} weight={900} />)},
		{topic: 'اعداد', en: 'digits', show: (o) => <Fa size={size} weight={900} color={fg}>{o ? '۲۴ ساعته' : '٢٤ ساعته'}</Fa>},
		{topic: '«ی» و «ک»', en: 'ye and kaf', show: (o) => <Fa size={120} weight={900} color={fg}>{o ? 'یک دستیار شخصی' : 'يك دستيار شخصي'}</Fa>},
		{topic: 'نیم‌فاصله', en: 'half-space', show: (o) => <Fa size={size} weight={900} color={fg}>{o ? 'می‌شود' : 'می شود'}</Fa>},
		{
			topic: 'ماسک و نقطه',
			en: 'masks and dots',
			show: (o) => (
				<div style={{overflow: 'hidden', ...(o ? {padding: '0.5em 0'} : {height: '1em'}), fontSize: size, lineHeight: 1, display: 'inline-block'}}>
					<Fa size={size} weight={900} color={fg} style={{lineHeight: 1}}>
						گزارش پیامت
					</Fa>
				</div>
			),
		},
		{topic: 'محو شدن', en: 'fading', show: (o) => <SeamWord text="همیشه بیدار" size={size} color={fg} perLetter={!o} />},
		{
			topic: 'جهتِ متن',
			en: 'text direction',
			show: (o) =>
				o ? (
					<Fa size={96} weight={800} color={fg}>
						نسخه‌ی <bdi dir="ltr">Hermes 2.1</bdi> آماده است.
					</Fa>
				) : (
					<div dir="ltr" style={{fontFamily: '"Vazirmatn"', fontSize: 96, fontWeight: 800, color: fg, lineHeight: 1.7, whiteSpace: 'nowrap'}}>
						نسخه‌ی Hermes 2.1 آماده است.
					</div>
				),
		},
		{
			topic: 'جهتِ حرکت',
			en: 'motion direction',
			show: (o) => {
				const p = ease.out(remap(local, 0.02, 0.4));
				const inner = (
					<Fa size={size} weight={900} color={fg}>
						همیشه بیدار
					</Fa>
				);
				return o ? <WipeRTL p={p}>{inner}</WipeRTL> : <WipeLTR p={p}>{inner}</WipeLTR>;
			},
		},
	];
	const it = items[k];
	const at = 56 + k + (ok ? 0.5 : 0);
	return (
		<AbsoluteFill style={{background: blue ? C.ink : C.paper}}>
			<AbsoluteFill style={{transform: `scale(${punch(t, at, 0.05, 0.22)})`}}>
				<Center style={{gap: 30}}>
					<Tag ok={ok} />
					<div style={{minHeight: 260, display: 'grid', placeItems: 'center'}}>{it.show(ok)}</div>
				</Center>
				<div style={{position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 22}}>
					<Fa size={44} weight={700} color={fg}>
						{it.topic}
					</Fa>
					<En size={26} color={blue ? 'rgba(242,242,242,0.7)' : 'rgba(11,11,12,0.55)'}>
						{it.en}
					</En>
				</div>
				<En size={24} color={blue ? 'rgba(242,242,242,0.6)' : 'rgba(11,11,12,0.45)'} style={{position: 'absolute', top: 60, left: 72}}>
					{`${k + 1} / 8`}
				</En>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 64-72 s: how you use it */
const STEPS = [
	{fa: 'نصب کنید', en: 'install', at: 64},
	{fa: 'بخواهید', en: 'ask', at: 66},
	{fa: 'کارگردانی می‌کند', en: 'it directs', at: 68},
];
const HowTo: React.FC<{t: number}> = ({t}) => {
	const l1 = typed('$ git clone github.com/atmirrr/persian-motion-director', t, 64.25, 1 / 60);
	const l2 = typed('    ~/.claude/skills/persian-motion-director', t, 65.2, 1 / 60);
	const l3 = typed('یه تیزرِ ۳۰ ثانیه‌ای برای محصولم بساز', t, 66.25, 1 / 22);
	const show4 = t >= 68.0;
	const show5 = t >= 68.5;
	const show6 = t >= 69.5;
	const line: React.CSSProperties = {fontFamily: MONO, fontSize: 32, color: '#E9E9EE', lineHeight: 1.9, whiteSpace: 'pre'};
	return (
		<AbsoluteFill>
			<div dir="rtl" style={{position: 'absolute', top: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 70}}>
				{STEPS.map((s, i) => {
					const on = t >= s.at;
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: on ? 1 : 0.28, transform: `scale(${on ? punch(t, s.at, 0.08, 0.25) : 1})`}}>
							<div style={{width: 64, height: 64, borderRadius: 32, background: on ? C.ink : 'transparent', border: `3px solid ${C.ink}`, display: 'grid', placeItems: 'center'}}>
								<Fa size={34} weight={900} color={on ? C.paper : C.ink} style={{lineHeight: 1}}>
									{faNum(i + 1)}
								</Fa>
							</div>
							<div>
								<Fa size={46} weight={800} style={{lineHeight: 1.3}}>
									{s.fa}
								</Fa>
								<En size={22} color="rgba(11,11,12,0.55)">{s.en}</En>
							</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 220, top: 300, width: 1480, height: 560, borderRadius: 26, background: C.black, boxShadow: '0 30px 90px rgba(0,0,40,0.25)', overflow: 'hidden'}}>
				<div style={{height: 56, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
					{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
						<i key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
					))}
					<span style={{fontFamily: MONO, fontSize: 20, color: 'rgba(255,255,255,0.45)', marginLeft: 16}}>~/projects/teaser</span>
				</div>
				<div style={{padding: '26px 40px'}}>
					<div style={line}>{l1}</div>
					<div style={{...line, color: 'rgba(233,233,238,0.65)'}}>{l2}</div>
					<div style={{...line, display: 'flex', gap: 18, alignItems: 'baseline'}}>
						<span style={{color: C.spot}}>{t >= 66.0 ? '>' : ''}</span>
						<bdi dir="rtl" lang="fa" style={{fontFamily: '"Vazirmatn"', fontSize: 34, color: '#fff'}}>
							{l3}
						</bdi>
					</div>
					<div style={{...line, opacity: show4 ? 1 : 0}}>
						<span style={{color: '#28C840'}}>●</span> persian-motion-director
					</div>
					<div style={{...line, opacity: show5 ? 1 : 0, display: 'flex'}}>
						<span>{'  '}</span>
						<bdi dir="rtl" lang="fa" style={{fontFamily: '"Vazirmatn"', fontSize: 30, color: 'rgba(233,233,238,0.8)'}}>
							۸ تکنیک · چک‌لیستِ فارسی · موسیقی اول
						</bdi>
					</div>
					<div style={{...line, opacity: show6 ? 1 : 0, color: '#28C840'}}>✓ rendered 1920×1080 · 60 fps</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 72-82 s: end card, final hit on bar 40 */
const EndCard: React.FC<{t: number}> = ({t}) => {
	const en = typed('persian-motion-director', t, 72.25, 1 / 24);
	const wordP = (i: number) => ease.out(remap(t, 74.0 + i * 0.25, 74.4 + i * 0.25));
	const dotT = (j: number) => t - (74.75 + j * 0.125);
	const k = 2300 * bez(0.3, 0, 0.1, 1)(remap(t, 78.0, 78.45));
	const flash = t >= 78 ? Math.max(0, 1 - (t - 78) / 0.3) * 0.35 : 0;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{transform: `scale(${punch(t, 78, 0.035, 0.4)})`}}>
				<TitleOutline width={1240} cx={960} baseline={440} color={C.paper} wordP={wordP} dotT={dotT} kashida={k} />
				<En size={64} color={C.paper} weight={600} style={{position: 'absolute', top: 548, left: 0, right: 0, textAlign: 'center'}}>
					{en}
				</En>
				<div style={{position: 'absolute', top: 666, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 26, opacity: ease.out(remap(t, 76.0, 76.3))}}>
					<Fa size={46} weight={700} color={C.paper}>
						رایگان و متن‌باز
					</Fa>
					<En size={30} color="rgba(242,242,242,0.75)">Free &amp; open source</En>
				</div>
				<WipeLTR p={ease.out(remap(t, 77.0, 77.45))} style={{position: 'absolute', top: 770, left: 0, right: 0}}>
					<En size={42} color={C.spot} style={{textAlign: 'center'}}>
						github.com/atmirrr/persian-motion-director
					</En>
				</WipeLTR>
			</AbsoluteFill>
			<div style={{position: 'absolute', bottom: 46, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'baseline', opacity: ease.out(remap(t, 79.5, 80.0))}}>
				<Fa size={24} weight={500} color="rgba(242,242,242,0.7)">
					موسیقی: اوریجینال، نوشته‌شده با کد
				</Fa>
				<En size={18} color="rgba(242,242,242,0.55)">Music: original, written in code · 120 BPM, Shur</En>
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- the film */
export const Intro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const live = (a: number, b: number) => t >= a && t < b;
	return (
		<AbsoluteFill style={{background: C.paper}}>
			{live(0, 4) ? <ColdOpen t={t} /> : null}
			{live(4, 8) ? <TitleBuild t={t} /> : null}
			{live(8, WHIPS.strip + 0.4) ? (
				<Layer id="lDrop" t={t} tin={null} tout={WHIPS.strip} bg="transparent">
					<Drop t={t} />
				</Layer>
			) : null}
			{live(WHIPS.strip - 0.4, WHIPS.checklist + 0.4) ? (
				<Layer id="lStrip" t={t} tin={WHIPS.strip} tout={WHIPS.checklist} bg={C.paper}>
					<Strip t={t} />
				</Layer>
			) : null}
			{live(WHIPS.checklist - 0.4, WHIPS.flips + 0.4) ? (
				<Layer id="lCheck" t={t} tin={WHIPS.checklist} tout={WHIPS.flips} bg={C.paper}>
					<Checklist t={t} />
				</Layer>
			) : null}
			{live(WHIPS.flips - 0.4, WHIPS.howto + 0.4) ? (
				<Layer id="lFlips" t={t} tin={WHIPS.flips} tout={WHIPS.howto} bg="transparent">
					<Flips t={Math.max(t, 56)} />
				</Layer>
			) : null}
			{live(WHIPS.howto - 0.4, WHIPS.end + 0.4) ? (
				<Layer id="lHow" t={t} tin={WHIPS.howto} tout={WHIPS.end} bg={C.paper}>
					<HowTo t={t} />
				</Layer>
			) : null}
			{live(WHIPS.end - 0.4, 83) ? (
				<Layer id="lEnd" t={t} tin={WHIPS.end} tout={null} bg={C.ink}>
					<EndCard t={t} />
				</Layer>
			) : null}
			<Audio src={staticFile('music/shur-pulse.mp3')} />
			<Audio src={staticFile('music/whooshes.mp3')} volume={0.5} />
		</AbsoluteFill>
	);
};
