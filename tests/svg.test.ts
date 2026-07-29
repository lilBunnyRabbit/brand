import { describe, expect, it } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
	animationDurations,
	auditSvg,
	collectIds,
	collectPaintColors,
	collectRefs,
	dropUnusedIds,
	freezeAnimation,
	isAnimated,
	instantiateSvg,
	isRecolorable,
	namespaceIds,
	parseViewBox,
	prepareSvg,
	sanitizePrefix,
	stripComments,
	stripRootColor,
	stripRootPresentation,
	stripRootSize,
	stripScripting,
	stripXmlProlog,
	toCurrentColor
} from '../src/lib/svg';

const LOGO_DIR = join(import.meta.dir, '..', 'src', 'lib', 'brand', 'logos');
const FIXTURE_DIR = join(import.meta.dir, 'fixtures');

const logoFiles = readdirSync(LOGO_DIR)
	.filter((f) => f.endsWith('.svg'))
	.sort();
const readLogo = (file: string) => readFileSync(join(LOGO_DIR, file), 'utf8');

/**
 * A synthetic animated/masked mark. Structural coverage for `freezeAnimation` and the mask-id
 * collision case lives on a fixture rather than on whatever happens to be in brand/logos/, so
 * swapping the real assets can never quietly delete these tests.
 */
const MASKED = readFileSync(join(FIXTURE_DIR, 'animated-masked.svg'), 'utf8');
const MASKED_IDS = ['top-mask', 'bottom-mask', 'top', 'bottom'];

// ─── the real marks, whatever they currently are ────────────────────────────
// Asserts invariants that must hold for ANY committed asset, so this section keeps working as
// the logo is iterated on. Anything specific to one file goes in its own block below.

describe('every committed mark', () => {
	it('there is at least one', () => {
		expect(logoFiles.length).toBeGreaterThan(0);
	});

	it('has an svg root, a viewBox, no script, and no dangling references', () => {
		for (const file of logoFiles) {
			const audit = auditSvg(readLogo(file));
			expect(audit.hasSvgRoot).toBe(true);
			expect(audit.viewBox).not.toBeNull();
			expect(audit.hadScript).toBe(false);
			expect(audit.danglingRefs).toEqual([]);
		}
	});

	it('survives the pipeline as inline-safe, CSS-sizable and namespaced output', () => {
		for (const file of logoFiles) {
			const id = file.replace(/\.svg$/, '');
			const out = prepareSvg(readLogo(file), { prefix: id });
			const audit = auditSvg(out);

			expect(out).not.toContain('<?xml');
			expect(out.trimStart().startsWith('<svg')).toBe(true);
			expect(audit.rootWidth).toBeNull();
			expect(audit.rootHeight).toBeNull();
			expect(audit.rootColorLocked).toBe(false);
			expect(audit.danglingRefs).toEqual([]);
			expect(collectIds(out).every((i) => i.startsWith(sanitizePrefix(id)))).toBe(true);
		}
	});

	it('is recolorable — a mark whose ink CSS cannot drive is unusable on both surfaces', () => {
		for (const file of logoFiles) {
			const out = prepareSvg(readLogo(file), { prefix: file });
			expect(isRecolorable(auditSvg(out))).toBe(true);
		}
	});

	it('all marks prepared together share no ids', () => {
		const seen = new Set<string>();
		for (const file of logoFiles) {
			for (const id of collectIds(prepareSvg(readLogo(file), { prefix: file }))) {
				expect(seen.has(id)).toBe(false);
				seen.add(id);
			}
		}
	});
});

// ─── the current placeholder: an Inkscape export ────────────────────────────

