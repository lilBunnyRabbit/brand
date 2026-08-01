/**
 * App-behavior tests for the token layer: the emitted stylesheet, the export formats, and the
 * structural rules around the palette registry.
 *
 * Deliberately NO colour maths and NO value pinning. The palette is transcribed from the
 * Chromatics export (`config/palette.dark.ts` / `palette.light.ts`) and Chromatics is where the
 * values are solved and verified — asserting hexes or contrast ratios here would be a second
 * source of truth. What is tested is the code around the values: scoping, formats, partitions.
 */
import { describe, expect, it } from 'bun:test';

import { mixOver } from '../src/lib/color';
import {
	dark,
	groupsFor,
	isShade,
	light,
	markEars,
	onShadeNames,
	shadeNames,
	themeNames,
	themes,
	tokenName,
	type SwatchName
} from '../src/lib/brand/config/palette';
import {
	brandStyleSheet,
	exportCss,
	exportJson,
	exportTailwind,
	labelFor,
	varName
} from '../src/lib/brand/tokens';

const names = Object.keys(dark) as SwatchName[];
const GROUPS = groupsFor('dark');

describe('the palette registry', () => {
	it('light carries exactly the dark keys, in the same order', () => {
		expect(Object.keys(light)).toEqual(Object.keys(dark));
	});

	it('is registered under both mode names', () => {
		expect(themeNames).toEqual(['dark', 'light']);
		expect(themes.dark).toBe(dark);
		expect(themes.light).toBe(light);
	});

	it('groups cover every colour exactly once', () => {
		const grouped = GROUPS.flatMap((g) => g.swatches);
		expect([...grouped].sort()).toEqual([...names].sort());
		expect(new Set(grouped).size).toBe(grouped.length);
	});

	it('groups are the documented five, in order', () => {
		expect(GROUPS.map((g) => g.id)).toEqual(['surfaces', 'content', 'brand', 'identity', 'states']);
		expect(GROUPS.map((g) => g.swatches.length)).toEqual([7, 1, 4, 1, 4]);
	});

	it('isShade partitions the palette with no overlap and nothing left over', () => {
		expect(names.filter(isShade).sort()).toEqual([...shadeNames].sort());
		expect(names.filter((n) => !isShade(n)).sort()).toEqual([...onShadeNames].sort());
	});

	it('the swatch label rule is binary', () => {
		for (const name of names) {
			expect(labelFor(name)).toBe(isShade(name) ? 'foreground' : 'background');
		}
	});

	it('no colour name carries its own mode — the mode is the scope', () => {
		for (const name of names) {
			expect(name).not.toMatch(/^light_|-inverse|_darkmode$/);
		}
	});

	it('displays under the scheme’s own vocabulary', () => {
		expect(tokenName('primary', 'dark')).toBe('primary');
		expect(tokenName('primary', 'light')).toBe('light_primary');
	});

	it('mark_ears is a fixed asset colour, not a palette key', () => {
		expect(names).not.toContain('mark_ears');
		expect(Object.keys(light)).not.toContain('mark_ears');
	});
});

describe('the colour seam', () => {
	it('mixOver composites in gamma sRGB, not linear-light', () => {
		// A linear blend of the same pair lands measurably elsewhere; browsers paint gamma.
		const gamma = mixOver(dark.foreground, dark.background, 0.5);
		expect(gamma.srgb[0]).toBeCloseTo((dark.foreground.srgb[0] + dark.background.srgb[0]) / 2, 2);
	});
});

describe('the emitted stylesheet ships both modes', () => {
	const css = brandStyleSheet();

	it('puts dark on :root so the canonical mode needs no attribute and no JS', () => {
		expect(css).toContain(":root,\n[data-theme='dark'] {");
		expect(css).toContain(`--brand-background: ${dark.background.hex};`);
	});

	it('scopes light to a bare attribute, so any element can carry it', () => {
		expect(css).toContain("[data-theme='light'] {");
		expect(css).toContain(`--brand-background: ${light.background.hex};`);
		// Not `:root[data-theme=...]` — that would make it page-only and kill scoped previews.
		expect(css).not.toContain(":root[data-theme='light']");
	});

	it('declares all 17 in each block', () => {
		for (const name of names) {
			const occurrences = css.split(`${varName(name)}:`).length - 1;
			expect(occurrences).toBe(2);
		}
	});

	it('spells every custom property in kebab, never the identifier’s underscore', () => {
		// The keys are snake_case because they are DSL/TS identifiers. CSS is kebab, and the
		// stylesheet is the boundary where that conversion has to happen.
		expect(css).toContain('--brand-background-lightest:');
		expect(css).not.toMatch(/--brand-[a-z]+_/);
	});

	it('recomputes the composited steps per scope, not once on :root', () => {
		// A custom property's computed value has its var() references already substituted, so a
		// --fg-muted computed on :root alone would inherit into a light scope carrying DARK values.
		expect(css).toContain(':root,\n[data-theme] {');
		for (const key of ['muted', 'disabled', 'border']) {
			expect(css).toContain(`--fg-${key}: color-mix(in srgb, var(--brand-foreground)`);
		}
	});

	it('never media-queries the system preference — the mode is a choice here', () => {
		expect(css).not.toContain('prefers-color-scheme');
	});
});

describe('the exports carry both modes', () => {
	it('CSS emits a block per mode plus the fixed asset colour', () => {
		const css = exportCss();
		expect(css).toContain('/* dark */');
		expect(css).toContain('/* light */');
		expect(css).toContain(`${varName(markEars.name)}: ${markEars.hex};`);
	});

	it('Tailwind names its utilities in kebab too', () => {
		const tw = exportTailwind();
		expect(tw).toContain('--color-background-lightest:');
		expect(tw).toContain('--color-mark-ears:');
		expect(tw).not.toMatch(/--color-[a-z]+_/);
	});

	it('JSON keys each mode under the scheme’s own token names', () => {
		const json = JSON.parse(exportJson()) as Record<string, Record<string, { hex: string }>>;
		expect(Object.keys(json)).toEqual(['dark', 'light', 'fixed']);
		expect(json.dark.primary.hex).toBe(dark.primary.hex);
		expect(json.light.light_primary.hex).toBe(light.primary.hex);
		expect(json.fixed.mark_ears.hex).toBe(markEars.hex);
	});
});
