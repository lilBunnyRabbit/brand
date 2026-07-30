import { describe, expect, it } from 'bun:test';

import { contrastRatio, mixOver, simulateVision } from '../src/lib/color';
import {
	background,
	groups,
	isShade,
	ladderSpan,
	modifiers,
	onShadeNames,
	shadeNames,
	swatches,
	type ShadeName,
	type SwatchName
} from '../src/lib/brand/config/palette';
import { labelFor, measureContract, modifierRatio } from '../src/lib/brand/tokens';
import { logoCombos, plainInks } from '../src/lib/brand/config/logo-combos';

/**
 * The authored palette table, verbatim. This is the contract: the config expresses every colour as
 * a FORMULA against one seed, and these are the values those formulas must reproduce. A
 * mis-transcribed formula fails here rather than shipping.
 */
const TABLE: Record<SwatchName, { hex: string; l: number; c: number; h: number }> = {
	bg_lightest: { hex: '#2a3f4a', l: 0.355, c: 0.03244, h: 230.47 },
	bg_lighter: { hex: '#233640', l: 0.32167, c: 0.02939, h: 230.47 },
	bg_light: { hex: '#1d2d36', l: 0.28833, c: 0.02635, h: 230.47 },
	background: { hex: '#17252c', l: 0.255, c: 0.0233, h: 230.47 },
	bg_dark: { hex: '#111d23', l: 0.22167, c: 0.02025, h: 230.47 },
	bg_darker: { hex: '#0b151a', l: 0.18833, c: 0.01721, h: 230.47 },
	bg_darkest: { hex: '#060d11', l: 0.155, c: 0.01416, h: 230.47 },
	foreground: { hex: '#b1aba8', l: 0.745, c: 0.00777, h: 50.47 },
	tertiary: { hex: '#baa7ab', l: 0.745, c: 0.0233, h: 2.47 },
	secondary: { hex: '#b2a6c5', l: 0.745, c: 0.0466, h: 302.47 },
	primary: { hex: '#a4b483', l: 0.745, c: 0.0699, h: 122.47 },
	accent: { hex: '#dc9b76', l: 0.745, c: 0.0932, h: 50.47 },
	cottontail: { hex: '#e0f9ab', l: 0.945, c: 0.10332, h: 122.47 },
	success: { hex: '#7ac26a', l: 0.745, c: 0.1398, h: 140 },
	warning: { hex: '#e49b39', l: 0.745, c: 0.1398, h: 70 },
	error: { hex: '#f88876', l: 0.745, c: 0.1398, h: 30 },
	info: { hex: '#49b7fb', l: 0.745, c: 0.1398, h: 240 }
};

const names = Object.keys(TABLE) as SwatchName[];

describe('the derived palette reproduces the authored table', () => {
	it('defines exactly the 17 documented colours, in ladder order', () => {
		expect(Object.keys(swatches)).toEqual(names);
		expect(names.length).toBe(17);
	});

	for (const name of names) {
		it(`${name} → ${TABLE[name].hex}`, () => {
			const swatch = swatches[name];
			const want = TABLE[name];
			expect(swatch.hex).toBe(want.hex);
			expect(swatch.l).toBeCloseTo(want.l, 4);
			expect(swatch.c).toBeCloseTo(want.c, 4);
			expect(swatch.h).toBeCloseTo(want.h, 2);
		});
	}
});

// ─── THE CONTRACT ───────────────────────────────────────────────────────────