describe('the Inkscape placeholder mark', () => {
	const FILE = 'lilbunnyrabbit.mark.v6.wip.svg';
	const exists = logoFiles.includes(FILE);
	const raw = exists ? readLogo(FILE) : '';

	it.skipIf(!exists)('is authored in mm, with no currentColor of its own', () => {
		const audit = auditSvg(raw);
		expect(audit.rootWidth).toBe('199.28448mm');
		expect(audit.rootHeight).toBe('174.10243mm');
		expect(audit.currentColorCount).toBe(0);
		expect(audit.viewBox).toMatchObject({ width: 199.28448, height: 174.10244 });
	});

	it.skipIf(!exists)('paints in exactly one colour, so it is safely convertible', () => {
		// Inkscape writes the fill inside a long style string alongside `fill-opacity` and
		// `stop-color:#000000`. Only `fill:`/`stroke:` count as paint — miscounting `stop-color`
		// here would make the file look two-coloured and block the conversion.
		expect(collectPaintColors(raw)).toEqual(['#ffffff']);
		expect(auditSvg(raw).monochrome).toBe(true);
		expect(auditSvg(raw).hardcodedColors).toContain('#000000');
	});

	it.skipIf(!exists)('declares an overlapping id pair, which longest-first handles', () => {
		// `path5-1-93-3-1-8` is a strict prefix of `path5-1-93-3-1-8-4`. Substituting the short
		// one first would corrupt the long one.
		const ids = collectIds(raw);
		expect(ids).toContain('path5-1-93-3-1-8');
		expect(ids).toContain('path5-1-93-3-1-8-4');

		const out = namespaceIds(raw, 'p');
		expect(collectIds(out).sort()).toEqual(
			['p__svg1', 'p__defs1', 'p__path5-1-93-3-1-8', 'p__path5-1-93-3-1-8-4'].sort()
		);
		expect(out).not.toContain('p__path5-1-93-3-1-8-4-4');
	});

	it.skipIf(!exists)('becomes recolorable through the pipeline', () => {
		expect(isRecolorable(auditSvg(raw))).toBe(false); // as authored: flat white
		const out = prepareSvg(raw, { prefix: 'x' });
		expect(isRecolorable(auditSvg(out))).toBe(true);
		expect(out).toContain('fill:currentColor');
		expect(out).not.toContain('fill:#ffffff');
	});

	it.skipIf(!exists)('is static, so freezing is a no-op on it', () => {
		expect(isAnimated(raw)).toBe(false);
		expect(freezeAnimation(raw)).toBe(raw);
	});
});

// ─── stripXmlProlog ─────────────────────────────────────────────────────────

describe('stripXmlProlog', () => {
	it('removes the XML declaration an Inkscape export starts with', () => {
		expect(MASKED.startsWith('<?xml')).toBe(true);
		const out = stripXmlProlog(MASKED);
		expect(out).not.toContain('<?xml');
		expect(out.startsWith('<!--')).toBe(true);
	});

	it('removes a DOCTYPE and a BOM', () => {
		expect(stripXmlProlog('﻿<!DOCTYPE svg PUBLIC "x" "y">\n<svg></svg>')).toBe('<svg></svg>');
	});

	it('is a no-op on already-clean source', () => {
		expect(stripXmlProlog('<svg><g/></svg>')).toBe('<svg><g/></svg>');
	});
});

// ─── stripScripting ─────────────────────────────────────────────────────────

describe('stripScripting', () => {
	it('leaves clean source untouched', () => {
		const { svg, hadScript } = stripScripting(MASKED);
		expect(hadScript).toBe(false);
		expect(svg).toBe(MASKED);
	});

	it('removes script elements and on* handlers, and reports it', () => {
		const dirty = `<svg onload="steal()"><script>alert(1)</script><path onclick='x()'/></svg>`;
		const { svg, hadScript } = stripScripting(dirty);
		expect(hadScript).toBe(true);
		expect(svg).not.toContain('script');
		expect(svg).not.toContain('onload');
		expect(svg).not.toContain('onclick');
	});
});

// ─── root presentation ──────────────────────────────────────────────────────

describe('stripRootPresentation', () => {
	const out = stripRootPresentation(MASKED);

	it('drops root width/height so CSS can size the mark', () => {
		expect(auditSvg(MASKED).rootWidth).toBe('30%');
		expect(auditSvg(out).rootWidth).toBeNull();
		expect(auditSvg(out).rootHeight).toBeNull();
	});

	it('keeps viewBox — without it the mark has no intrinsic aspect ratio', () => {
		expect(parseViewBox(out)).toEqual({ minX: 0, minY: 0, width: 24, height: 24, aspect: 1 });
	});

	it('unlocks currentColor by removing the root color declaration', () => {
		expect(isRecolorable(auditSvg(MASKED))).toBe(false);
		expect(isRecolorable(auditSvg(out))).toBe(true);
	});

	it('removes the root background-color so the mark cannot paint its own backdrop', () => {
		expect(MASKED).toContain('background-color: #000000');
		expect(out).not.toContain('background-color');
	});

	it('preserves inner width/height, which are load-bearing', () => {
		const src = '<svg width="10" style="color:red"><mask><rect width="5" height="5"/></mask></svg>';
		const stripped = stripRootPresentation(src);
		expect(stripped).toContain('<rect width="5" height="5"/>');
		expect(stripped).not.toContain('<svg width');
	});

	it('drops the style attribute entirely when nothing survives', () => {
		expect(stripRootPresentation('<svg style="color: red;"><g/></svg>')).toBe('<svg><g/></svg>');
	});

	it('keeps unrelated style declarations', () => {
		const out2 = stripRootPresentation('<svg style="color: red; overflow: visible"><g/></svg>');
		expect(out2).toContain('style="overflow: visible"');
		expect(out2).not.toContain('color');
	});

	it('splits into parts, so a standalone file can drop size but keep its ink', () => {
		// The favicon needs this: outside a document `currentColor` falls back to black.
		const sized = stripRootSize(MASKED);
		expect(auditSvg(sized).rootWidth).toBeNull();
		expect(auditSvg(sized).rootColorLocked).toBe(true);

		const uncolored = stripRootColor(MASKED);
		expect(auditSvg(uncolored).rootWidth).toBe('30%');
		expect(auditSvg(uncolored).rootColorLocked).toBe(false);
	});
});

