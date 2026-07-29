/**
 * Generate `static/favicon.svg` from a mark in `src/lib/brand/logos/`.
 *
 *   bun run favicon [source-file] [ink-swatch] [disc-swatch|none]
 *
 * Derived rather than hand-edited so it can never drift from the mark. Three deliberate
 * differences from the inlined form:
 *
 *   - FROZEN. A browser tab is not the place for a looping draw-on, and the favicon is also the
 *     source for rasterised icon sizes where an animation frame would be arbitrary.
 *   - SIZE STRIPPED. `199.28448mm` is meaningless at 16px.
 *   - INK PINNED. Standalone there is no ancestor to inherit `color` from, so `currentColor` would
 *     fall back to black. The ink is taken from the palette, so it follows the seed — but it has to
 *     be written into the file explicitly, which the inlined form never does.
 *
 * Not wired into `bun run build`: a build step that rewrites a committed file makes the tree dirty
 * in CI for no reason. Re-run it after replacing the mark.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
	auditSvg,
	freezeAnimation,
	isAnimated,
	stripRootSize,
	toCurrentColor
} from '../src/lib/svg';
import { swatches, type SwatchName } from '../src/lib/brand/config/palette';

const root = join(import.meta.dir, '..');
const source = process.argv[2] ?? 'lilbunnyrabbit.mark.v6.wip.svg';

/** `primary`: the main logo colour, and mid-lightness so it reads on most browser chrome. */
const inkName = (process.argv[3] ?? 'primary') as SwatchName;
const ink = swatches[inkName];
if (!ink) {
	throw new Error(`Unknown swatch "${inkName}". One of: ${Object.keys(swatches).join(', ')}`);
}

/**
 * No disc by default: the logo is the bare mark almost everywhere, and the favicon is no exception.
 *
 * The trade-off is worth stating once. Transparent, the mark inherits nothing, so it is `primary` on
 * whatever the browser puts behind it — 7.06:1 on a dark tab strip, but only 2.23:1 on a light one.
 * Pass a disc swatch (e.g. `primary`) to get a self-contained badge that ignores the chrome.
 */
const discArg = process.argv[4] ?? 'none';
const disc = discArg === 'none' ? null : swatches[discArg as SwatchName];
if (discArg !== 'none' && !disc) {
	throw new Error(`Unknown swatch "${discArg}". One of: none, ${Object.keys(swatches).join(', ')}`);
}

const from = join(root, 'src', 'lib', 'brand', 'logos', source);
const to = join(root, 'static', 'favicon.svg');

const raw = readFileSync(from, 'utf8');
const sourceAudit = auditSvg(raw);
if (!sourceAudit.hasSvgRoot) throw new Error(`${source} has no <svg> root`);
if (!sourceAudit.viewBox) throw new Error(`${source} has no viewBox, so it cannot be centred`);

let mark = stripRootSize(raw);
mark = freezeAnimation(mark);

// Convert the flat paint to currentColor, then pin currentColor. In this order the result works
// whether or not the source was already using currentColor.
mark = toCurrentColor(mark).svg;
mark = setRootColor(mark, ink.hex);

let out = disc ? composeLockup(mark, sourceAudit.viewBox, disc.hex) : mark;

const audit = auditSvg(out);
if (isAnimated(out)) throw new Error(`${source} is still animated after freezing`);
if (audit.danglingRefs.length) {
	throw new Error(`${source} has dangling refs: ${audit.danglingRefs.join(', ')}`);
}
if (audit.currentColorCount === 0 && audit.paintColors.length === 0) {
	throw new Error(`${source} has no paint at all — nothing would render`);
}
if (disc && !out.includes('<circle')) throw new Error('lost the disc while composing');

writeFileSync(to, out.endsWith('\n') ? out : `${out}\n`);
console.log(
	`favicon.svg <- ${source} (frozen, ${inkName} ${ink.hex}` +
		`${disc ? `, on a ${discArg} disc ${disc.hex}` : ', no disc'}, ${audit.bytes} B)`
);

/**
 * Wrap the mark in a square canvas with a filled disc behind it.
 *
 * A nested `<svg>` with its own `viewBox` rather than a transform: the browser handles the
 * aspect-preserving fit, so nothing has to be recomputed if the artboard changes shape.
 *
 * 58% is the same proportion the on-page `Lockup` component uses, so the favicon and the site
 * cannot drift apart visually.
 */
function composeLockup(
	mark: string,
	box: { width: number; height: number },
	discHex: string
): string {
	const SIZE = 256;
	const inner = SIZE * 0.58;
	const aspect = box.width / box.height;
	const w = aspect >= 1 ? inner : inner * aspect;
	const h = aspect >= 1 ? inner / aspect : inner;
	const x = (SIZE - w) / 2;
	const y = (SIZE - h) / 2;
	const r = (n: number) => Number(n.toFixed(3));

	// Strip the mark's own prolog and re-root it as a nested element.
	const nested = mark
		.replace(/<\?xml[\s\S]*?\?>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<svg\b/, `<svg x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}"`)
		.trim();

	return [
		'<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
		`   <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="${discHex}" />`,
		`   ${nested}`,
		'</svg>'
	].join('\n');
}

/** Set `color` in the root `<svg>`'s style, replacing any existing declaration. */
function setRootColor(svg: string, hex: string): string {
	return svg.replace(/<svg\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/i, (_match, attrs: string) => {
		const withoutColor = attrs.replace(/\sstyle\s*=\s*"([^"]*)"/i, (_m, style: string) => {
			const kept = style
				.split(';')
				.map((d) => d.trim())
				.filter((d) => d.length > 0 && !/^color\s*:/i.test(d));
			return kept.length ? ` style="${kept.join('; ')}; color: ${hex}"` : ` style="color: ${hex}"`;
		});
		return withoutColor === attrs ? `<svg${attrs} style="color: ${hex}">` : `<svg${withoutColor}>`;
	});
}
