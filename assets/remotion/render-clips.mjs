// Bundle once, render every technique clip (and optionally the intro) to MP4.
// usage: node render-clips.mjs [outDir] [--only Clip-05-beat,Intro]
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const outDir = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'out/clips');
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1].split(',') : null;
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comps = (await getCompositions(serveUrl)).filter((c) => (only ? only.includes(c.id) : c.id.startsWith('Clip-')));
for (const composition of comps) {
	const outputLocation = path.join(outDir, `${composition.id}.mp4`);
	const t0 = Date.now();
	let last = -1;
	await renderMedia({
		composition,
		serveUrl,
		codec: 'h264',
		outputLocation,
		crf: 16,
		imageFormat: 'jpeg',
		jpegQuality: 95,
		pixelFormat: 'yuv420p',
		colorSpace: 'bt709',
		audioCodec: 'aac',
		audioBitrate: '256k',
		onProgress: ({progress}) => {
			const p = Math.floor(progress * 10);
			if (p !== last) {
				last = p;
				process.stdout.write(`${composition.id} ${p * 10}%\n`);
			}
		},
	});
	console.log(`done ${composition.id} in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${outputLocation}`);
}