// ─── paint / currentColor ───────────────────────────────────────────────────

describe('collectPaintColors', () => {
	it('reads fill and stroke from attributes and from style', () => {
		expect(collectPaintColors('<svg><path fill="#ABC" stroke="#def"/></svg>').sort()).toEqual([
			'#abc',
			'#def'
		]);
		expect(collectPaintColors('<svg><path style="fill:#123;stroke:#456"/></svg>').sort()).toEqual([
			'#123',
			'#456'
		]);
	});

	it('ignores properties that merely start with fill/stroke', () => {
		// The Inkscape trap: fill-opacity, stroke-width, stroke-linecap are not paint.
		const src =
			'<svg><path style="fill:#fff;fill-opacity:1;stroke-width:2.5;stroke-linecap:round"/></svg>';
		expect(collectPaintColors(src)).toEqual(['#fff']);
	});

	it('ignores stop-color, which is a gradient stop rather than paint', () => {
		const src = '<svg><path style="fill:#fff;stop-color:#000000"/></svg>';
		expect(collectPaintColors(src)).toEqual(['#fff']);
	});

	it('ignores non-colour paint values', () => {
		const src =
			'<svg><path fill="none" stroke="currentColor"/><g fill="url(#grad)"/>' +
			'<g fill="transparent"/><g fill="inherit"/></svg>';
		expect(collectPaintColors(src)).toEqual([]);
	});

	it('reads functional colour notations', () => {
		expect(collectPaintColors('<svg><path fill="rgb(1, 2, 3)"/></svg>')).toEqual(['rgb(1, 2, 3)']);
		expect(collectPaintColors('<svg><path style="fill:oklch(0.7 0.1 20)"/></svg>')).toEqual([
			'oklch(0.7 0.1 20)'
		]);
	});
});

describe('toCurrentColor', () => {
	it('converts a single-colour mark in both attribute and style form', () => {
		const attr = toCurrentColor('<svg><path fill="#ffffff"/><path fill="#FFFFFF"/></svg>');
		expect(attr.converted).toBe(true);
		expect(attr.svg).toBe('<svg><path fill="currentColor"/><path fill="currentColor"/></svg>');

		const styled = toCurrentColor('<svg><path style="fill:#ffffff;fill-opacity:1"/></svg>');
		expect(styled.converted).toBe(true);
		expect(styled.svg).toContain('fill:currentColor');
		expect(styled.svg).toContain('fill-opacity:1');
	});

	it('REFUSES to touch a multi-colour mark — flattening it would be destructive', () => {
		const src = '<svg><path fill="#ff0000"/><path fill="#00ff00"/></svg>';
		const out = toCurrentColor(src);
		expect(out.converted).toBe(false);
		expect(out.svg).toBe(src);
	});

	it('is a no-op when there is no literal paint at all', () => {
		const src = '<svg><path fill="currentColor"/></svg>';
		expect(toCurrentColor(src).converted).toBe(false);
		expect(toCurrentColor(src).svg).toBe(src);
	});

	it('is idempotent', () => {
		const once = toCurrentColor('<svg><path fill="#abc"/></svg>').svg;
		expect(toCurrentColor(once).svg).toBe(once);
	});

	it('leaves non-paint colours alone even while converting', () => {
		const out = toCurrentColor('<svg><path style="fill:#fff;stop-color:#000000"/></svg>');
		expect(out.svg).toContain('fill:currentColor');
		expect(out.svg).toContain('stop-color:#000000');
	});
});

