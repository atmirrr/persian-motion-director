import './fonts';
import React from 'react';
import {Composition, Folder} from 'remotion';
import {Clip} from './Clip';
import {Intro, INTRO_SECONDS} from './intro/Intro';
import {SketchId} from './SketchPlayer';

export const FPS = 60;

/* Each clip is a whole number of sketch loops, so it loops cleanly on X. */
const CLIPS: {id: SketchId; n: number; loopSec: number; loops: number; musicFromSec?: number}[] = [
	{id: 'oner', n: 2, loopSec: 6.9, loops: 2},
	{id: 'match', n: 3, loopSec: 6.2, loops: 2},
	{id: 'ui', n: 4, loopSec: 6.4, loops: 2},
	{id: 'beat', n: 5, loopSec: 4.0, loops: 3, musicFromSec: 16},
	{id: 'boil', n: 6, loopSec: 5.0, loops: 2},
	{id: 'cutout', n: 7, loopSec: 5.6, loops: 2},
	{id: 'nuqta', n: 8, loopSec: 5.2, loops: 2},
	{id: 'kashida', n: 9, loopSec: 4.8, loops: 2},
];

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="Intro" component={Intro} durationInFrames={INTRO_SECONDS * FPS} fps={FPS} width={1920} height={1080} />
		<Folder name="Clips">
			{CLIPS.map((c) => (
				<Composition
					key={c.id}
					id={`Clip-${String(c.n).padStart(2, '0')}-${String(c.id)}`}
					component={Clip}
					defaultProps={{id: c.id, musicFromSec: c.musicFromSec}}
					durationInFrames={Math.round(c.loopSec * c.loops * FPS)}
					fps={FPS}
					width={1920}
					height={1080}
				/>
			))}
		</Folder>
	</>
);