describe('the contract', () => {
	const contract = measureContract();

	it('every non-shade colour clears AA against every shade', () => {
		expect(contract.holds).toBe(true);
		expect(contract.worst.ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('the worst cell is error on bg_lightest at 4.59', () => {
		// error has the lowest luminance of everything at L 0.745, and bg_lightest is the lightest
		// legal ground — so this is the pair that sizes the whole ladder.
		expect(contract.worst.on).toBe('error');
		expect(contract.worst.shade).toBe('bg_lightest');
		expect(contract.worst.ratio).toBeCloseTo(4.59, 2);
	});

	it('covers 7 shades × 10 colours', () => {
		expect(shadeNames.length).toBe(7);
		expect(onShadeNames.length).toBe(10);
		expect(contract.count).toBe(70);
	});

	it('so ANY shade can back ANY section — the practical consequence', () => {
		for (const shade of shadeNames) {
			const worst = Math.min(
				...onShadeNames.map((n) => contrastRatio(swatches[n], swatches[shade]))
			);
			expect(worst).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe('the ladder span is a ceiling, not a preference', () => {
	const worstAt = (span: number) => {
		const l = background.l + span;
		const shade = background.derive('probe', { l, c: (background.c * l) / background.l });
		return Math.min(...onShadeNames.map((n) => contrastRatio(swatches[n], shade)));
	};

	it('ships 0.100', () => {
		expect(ladderSpan).toBe(0.1);
	});

	it('holds at the shipped span and breaks above ~0.1047', () => {
		expect(worstAt(0.1)).toBeGreaterThanOrEqual(4.5);
		expect(worstAt(0.105)).toBeLessThan(4.5);
		expect(worstAt(0.11)).toBeLessThan(4.5);
	});

	it('sits just under the true ceiling, with real headroom', () => {
		let lo = 0.1;
		let hi = 0.2;
		for (let i = 0; i < 50; i++) {
			const mid = (lo + hi) / 2;
			if (worstAt(mid) >= 4.5) lo = mid;
			else hi = mid;
		}
		expect(lo).toBeCloseTo(0.1047, 3);
		// 96% of the ceiling — which also confirms the brief's note that 0.11 overshot by ~0.006.
		expect(0.1 / lo).toBeGreaterThan(0.95);
		expect(0.1 / lo).toBeLessThan(1);
	});
});

// ─── the derivations, as relationships ──────────────────────────────────────

describe('the derivations', () => {
	it('every shade shares the seed hue', () => {
		for (const name of shadeNames) {
			expect(swatches[name].h).toBeCloseTo(background.h, 4);
		}
	});

	it('shade chroma is proportional to lightness, so lighter reads as elevated', () => {
		for (const name of shadeNames) {
			const s = swatches[name];
			expect(s.c).toBeCloseTo((background.c * s.l) / background.l, 6);
		}
		// Monotonic: unlike the earlier scheme, chroma does NOT rise in both directions.
		const chromas = shadeNames.map((n) => swatches[n].c);
		for (let i = 1; i < chromas.length; i++) expect(chromas[i]).toBeLessThan(chromas[i - 1]);
	});

	it('the ladder is symmetric about the seed', () => {
		expect(swatches.bg_lightest.l - background.l).toBeCloseTo(ladderSpan, 6);
		expect(background.l - swatches.bg_darkest.l).toBeCloseTo(ladderSpan, 6);
	});

	it('foreground inverts the seed lightness and opposes its hue, wrapped', () => {
		expect(swatches.foreground.l).toBeCloseTo(1 - background.l, 6);
		expect(swatches.foreground.c).toBeCloseTo(background.c / 3, 6);
		// 230.47 + 180 = 410.47 must wrap to 50.47, or the token displays a hue over 360.
		expect(swatches.foreground.h).toBeLessThan(360);
		expect(swatches.foreground.h).toBeCloseTo(50.47, 4);
	});

	it('brand chroma is an integer multiple of the seed chroma — rank, not taste', () => {
		const q = background.c;
		expect(swatches.tertiary.c).toBeCloseTo(q * 1, 6);
		expect(swatches.secondary.c).toBeCloseTo(q * 2, 6);
		expect(swatches.primary.c).toBeCloseTo(q * 3, 6);
		expect(swatches.accent.c).toBeCloseTo(q * 4, 6);
		// 5c is deliberately empty, so the brand band and the state band stay apart.
		for (const n of ['success', 'warning', 'error', 'info'] as const) {
			expect(swatches[n].c).toBeCloseTo(q * 6, 6);
		}
	});

	it('all nine mid colours share one lightness — which is why none may touch', () => {
		const l = swatches.foreground.l;
		for (const name of onShadeNames) {
			if (name === 'cottontail') continue;
			expect(swatches[name].l).toBeCloseTo(l, 6);
		}
	});

	it('secondary is primary’s complement; accent takes the foreground hue', () => {
		expect(Math.abs(swatches.secondary.h - swatches.primary.h)).toBeCloseTo(180, 4);
		expect(swatches.accent.h).toBeCloseTo(swatches.foreground.h, 4);
		expect(swatches.tertiary.h).toBeCloseTo((swatches.primary.h - 120 + 360) % 360, 4);
	});

	it('cottontail is lifted two spans and set at 60% of the sRGB boundary', () => {
		const lift = swatches.foreground.l + ladderSpan * 2;
		expect(swatches.cottontail.l).toBeCloseTo(lift, 6);
		expect(swatches.cottontail.h).toBeCloseTo(swatches.primary.h, 4);
		const boundary = swatches.primary.atLightness(lift).maxChroma;
		expect(swatches.cottontail.c / boundary).toBeCloseTo(0.6, 4);
		// Real headroom rather than clipping at the boundary.
		expect(swatches.cottontail.c).toBeLessThan(boundary);
	});

	it('every colour is inside sRGB, so all 17 hexes are honest', () => {
		for (const name of names) expect(swatches[name].isInGamut).toBe(true);
	});

	it('carries its formula, so the page can show provenance', () => {
		expect(swatches.background.description).toContain('the seed');
		expect(swatches.foreground.description).toContain('1 - bl');
		expect(swatches.primary.description).toContain('c * 3');
		expect(swatches.cottontail.description).toContain('maxChroma');
	});
});

// ─── the rules, as assertions ───────────────────────────────────────────────

describe('the prohibitions are measurable', () => {
	it('no two brand colours may touch — every pair is roughly 1:1', () => {
		const mid = onShadeNames.filter((n) => n !== 'cottontail');
		for (const a of mid) {
			for (const b of mid) {
				if (a === b) continue;
				expect(contrastRatio(swatches[a], swatches[b])).toBeLessThan(1.35);
			}
		}
	});

	it('nothing brand-coloured survives on white', () => {
		const white = swatches.foreground.derive('white', { l: 1, c: 0 });
		expect(contrastRatio(swatches.primary, white)).toBeLessThan(2.5);
		expect(contrastRatio(swatches.cottontail, white)).toBeLessThan(1.3);
	});

	it('text on a brand fill is the page shade, never white', () => {
		for (const name of ['primary', 'secondary', 'tertiary', 'accent'] as const) {
			const onShade = contrastRatio(swatches.background, swatches[name]);
			expect(onShade).toBeGreaterThanOrEqual(4.5);
			expect(onShade).toBeGreaterThan(6.5);

			const white = swatches.foreground.derive('white', { l: 1, c: 0 });
			expect(contrastRatio(white, swatches[name])).toBeLessThan(3);
		}
	});

	it('adjacent shades are about 1.1:1, which is why three per viewport is the ceiling', () => {
		for (let i = 1; i < shadeNames.length; i++) {
			const r = contrastRatio(swatches[shadeNames[i]], swatches[shadeNames[i - 1]]);
			expect(r).toBeLessThan(1.25);
		}
	});

	it('the logo lockup is 1.94:1 — a logotype allowance, not a mistake', () => {
		expect(contrastRatio(swatches.cottontail, swatches.primary)).toBeCloseTo(1.94, 2);
	});

	it('and it barely moves under greyscale or any dichromacy', () => {
		const normal = contrastRatio(swatches.cottontail, swatches.primary);
		for (const sim of ['grayscale', 'protanopia', 'deuteranopia', 'tritanopia'] as const) {
			const r = contrastRatio(
				simulateVision(swatches.cottontail, sim),
				simulateVision(swatches.primary, sim)
			);
			// Within 0.05 of normal vision — the payoff of separating by lightness, not hue.
			expect(Math.abs(r - normal)).toBeLessThan(0.05);
		}
	});
});

// ─── the logo combos ────────────────────────────────────────────────────────

describe('logo combos', () => {
	it('are exactly the three sanctioned pairs', () => {
		expect(logoCombos.map((c) => c.id)).toEqual(['bg-primary', 'primary-bg', 'primary-cottontail']);
	});

	it('the default is the bare mark in primary on a shade, and it is comfortable', () => {
		const main = logoCombos[0];
		expect(main.kind).toBe('plain');
		expect(main.ground).toBe('background');
		expect(main.ink).toBe('primary');
		expect(contrastRatio(swatches.primary, swatches.background)).toBeCloseTo(7.06, 2);
		expect(main.exempt).toBeUndefined();
	});

	it('the flipped badge is the same pair the other way round, equally comfortable', () => {
		const flipped = logoCombos[1];
		expect(flipped.kind).toBe('disc');
		expect(flipped.ground).toBe('primary');
		expect(flipped.ink).toBe('background');
		expect(contrastRatio(swatches.background, swatches.primary)).toBeGreaterThanOrEqual(4.5);
	});

	it('only the cottontail badge relies on the logotype exemption', () => {
		const exempt = logoCombos.filter((c) => c.exempt);
		expect(exempt.map((c) => c.id)).toEqual(['primary-cottontail']);
		expect(contrastRatio(swatches.cottontail, swatches.primary)).toBeLessThan(3);
	});

	it('COTTONTAIL IS NEVER USED EXCEPT ON PRIMARY', () => {
		// The rule that is easiest to break by accident — a bright colour is tempting for a headline.
		// Every combo that inks with cottontail must sit on primary, and nothing else may.
		for (const combo of logoCombos) {
			if (combo.ink === 'cottontail') expect(combo.ground).toBe('primary');
		}
		for (const entry of plainInks) {
			expect(entry.ink).not.toBe('cottontail');
		}
	});

	it('the bare-mark inks are the three that actually work', () => {
		expect(plainInks.map((i) => i.ink)).toEqual(['foreground', 'primary', 'background']);
		// foreground and primary both clear AA on every shade; background is for a light ground.
		for (const shade of shadeNames) {
			expect(contrastRatio(swatches.foreground, swatches[shade])).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(swatches.primary, swatches[shade])).toBeGreaterThanOrEqual(4.5);
		}
		const white = swatches.foreground.derive('white', { l: 1, c: 0 });
		expect(contrastRatio(swatches.background, white)).toBeGreaterThan(10);
	});
});

describe('cottontail as the focus ring', () => {
	it('clears 3:1 against every shade, so the ring is visible anywhere on the page', () => {
		for (const shade of shadeNames) {
			expect(contrastRatio(swatches.cottontail, swatches[shade])).toBeGreaterThanOrEqual(3);
		}
	});

	it('needs the offset gap against a brand fill, which is why the pattern has one', () => {
		// Ring against a primary button alone is under 3:1 — it only works via ring / gap / component.
		expect(contrastRatio(swatches.cottontail, swatches.primary)).toBeLessThan(3);
		// Ring against the gap, and the gap against the button, both clear.
		expect(contrastRatio(swatches.cottontail, swatches.background)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(swatches.background, swatches.primary)).toBeGreaterThanOrEqual(3);
	});

	it('takes `background` as its text and never `foreground`', () => {
		expect(contrastRatio(swatches.background, swatches.cottontail)).toBeGreaterThan(10);
		expect(contrastRatio(swatches.foreground, swatches.cottontail)).toBeLessThan(2.5);
	});

	it('must never touch another brand colour', () => {
		for (const name of onShadeNames) {
			if (name === 'cottontail') continue;
			expect(contrastRatio(swatches.cottontail, swatches[name])).toBeLessThan(2.2);
		}
	});
});

// ─── modifiers ──────────────────────────────────────────────────────────────

describe('modifiers', () => {
	it('border at 67% clears 3:1 on EVERY shade, which muted at 65% does not', () => {
		for (const shade of shadeNames) {
			expect(modifierRatio('foreground', shade, 'border')).toBeGreaterThanOrEqual(3);
		}
		const mutedOnLightest = modifierRatio('foreground', 'bg_lightest', 'muted');
		expect(mutedOnLightest).toBeLessThan(3);
	});

	it('muted is AA-large at best on the page shade', () => {
		const r = modifierRatio('foreground', 'background', 'muted');
		expect(r).toBeGreaterThanOrEqual(3);
		expect(r).toBeLessThan(4.5);
	});

	it('disabled is exempt territory and must never carry information', () => {
		expect(modifierRatio('foreground', 'background', 'disabled')).toBeLessThan(3);
	});

	it('composites in gamma sRGB, not linear-light', () => {
		// A linear blend of the same pair lands measurably elsewhere; browsers paint gamma.
		const gamma = mixOver(swatches.foreground, swatches.background, 0.5);
		expect(gamma.srgb[0]).toBeCloseTo(
			(swatches.foreground.srgb[0] + swatches.background.srgb[0]) / 2,
			2
		);
	});

	it('declares exactly the documented alphas', () => {
		expect(modifiers).toEqual({
			hover: 0.85,
			active: 0.7,
			muted: 0.65,
			disabled: 0.38,
			border: 0.67
		});
	});
});

// ─── structure ──────────────────────────────────────────────────────────────

describe('structure', () => {
	it('groups cover every colour exactly once', () => {
		const grouped = groups.flatMap((g) => g.swatches);
		expect([...grouped].sort()).toEqual([...names].sort());
		expect(new Set(grouped).size).toBe(grouped.length);
	});

	it('groups are the documented five, in order', () => {
		expect(groups.map((g) => g.id)).toEqual(['surfaces', 'content', 'brand', 'identity', 'states']);
		expect(groups.map((g) => g.swatches.length)).toEqual([7, 1, 4, 1, 4]);
	});

	it('isShade partitions the palette with no overlap and nothing left over', () => {
		expect(names.filter(isShade).sort()).toEqual([...shadeNames].sort());
		expect(names.filter((n) => !isShade(n)).sort()).toEqual([...onShadeNames].sort());
	});

	it('the swatch label rule is binary, and both branches are legible', () => {
		for (const name of names) {
			const label = labelFor(name);
			expect(label).toBe(isShade(name) ? 'foreground' : 'background');
			expect(contrastRatio(swatches[label], swatches[name])).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('and the alternatives genuinely do not work', () => {
		const white = swatches.foreground.derive('white', { l: 1, c: 0 });
		// On cottontail only `background` is legible — foreground and white both fail.
		expect(contrastRatio(swatches.foreground, swatches.cottontail)).toBeLessThan(2.5);
		expect(contrastRatio(white, swatches.cottontail)).toBeLessThan(1.3);
		expect(contrastRatio(swatches.background, swatches.cottontail)).toBeGreaterThan(10);
	});

	it('no shade name and no colour name is a light-mode leftover', () => {
		// Guards the "dark only" rule against a stray inverted token creeping back in.
		for (const name of names) {
			expect(name).not.toMatch(/light-mode|-inverse|_light_mode/);
		}
		const shades: readonly ShadeName[] = shadeNames;
		expect(shades).toContain('background');
	});
});