// ─── dropUnusedIds / instantiateSvg ─────────────────────────────────────────

describe('dropUnusedIds', () => {
	it('removes ids nothing points at', () => {
		// Inkscape labels everything. `svg1` and `defs1` are referenced by nothing.
		const out = dropUnusedIds('<svg id="svg1"><defs id="defs1"/><path id="p" d="M0 0"/></svg>');
		expect(collectIds(out)).toEqual([]);
	});

	it('keeps ids that are referenced', () => {
		const out = dropUnusedIds(
			'<svg id="root"><mask id="m"><rect/></mask><g mask="url(#m)"/><use href="#u"/>' +
				'<g id="u"/></svg>'
		);
		expect(collectIds(out).sort()).toEqual(['m', 'u']);
	});

	it('leaves the real placeholder mark with no ids at all', () => {
		const FILE = 'lilbunnyrabbit.mark.v6.wip.svg';
		if (!logoFiles.includes(FILE)) return;
		expect(collectIds(readLogo(FILE)).length).toBe(4);
		expect(collectIds(prepareSvg(readLogo(FILE), { prefix: 'x' }))).toEqual([]);
	});

	it('can be turned off to inspect a file as authored', () => {
		const FILE = 'lilbunnyrabbit.mark.v6.wip.svg';
		if (!logoFiles.includes(FILE)) return;
		const kept = prepareSvg(readLogo(FILE), { prefix: 'x', pruneIds: false });
		expect(collectIds(kept).length).toBe(4);
	});
});

describe('instantiateSvg', () => {
	it('THE REGRESSION: the same mark rendered many times keeps ids unique', () => {
		// prepareSvg namespaces per FILE, which stops two variants colliding but not one variant
		// colliding with itself. This page renders the mark five times.
		const prepared = prepareSvg(MASKED, { prefix: 'mark' });
		// Only the two masks are referenced; `top`/`bottom` are unreferenced labels and get pruned.
		expect(collectIds(prepared).sort()).toEqual(['mark__bottom-mask', 'mark__top-mask']);

		const copies = ['light', 'dark', 'brand', 'header', 'hero'].map((slot) =>
			instantiateSvg(prepared, `u1-${slot}`)
		);

		const seen = new Set<string>();
		for (const copy of copies) {
			for (const id of collectIds(copy)) {
				expect(seen.has(id)).toBe(false);
				seen.add(id);
			}
			// And each copy still resolves its own references internally.
			const local = new Set(collectIds(copy));
			for (const ref of collectRefs(copy)) expect(local.has(ref)).toBe(true);
		}
		expect(seen.size).toBe(copies.length * 2);
	});

	it('is a no-op for a mark with no ids left after pruning', () => {
		const prepared = prepareSvg('<svg id="svg1"><path fill="currentColor" d="M0 0"/></svg>', {
			prefix: 'x'
		});
		expect(collectIds(prepared)).toEqual([]);
		expect(instantiateSvg(prepared, 'a')).toBe(prepared);
		expect(instantiateSvg(prepared, 'b')).toBe(prepared);
	});
});

// ─── namespaceIds ───────────────────────────────────────────────────────────

