// Render still frames of a composition at given seconds, one bundle for all.
// usage: node render-stills.mjs Intro 2.0,5.8,30 [outDir]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [id, secs, out = 'out/stills'] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id});
for (const s of secs.split(',').map(Number)) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
	const output = path.join(out, `${id}-${s.toFixed(2)}.png`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'png', scale: 0.5});
	console.log('still', output);
}
