import { describe, expect, it } from 'bun:test';

import { background, groups, swatches } from '../src/lib/brand/config/palette';
import type { SwatchName } from '../src/lib/brand/config/palette';

/**
 * The authored palette table, verbatim. This is the contract: the config expresses every colour as
 * a FORMULA against one seed, and these are the values those formulas must reproduce. If a formula
 * is transcribed wrong, this catches it — which is the whole reason to write the table down twice.
 */
const TABLE: Record<SwatchName, { hex: string; l: number; c: number; h: number }> = {
	'background-lightest': { hex: '#293f4a', l: 0.355, c: 0.0333, h: 230.47 },
	'background-lighter': { hex: '#20323b', l: 0.305, c: 0.0283, h: 230.47 },
	background: { hex: '#17252c', l: 0.255, c: 0.0233, h: 230.47 },
	'background-darker': { hex: '#081a22', l: 0.205, c: 0.0283, h: 230.47 },
	'background-darkest': { hex: '#000e18', l: 0.155, c: 0.0333, h: 230.47 },
	foreground: { hex: '#b1aba8', l: 0.745, c: 0.00777, h: 50.47 },
	primary: { hex: '#a4b483', l: 0.745, c: 0.0699, h: 122.47 },
	secondary: { hex: '#b5a2d2', l: 0.745, c: 0.0699, h: 302.47 },
	accent: { hex: '#d1a085', l: 0.745, c: 0.0699, h: 50.47 },
	success: { hex: '#7ac26a', l: 0.745, c: 0.1398, h: 140 },
	warning: { hex: '#e49b39', l: 0.745, c: 0.1398, h: 70 },
	error: { hex: '#f88876', l: 0.745, c: 0.1398, h: 30 },
	info: { hex: '#49b7fb', l: 0.745, c: 0.1398, h: 240 }
};

const names = Object.keys(TABLE) as SwatchName[];

describe('the derived palette reproduces the authored table', () => {
	it('defines exactly the documented swatches, in order', () => {
		expect(Object.keys(swatches)).toEqual(names);
	});

	for (const name of names) {
		it(`${name} → ${TABLE[name].hex}`, () => {
			const swatch = swatches[name];
			const want = TABLE[name];

			expect(swatch.hex).toBe(want.hex);
			// Channels to the precision the table quotes them at.
			expect(swatch.l).toBeCloseTo(want.l, 4);
			expect(swatch.c).toBeCloseTo(want.c, 4);
			expect(swatch.h).toBeCloseTo(want.h, 2);
		});
	}
});

describe('the derivations, as relationships rather than values', () => {
	it('every surface step shares the seed hue', () => {
		for (const name of names.filter((n) => n.startsWith('background'))) {
			expect(swatches[name].h).toBeCloseTo(background.h, 4);
		}
	});

	it('chroma rises as lightness departs the seed in EITHER direction', () => {
		// The distinctive property of this ramp: darker does not mean duller.
		const { background: base } = swatches;
		for (const step of ['background-lighter', 'background-darker'] as const) {
			expect(swatches[step].c).toBeGreaterThan(base.c);
		}
		for (const step of ['background-lightest', 'background-darkest'] as const) {
			expect(swatches[step].c).toBeGreaterThan(swatches['background-lighter'].c);
		}
	});

	it('foreground inverts the seed lightness and opposes its hue', () => {
		expect(swatches.foreground.l).toBeCloseTo(1 - background.l, 6);
		expect(swatches.foreground.c).toBeCloseTo(background.c / 3, 6);
		// 230.47 + 180 = 410.47, wrapped to 50.47. Unwrapped it would render the same but
		// *display* wrong, which matters on a page whose job is showing values.
		expect(swatches.foreground.h).toBeLessThan(360);
		expect(swatches.foreground.h).toBeCloseTo(50.47, 4);
	});

	it('brand colours are hue rotations at one shared lightness, not tints', () => {
		const l = swatches.primary.l;
		for (const name of ['primary', 'secondary', 'accent'] as const) {
			expect(swatches[name].l).toBeCloseTo(l, 6);
		}
		const c = swatches.primary.c;
		for (const name of ['secondary', 'accent'] as const) {
			expect(swatches[name].c).toBeCloseTo(c, 6);
		}
		// Secondary is primary's opposite.
		expect(Math.abs(swatches.secondary.h - swatches.primary.h)).toBeCloseTo(180, 4);
		// Accent takes the foreground hue.
		expect(swatches.accent.h).toBeCloseTo(swatches.foreground.h, 4);
	});

	it('status colours are exactly double primary chroma at the same lightness', () => {
		for (const name of ['success', 'warning', 'error', 'info'] as const) {
			expect(swatches[name].c).toBeCloseTo(swatches.primary.c * 2, 6);
			expect(swatches[name].l).toBeCloseTo(swatches.primary.l, 6);
		}
	});

	it('all but the darkest surface sit inside sRGB', () => {
		// `background-darkest` — oklch(0.155 0.0333 230.47) — is marginally outside sRGB: the
		// formula pushes chroma up as lightness drops, and at l=0.155 on a blue hue that exceeds
		// what sRGB can hold. It clamps #000e18 -> #000e17, one step in blue, and it IS inside P3.
		//
		// Not a transcription error and not worth "fixing": the quoted hex is what a browser
		// renders. It is asserted here so the fact is deliberate, and the page badges it.
		const outside = names.filter((n) => !swatches[n].isInGamut);
		expect(outside).toEqual(['background-darkest']);

		expect(swatches['background-darkest'].isInP3).toBe(true);
		expect(swatches['background-darkest'].gamutMapped.hex).toBe('#000e17');

		// Every other swatch is unchanged by gamut mapping.
		for (const name of names.filter((n) => n !== 'background-darkest')) {
			expect(swatches[name].gamutMapped.hex).toBe(swatches[name].hex);
		}
	});

	it('carries the formula as a description, so the page can show provenance', () => {
		expect(swatches.background.description).toBe('Source');
		expect(swatches.foreground.description).toContain('1 - $background.l');
		expect(swatches.primary.description).toContain('$background.c * 3');
		expect(swatches.success.description).toContain("'green' hue");
	});
});

describe('groups', () => {
	it('cover every swatch exactly once', () => {
		const grouped = groups.flatMap((g) => g.swatches);
		expect([...grouped].sort()).toEqual([...names].sort());
		expect(new Set(grouped).size).toBe(grouped.length);
	});

	it('have unique anchor ids', () => {
		const ids = groups.map((g) => g.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