describe('namespaceIds', () => {
	it('renames every id and rewrites every reference to it', () => {
		const out = namespaceIds(MASKED, 'mark.v6');
		expect(collectIds(out).sort()).toEqual(MASKED_IDS.map((id) => `mark-v6__${id}`).sort());
		expect(out).toContain('mask="url(#mark-v6__top-mask)"');
		expect(out).toContain('mask="url(#mark-v6__bottom-mask)"');
		expect(out).not.toContain('url(#top-mask)');
		expect(auditSvg(out).danglingRefs).toEqual([]);
	});

	it('THE REGRESSION: two files with identical ids stay disjoint', () => {
		// Generic ids like `top-mask` are exactly what a design tool emits. Without namespacing the
		// second copy's url(#top-mask) resolves to the FIRST one's mask — first match in document
		// order wins — and it renders the wrong art under the right label, silently.
		const a = namespaceIds(MASKED, 'a');
		const b = namespaceIds(MASKED, 'b');
		const idsA = new Set(collectIds(a));
		expect(collectIds(b).some((id) => idsA.has(id))).toBe(false);

		const combined = `<div>${a}${b}</div>`;
		for (const ref of collectRefs(combined)) expect(collectIds(combined)).toContain(ref);

		// Per-fragment, not just page-wide: each svg's refs must resolve inside itself.
		for (const svg of [a, b]) {
			const local = new Set(collectIds(svg));
			for (const ref of collectRefs(svg)) expect(local.has(ref)).toBe(true);
		}
	});

	it('substitutes longest ids first so overlapping names are not corrupted', () => {
		const src =
			'<svg><filter id="f_1_2"/><filter id="f_1_20"/>' +
			'<g filter="url(#f_1_2)"/><g filter="url(#f_1_20)"/></svg>';
		const out = namespaceIds(src, 'p');
		expect(collectIds(out).sort()).toEqual(['p__f_1_2', 'p__f_1_20']);
		expect(out).toContain('url(#p__f_1_2)');
		expect(out).toContain('url(#p__f_1_20)');
		expect(out).not.toContain('p__f_1_20)0');
	});

	it('rewrites quoted url() and both href forms', () => {
		const src = `<svg><g id="a"/><use href="#a"/><use xlink:href="#a"/><g fill="url('#a')"/></svg>`;
		const out = namespaceIds(src, 'p');
		expect(out).toContain('href="#p__a"');
		expect(out).toContain('xlink:href="#p__a"');
		expect(out).toContain(`url('#p__a')`);
	});

	it('does not touch hex colors that look like fragments', () => {
		const src = '<svg><g id="FDB300"/><path fill="#FDB300" stroke="url(#FDB300)"/></svg>';
		const out = namespaceIds(src, 'p');
		expect(out).toContain('fill="#FDB300"');
		expect(out).toContain('url(#p__FDB300)');
	});

	it('is a no-op when there are no ids', () => {
		expect(namespaceIds('<svg><path d="M0 0"/></svg>', 'p')).toBe('<svg><path d="M0 0"/></svg>');
	});
});

describe('sanitizePrefix', () => {
	it('replaces characters that are unsafe in a CSS selector', () => {
		expect(sanitizePrefix('lilbunnyrabbit.mark.v6.wip')).toBe('lilbunnyrabbit-mark-v6-wip');
		expect(sanitizePrefix('a b/c')).toBe('a-b-c');
	});

	it('never starts with a digit', () => {
		expect(sanitizePrefix('3d')).toBe('id-3d');
	});

	it('falls back rather than producing an empty prefix', () => {
		expect(sanitizePrefix('...')).toBe('svg');
	});
});

// ─── freezeAnimation ────────────────────────────────────────────────────────

describe('freezeAnimation', () => {
	const frozen = freezeAnimation(MASKED);

	it('removes every animation element', () => {
		expect(isAnimated(MASKED)).toBe(true);
		expect(isAnimated(frozen)).toBe(false);
		// `freezeAnimation` is a source transform and preserves comments, so the substring check
		// has to look at markup rather than at text — the fixture's own comment says "<animate".
		expect(stripComments(frozen)).not.toContain('<animate');
	});

	it('zeroes every dashoffset so all strokes are fully drawn', () => {
		// The load-bearing half. `bottom-mask` is authored at dashoffset 20 — fully HIDDEN — so
		// dropping <animate> without rewriting it would silently lose that stroke.
		expect(MASKED).toContain('stroke-dashoffset="20"');
		const offsets = [...frozen.matchAll(/stroke-dashoffset="([^"]*)"/g)].map((m) => m[1]);
		expect(offsets).toEqual(['0', '0']);
	});

	it('keeps the masks, the dash arrays and the paint', () => {
		const markup = stripComments(frozen);
		expect(collectIds(frozen).sort()).toEqual([...MASKED_IDS].sort());
		expect((markup.match(/stroke-dasharray=/g) ?? []).length).toBe(2);
		expect((markup.match(/currentColor/g) ?? []).length).toBe(2);
		expect(auditSvg(frozen).danglingRefs).toEqual([]);
	});

	it('is idempotent', () => {
		expect(freezeAnimation(frozen)).toBe(frozen);
	});

	it('reports durations before freezing', () => {
		expect(animationDurations(MASKED)).toEqual(['1500ms']);
		expect(animationDurations(frozen)).toEqual([]);
	});

	it('adds a dashoffset when a dashed element has none', () => {
		const out = freezeAnimation('<svg><path stroke-dasharray="4 4" d="M0 0"/></svg>');
		expect(out).toContain('stroke-dashoffset="0"');
	});

	it('leaves undashed elements alone', () => {
		const src = '<svg><path d="M0 0"/><rect width="2" height="2"/></svg>';
		expect(freezeAnimation(src)).toBe(src);
	});

	it('removes paired and self-closing animation tags, and animateTransform', () => {
		const src =
			'<svg><path><animate attributeName="x"><mpath/></animate>' +
			'<animateTransform attributeName="transform"/><set attributeTo="1"/></path></svg>';
		const out = freezeAnimation(src);
		expect(out).not.toContain('animate');
		expect(out).not.toContain('<set');
		expect(out).toContain('<path>');
	});
});

