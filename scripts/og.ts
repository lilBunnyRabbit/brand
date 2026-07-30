/**
 * Generate `static/og.png`, the 1200×630 share card.
 *
 * Run with `bun run og`. Committed output, generated input: the plate is authored as SVG here and
 * rasterised, and every colour, string and path in it is read from this repo's own config. Change the
 * seed and re-run, and the card follows like everything else does.
 *
 * Why a script and not a build step: rasterising needs a renderer, and putting one in the deploy
 * pipeline would mean a native module in CI for an image that changes about twice a year. The PNG is
 * checked in; this file is how it was made.
 *
 * Why resvg and not a headless browser: same reason, one less order of magnitude of dependency.
 *
 * resvg cannot read woff2, so the two faces are converted to ttf into a temp dir first. Nothing is
 * written to the repo except the PNG.
 *
 * Hack comes from the fonts the site actually serves. Inter does not: `InterVariable.woff2` loses its
 * family name in the woff2→ttf conversion and resvg then cannot select it, so this reads a static
 * `Inter-Regular.woff2` that lives beside this script and is never shipped to the browser.
 */
import { Resvg } from '@resvg/resvg-js';
import { Font, woff2 } from 'fonteditor-core';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { dark } from '../src/lib/brand/config/palette.dark';
import { meta } from '../src/lib/brand/config/meta';

const ROOT = new URL('..', import.meta.url).pathname;

/* ── fonts ───────────────────────────────────────────────────────────────── */

await woff2.init();

const fontDir = mkdtempSync(join(tmpdir(), 'brand-og-'));

for (const [src, out] of [
	['src/lib/brand/fonts/hack-bold.woff2', 'Hack-Bold.ttf'],
	['scripts/fonts/Inter-Regular.woff2', 'Inter-Regular.ttf']
] as const) {
	const font = Font.create(readFileSync(`${ROOT}${src}`), { type: 'woff2' });
	writeFileSync(join(fontDir, out), Buffer.from(font.write({ type: 'ttf' }) as ArrayBuffer));
}

/* ── the plate ───────────────────────────────────────────────────────────── */

const W = 1200;
const H = 630;
const MARK = 300;

const raw = readFileSync(`${ROOT}src/lib/brand/logos/lilbunnyrabbit.mark.v6.wip.svg`, 'utf8');
const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error('the mark has no viewBox');

/*
	Inner geometry only. The root element carries its own width, height and an XML prolog that cannot be
	nested, so it is dropped and re-declared. The flat white fill becomes the brand ink — the same
	substitution the site's SVG pipeline does at runtime.
*/
const inner = raw
	.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'))
	.replace(/fill:#ffffff/g, `fill:${dark.primary.hex}`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<rect width="${W}" height="${H}" fill="${dark.background_darkest.hex}"/>
	<svg x="${(W - MARK) / 2}" y="118" width="${MARK}" height="${MARK}" viewBox="${viewBox}" fill="${dark.primary.hex}">${inner}</svg>
	<text x="${W / 2}" y="492" text-anchor="middle" font-family="Hack" font-weight="700" font-size="62" fill="${dark.foreground.hex}">${meta.name}</text>
	<text x="${W / 2}" y="546" text-anchor="middle" font-family="Inter" font-size="28" fill="${dark.primary.hex}">${meta.tagline}</text>
</svg>`;

const png = new Resvg(svg, {
	fitTo: { mode: 'width', value: W },
	// No system fonts: the card must render identically on any machine that runs this.
	font: { fontDirs: [fontDir], loadSystemFonts: false }
})
	.render()
	.asPng();

writeFileSync(`${ROOT}static/og.png`, png);
console.log(`static/og.png — ${W}×${H}, ${(png.length / 1024).toFixed(1)} kB`);
