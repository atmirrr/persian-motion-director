import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useVideoConfig} from 'remotion';
import {SketchId, SketchPlayer} from './SketchPlayer';

/* One technique, full frame, an exact number of loops so X can loop it seamlessly. */
export const Clip: React.FC<{id: SketchId; musicFromSec?: number}> = ({id, musicFromSec}) => {
	const {fps, durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#F2F2F2'}}>
			<SketchPlayer id={id} />
			{musicFromSec !== undefined ? (
				<Audio
					src={staticFile('music/shur-pulse.mp3')}
					startFrom={Math.round(musicFromSec * fps)}
					volume={(f) => interpolate(f, [0, 6, durationInFrames - 18, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
				/>
			) : null}
		</AbsoluteFill>
	);
};