// ─── parseViewBox ───────────────────────────────────────────────────────────

describe('parseViewBox', () => {
	it('parses whitespace- and comma-separated forms', () => {
		expect(parseViewBox('<svg viewBox="0 0 24 12">')?.aspect).toBe(2);
		expect(parseViewBox('<svg viewBox="0,0,10,5">')?.aspect).toBe(2);
		expect(parseViewBox('<svg viewBox=" -4 -4 8 8 ">')).toEqual({
			minX: -4,
			minY: -4,
			width: 8,
			height: 8,
			aspect: 1
		});
	});

	it('parses the fractional box an Inkscape mm export produces', () => {
		const vb = parseViewBox('<svg viewBox="0 0 199.28448 174.10244">');
		expect(vb?.width).toBeCloseTo(199.28448, 5);
		expect(vb?.aspect).toBeCloseTo(1.1446, 3);
	});

	it('returns null for absent, malformed and degenerate boxes', () => {
		expect(parseViewBox('<svg>')).toBeNull();
		expect(parseViewBox('<svg viewBox="0 0 24">')).toBeNull();
		expect(parseViewBox('<svg viewBox="a b c d">')).toBeNull();
		expect(parseViewBox('<svg viewBox="0 0 0 10">')).toBeNull();
	});
});

// ─── auditSvg ───────────────────────────────────────────────────────────────

describe('auditSvg', () => {
	it('reports a file with no svg root instead of throwing', () => {
		const audit = auditSvg('this is not an svg');
		expect(audit.hasSvgRoot).toBe(false);
		expect(audit.viewBox).toBeNull();
		expect(audit.ids).toEqual([]);
	});

	it('flags references to ids that do not exist', () => {
		expect(auditSvg('<svg><g mask="url(#nope)"/></svg>').danglingRefs).toEqual(['nope']);
	});

	it('measures bytes as UTF-8, not code units', () => {
		// 5 + 2 + 6: `é` is two bytes, so a `.length` of 12 would be wrong.
		expect(auditSvg('<svg>é</svg>').bytes).toBe(13);
		expect('<svg>é</svg>'.length).toBe(12);
	});
});

// ─── prepareSvg ─────────────────────────────────────────────────────────────

describe('prepareSvg', () => {
	it('produces inline-safe, namespaced, CSS-sizable, recolorable output', () => {
		const out = prepareSvg(MASKED, { prefix: 'mark.v6' });
		const audit = auditSvg(out);

		expect(out).not.toContain('<?xml');
		expect(audit.rootWidth).toBeNull();
		expect(audit.rootColorLocked).toBe(false);
		expect(isRecolorable(audit)).toBe(true);
		expect(audit.danglingRefs).toEqual([]);
		expect(audit.viewBox?.aspect).toBe(1);
		expect(audit.animated).toBe(true); // preserved unless frozen
		expect(collectIds(out).every((id) => id.startsWith('mark-v6__'))).toBe(true);
	});

	it('freezes on request, keeping every other guarantee', () => {
		const out = prepareSvg(MASKED, { prefix: 'v6', freeze: true });
		const audit = auditSvg(out);
		expect(audit.animated).toBe(false);
		expect(audit.danglingRefs).toEqual([]);
		expect(isRecolorable(audit)).toBe(true);
		expect([...out.matchAll(/stroke-dashoffset="([^"]*)"/g)].map((m) => m[1])).toEqual(['0', '0']);
	});

	it('converts monochrome paint by default, and can be told not to', () => {
		const flat = '<svg viewBox="0 0 1 1"><path style="fill:#ffffff" d="M0 0"/></svg>';
		expect(prepareSvg(flat, { prefix: 'x' })).toContain('fill:currentColor');
		expect(prepareSvg(flat, { prefix: 'x', recolor: false })).toContain('fill:#ffffff');
	});
});
