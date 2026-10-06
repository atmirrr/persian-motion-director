import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {SKETCHES} from '../../sketches/sketches.js';
import '../../sketches/sketches.css';

export type SketchId = keyof typeof SKETCHES;
type Sketch = {duration: number; fps: number; still: number; mount: (el: HTMLElement) => void; render: (t: number) => void};

/*
 * Drives a plain-JS sketch from Remotion's frame number. The sketch mounts once,
 * then render(t) runs inside a layout effect on every frame, before Remotion
 * captures it. `time` overrides the clock (seconds into the loop); `active=false`
 * skips drawing for sketches that are off screen.
 */
export const SketchPlayer: React.FC<{
	id: SketchId;
	offset?: number;
	time?: number;
	active?: boolean;
	style?: React.CSSProperties;
}> = ({id, offset = 0, time, active = true, style}) => {
	const ref = useRef<HTMLDivElement>(null);
	const sketch = useRef<Sketch | null>(null);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const [handle] = useState(() => delayRender(`Mounting sketch ${String(id)}`));

	useLayoutEffect(() => {
		const el = ref.current!;
		const s = (SKETCHES[id] as () => Sketch)();
		s.mount(el);
		sketch.current = s;
		continueRender(handle);
		return () => {
			el.innerHTML = '';
		};
	}, [id, handle]);

	useLayoutEffect(() => {
		const s = sketch.current;
		if (!s || !active) return;
		const t = time ?? frame / fps + offset;
		s.render(((t % s.duration) + s.duration) % s.duration);
	});

	return <div ref={ref} className="pmd-stage" style={{position: 'absolute', inset: 0, ...style}} />;
};
