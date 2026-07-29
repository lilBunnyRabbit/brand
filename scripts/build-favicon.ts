/**
 * Generate `static/favicon.svg` from a mark in `src/lib/brand/logos/`.
 *
 *   bun run favicon [source-file] [ink-swatch]
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

/**
 * `primary` by default: at L=0.745 it is mid-lightness, so it stays visible against both light and
 * dark browser chrome. A dark ink would vanish in a dark tab strip and vice versa.
 */
const inkName = (process.argv[3] ?? 'primary') as SwatchName;
const ink = swatches[inkName];
if (!ink) {
	throw new Error(`Unknown swatch "${inkName}". One of: ${Object.keys(swatches).join(', ')}`);
}

const from = join(root, 'src', 'lib', 'brand', 'logos', source);
const to = join(root, 'static', 'favicon.svg');

const raw = readFileSync(from, 'utf8');
if (!auditSvg(raw).hasSvgRoot) throw new Error(`${source} has no <svg> root`);

let out = stripRootSize(raw);
out = freezeAnimation(out);

// Convert the flat paint to currentColor, then pin currentColor on the root. Doing it in this
// order means the result works whether the source was already using currentColor or not.
out = toCurrentColor(out).svg;
out = setRootColor(out, ink.hex);

const audit = auditSvg(out);
if (isAnimated(out)) throw new Error(`${source} is still animated after freezing`);
if (audit.danglingRefs.length) {
	throw new Error(`${source} has dangling refs: ${audit.danglingRefs.join(', ')}`);
}
if (audit.currentColorCount === 0 && audit.paintColors.length === 0) {
	throw new Error(`${source} has no paint at all — nothing would render`);
}
if (!audit.rootColorLocked) {
	throw new Error(`failed to pin a root color on ${source}; currentColor would render black`);
}

writeFileSync(to, out.endsWith('\n') ? out : `${out}\n`);
console.log(`favicon.svg <- ${source} (frozen, ink ${inkName} ${ink.hex}, ${audit.bytes} B)`);

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
