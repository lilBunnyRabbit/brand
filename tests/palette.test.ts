import { describe, expect, it } from 'bun:test';

import { contrastRatio, mixOver, simulateVision } from '../src/lib/color';
import {
	dark,
	groupsFor,
	isShade,
	ladderSpan,
	light,
	lightLadderSpan,
	markEars,
	modifiers,
	onShadeNames,
	shadeNames,
	themeNames,
	themes,
	tokenName,
	type ShadeName,
	type SwatchName
} from '../src/lib/brand/config/palette';
import {
	brandStyleSheet,
	cottontailOnShades,
	exportCss,
	exportJson,
	labelFor,
	measureContract,
	modifierRatio,
	perceptiblyOutOfGamut
} from '../src/lib/brand/tokens';

import { logoCombos, plainInks } from '../src/lib/brand/config/logo-combos';

const background = dark.background;
const GROUPS = groupsFor('dark');

/**
 * The authored palette table, verbatim. This is the contract: the config expresses every colour as
 * a FORMULA against one seed, and these are the values those formulas must reproduce. A
 * mis-transcribed formula fails here rather than shipping.
 */
const TABLE: Record<SwatchName, { hex: string; l: number; c: number; h: number }> = {
	background_lightest: { hex: '#2a3f4a', l: 0.355, c: 0.03244, h: 230.47 },
	background_lighter: { hex: '#233640', l: 0.32167, c: 0.02939, h: 230.47 },
	background_light: { hex: '#1d2d36', l: 0.28833, c: 0.02635, h: 230.47 },
	background: { hex: '#17252c', l: 0.255, c: 0.0233, h: 230.47 },
	background_dark: { hex: '#111d23', l: 0.22167, c: 0.02025, h: 230.47 },
	background_darker: { hex: '#0b151a', l: 0.18833, c: 0.01721, h: 230.47 },
	background_darkest: { hex: '#060d11', l: 0.155, c: 0.01416, h: 230.47 },
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
		expect(Object.keys(dark)).toEqual(names);
		expect(names.length).toBe(17);
	});

	for (const name of names) {
		it(`${name} → ${TABLE[name].hex}`, () => {
			const swatch = dark[name];
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
	const contract = measureContract('dark');

	it('every non-shade colour clears AA against every shade', () => {
		expect(contract.holds).toBe(true);
		expect(contract.worst.ratio).toBeGreaterThanOrEqual(4.5);
	});

	it('the worst cell is error on background_lightest at 4.59', () => {
		// error has the lowest luminance of everything at L 0.745, and background_lightest is the lightest
		// legal ground — so this is the pair that sizes the whole ladder.
		expect(contract.worst.on).toBe('error');
		expect(contract.worst.shade).toBe('background_lightest');
		expect(contract.worst.ratio).toBeCloseTo(4.59, 2);
	});

	it('covers 7 shades × 9 rail colours', () => {
		expect(shadeNames.length).toBe(7);
		expect(onShadeNames.length).toBe(10);
		expect(contract.count).toBe(63);
	});

	it('so ANY shade can back ANY section — the practical consequence', () => {
		for (const shade of shadeNames) {
			const worst = Math.min(...onShadeNames.map((n) => contrastRatio(dark[n], dark[shade])));
			expect(worst).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe('the ladder span is a ceiling, not a preference', () => {
	const worstAt = (span: number) => {
		const l = background.l + span;
		const shade = background.derive('probe', { l, c: (background.c * l) / background.l });
		return Math.min(...onShadeNames.map((n) => contrastRatio(dark[n], shade)));
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
			expect(dark[name].h).toBeCloseTo(background.h, 4);
		}
	});

	it('shade chroma is proportional to lightness, so lighter reads as elevated', () => {
		for (const name of shadeNames) {
			const s = dark[name];
			expect(s.c).toBeCloseTo((background.c * s.l) / background.l, 6);
		}
		// Monotonic: unlike the earlier scheme, chroma does NOT rise in both directions.
		const chromas = shadeNames.map((n) => dark[n].c);
		for (let i = 1; i < chromas.length; i++) expect(chromas[i]).toBeLessThan(chromas[i - 1]);
	});

	it('the ladder is symmetric about the seed', () => {
		expect(dark.background_lightest.l - background.l).toBeCloseTo(ladderSpan, 6);
		expect(background.l - dark.background_darkest.l).toBeCloseTo(ladderSpan, 6);
	});

	it('foreground inverts the seed lightness and opposes its hue, wrapped', () => {
		expect(dark.foreground.l).toBeCloseTo(1 - background.l, 6);
		expect(dark.foreground.c).toBeCloseTo(background.c / 3, 6);
		// 230.47 + 180 = 410.47 must wrap to 50.47, or the token displays a hue over 360.
		expect(dark.foreground.h).toBeLessThan(360);
		expect(dark.foreground.h).toBeCloseTo(50.47, 4);
	});

	it('brand chroma is an integer multiple of the seed chroma — rank, not taste', () => {
		const q = background.c;
		expect(dark.tertiary.c).toBeCloseTo(q * 1, 6);
		expect(dark.secondary.c).toBeCloseTo(q * 2, 6);
		expect(dark.primary.c).toBeCloseTo(q * 3, 6);
		expect(dark.accent.c).toBeCloseTo(q * 4, 6);
		// 5c is deliberately empty, so the brand band and the state band stay apart.
		for (const n of ['success', 'warning', 'error', 'info'] as const) {
			expect(dark[n].c).toBeCloseTo(q * 6, 6);
		}
	});

	it('all nine mid colours share one lightness — which is why none may touch', () => {
		const l = dark.foreground.l;
		for (const name of onShadeNames) {
			if (name === 'cottontail') continue;
			expect(dark[name].l).toBeCloseTo(l, 6);
		}
	});

	it('secondary is primary’s complement; accent takes the foreground hue', () => {
		expect(Math.abs(dark.secondary.h - dark.primary.h)).toBeCloseTo(180, 4);
		expect(dark.accent.h).toBeCloseTo(dark.foreground.h, 4);
		expect(dark.tertiary.h).toBeCloseTo((dark.primary.h - 120 + 360) % 360, 4);
	});

	it('cottontail is lifted two spans and set at 60% of the sRGB boundary', () => {
		const lift = dark.foreground.l + ladderSpan * 2;
		expect(dark.cottontail.l).toBeCloseTo(lift, 6);
		expect(dark.cottontail.h).toBeCloseTo(dark.primary.h, 4);
		const boundary = dark.primary.atLightness(lift).maxChroma;
		expect(dark.cottontail.c / boundary).toBeCloseTo(0.6, 4);
		// Real headroom rather than clipping at the boundary.
		expect(dark.cottontail.c).toBeLessThan(boundary);
	});

	it('every colour is inside sRGB, so all 17 hexes are honest', () => {
		for (const name of names) expect(dark[name].isInGamut).toBe(true);
	});

	it('carries its formula, so the page can show provenance', () => {
		expect(dark.background.description).toContain('the seed');
		expect(dark.foreground.description).toContain('1 - bl');
		expect(dark.primary.description).toContain('c * 3');
		expect(dark.cottontail.description).toContain('maxChroma');
	});
});

// ─── the rules, as assertions ───────────────────────────────────────────────

describe('the prohibitions are measurable', () => {
	it('no two brand colours may touch — every pair is roughly 1:1', () => {
		const mid = onShadeNames.filter((n) => n !== 'cottontail');
		for (const a of mid) {
			for (const b of mid) {
				if (a === b) continue;
				expect(contrastRatio(dark[a], dark[b])).toBeLessThan(1.35);
			}
		}
	});

	it('nothing brand-coloured survives on white', () => {
		const white = dark.foreground.derive('white', { l: 1, c: 0 });
		expect(contrastRatio(dark.primary, white)).toBeLessThan(2.5);
		expect(contrastRatio(dark.cottontail, white)).toBeLessThan(1.3);
	});

	it('text on a brand fill is the page shade, never white', () => {
		for (const name of ['primary', 'secondary', 'tertiary', 'accent'] as const) {
			const onShade = contrastRatio(dark.background, dark[name]);
			expect(onShade).toBeGreaterThanOrEqual(4.5);
			expect(onShade).toBeGreaterThan(6.5);

			const white = dark.foreground.derive('white', { l: 1, c: 0 });
			expect(contrastRatio(white, dark[name])).toBeLessThan(3);
		}
	});

	it('adjacent shades are about 1.1:1, which is why three per viewport is the ceiling', () => {
		for (let i = 1; i < shadeNames.length; i++) {
			const r = contrastRatio(dark[shadeNames[i]], dark[shadeNames[i - 1]]);
			expect(r).toBeLessThan(1.25);
		}
	});

	it('the logo lockup is 1.94:1 — a logotype allowance, not a mistake', () => {
		expect(contrastRatio(dark.cottontail, dark.primary)).toBeCloseTo(1.94, 2);
	});

	it('and it barely moves under greyscale or any dichromacy', () => {
		const normal = contrastRatio(dark.cottontail, dark.primary);
		for (const sim of ['grayscale', 'protanopia', 'deuteranopia', 'tritanopia'] as const) {
			const r = contrastRatio(
				simulateVision(dark.cottontail, sim),
				simulateVision(dark.primary, sim)
			);
			// Within 0.05 of normal vision — the payoff of separating by lightness, not hue.
			expect(Math.abs(r - normal)).toBeLessThan(0.05);
		}
	});
});

// ─── the logo combos ────────────────────────────────────────────────────────

describe('logo combos', () => {
	it('are the three brand pairs plus the neutral pair', () => {
		expect(logoCombos.map((c) => c.id)).toEqual([
			'bg-primary',
			'primary-bg',
			'primary-cottontail',
			'fg-bg',
			'bg-fg'
		]);
	});

	it('the neutral pair uses no brand colour at all', () => {
		const neutral = logoCombos.filter((c) => c.id === 'fg-bg' || c.id === 'bg-fg');
		expect(neutral).toHaveLength(2);
		for (const combo of neutral) {
			expect(['foreground', 'background']).toContain(combo.ground);
			expect(['foreground', 'background']).toContain(combo.ink);
			expect(combo.exempt).toBeUndefined();
		}
		// Body text's own pair, so it needs nothing the page does not already have.
		expect(contrastRatio(dark.foreground, dark.background)).toBeCloseTo(6.92, 2);
		expect(contrastRatio(light.foreground, light.background)).toBeCloseTo(7.04, 2);
	});

	it('the inverted neutral is a knockout — the disc IS the page', () => {
		// Worth labelling as such rather than as a badge: only the ears are visible.
		const knockout = logoCombos.find((c) => c.id === 'bg-fg')!;
		expect(contrastRatio(dark[knockout.ground], dark.background)).toBeCloseTo(1.0, 2);
	});

	it('the default is the bare mark in primary on a shade, and it is comfortable', () => {
		const main = logoCombos[0];
		expect(main.kind).toBe('plain');
		expect(main.ground).toBe('background');
		expect(main.ink).toBe('primary');
		expect(contrastRatio(dark.primary, dark.background)).toBeCloseTo(7.06, 2);
		expect(main.exempt).toBeUndefined();
	});

	it('the flipped badge is the same pair the other way round, equally comfortable', () => {
		const flipped = logoCombos[1];
		expect(flipped.kind).toBe('disc');
		expect(flipped.ground).toBe('primary');
		expect(flipped.ink).toBe('background');
		expect(contrastRatio(dark.background, dark.primary)).toBeGreaterThanOrEqual(4.5);
	});

	it('only the cottontail badge relies on the logotype exemption', () => {
		const exempt = logoCombos.filter((c) => c.exempt);
		expect(exempt.map((c) => c.id)).toEqual(['primary-cottontail']);
		expect(contrastRatio(dark.cottontail, dark.primary)).toBeLessThan(3);
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
			expect(contrastRatio(dark.foreground, dark[shade])).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark.primary, dark[shade])).toBeGreaterThanOrEqual(4.5);
		}
		const white = dark.foreground.derive('white', { l: 1, c: 0 });
		expect(contrastRatio(dark.background, white)).toBeGreaterThan(10);
	});
});

describe('cottontail as the focus ring', () => {
	it('clears 3:1 against every shade, so the ring is visible anywhere on the page', () => {
		for (const shade of shadeNames) {
			expect(contrastRatio(dark.cottontail, dark[shade])).toBeGreaterThanOrEqual(3);
		}
	});

	it('needs the offset gap against a brand fill, which is why the pattern has one', () => {
		// Ring against a primary button alone is under 3:1 — it only works via ring / gap / component.
		expect(contrastRatio(dark.cottontail, dark.primary)).toBeLessThan(3);
		// Ring against the gap, and the gap against the button, both clear.
		expect(contrastRatio(dark.cottontail, dark.background)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(dark.background, dark.primary)).toBeGreaterThanOrEqual(3);
	});

	it('takes `background` as its text and never `foreground`', () => {
		expect(contrastRatio(dark.background, dark.cottontail)).toBeGreaterThan(10);
		expect(contrastRatio(dark.foreground, dark.cottontail)).toBeLessThan(2.5);
	});

	it('must never touch another brand colour', () => {
		for (const name of onShadeNames) {
			if (name === 'cottontail') continue;
			expect(contrastRatio(dark.cottontail, dark[name])).toBeLessThan(2.2);
		}
	});
});

// ─── modifiers ──────────────────────────────────────────────────────────────

describe('modifiers', () => {
	it('border at 67% clears 3:1 on EVERY shade, which muted at 65% does not', () => {
		for (const shade of shadeNames) {
			expect(modifierRatio('foreground', shade, 'border')).toBeGreaterThanOrEqual(3);
		}
		const mutedOnLightest = modifierRatio('foreground', 'background_lightest', 'muted');
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
		const gamma = mixOver(dark.foreground, dark.background, 0.5);
		expect(gamma.srgb[0]).toBeCloseTo((dark.foreground.srgb[0] + dark.background.srgb[0]) / 2, 2);
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

	it('the swatch label rule is binary, and both branches are legible', () => {
		for (const name of names) {
			const label = labelFor(name);
			expect(label).toBe(isShade(name) ? 'foreground' : 'background');
			expect(contrastRatio(dark[label], dark[name])).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('and the alternatives genuinely do not work', () => {
		const white = dark.foreground.derive('white', { l: 1, c: 0 });
		// On cottontail only `background` is legible — foreground and white both fail.
		expect(contrastRatio(dark.foreground, dark.cottontail)).toBeLessThan(2.5);
		expect(contrastRatio(white, dark.cottontail)).toBeLessThan(1.3);
		expect(contrastRatio(dark.background, dark.cottontail)).toBeGreaterThan(10);
	});

	it('no colour name carries its own mode — the mode is the scope', () => {
		// Both palettes are keyed identically, so a `light_`-prefixed KEY would mean the twin set had
		// been forked instead of scoped. The `light_` vocabulary belongs to display only.
		for (const name of names) {
			expect(name).not.toMatch(/^light_|-inverse|_darkmode$/);
		}
		const shades: readonly ShadeName[] = shadeNames;
		expect(shades).toContain('background');
	});
});

// ─── LIGHT MODE ─────────────────────────────────────────────────────────────

/**
 * The light twin, transcribed rather than derived — `palette.light.ts` says why. That makes pinning
 * the values load-bearing in a way the dark table is not: dark would fail here if a formula were
 * mistyped, light fails here if a HEX were mistyped, and there is no derivation to fall back on.
 */
const LIGHT_TABLE: Record<SwatchName, string> = {
	background_lightest: '#ffffff',
	background_lighter: '#fff8e8',
	background_light: '#fbf2e2',
	background: '#f5ecdc',
	background_dark: '#e8decf',
	background_darker: '#dbd1c2',
	background_darkest: '#cec4b5',
	foreground: '#474f5c',
	tertiary: '#4e4d59',
	secondary: '#335653',
	primary: '#6a442f',
	accent: '#6b3c5e',
	cottontail: '#af5100',
	success: '#225e12',
	warning: '#535200',
	error: '#852d22',
	info: '#00548a'
};

describe('the light twin', () => {
	it('carries exactly the dark keys, in the same order', () => {
		expect(Object.keys(light)).toEqual(Object.keys(dark));
	});

	for (const name of names) {
		it(`light_${name} → ${LIGHT_TABLE[name]}`, () => {
			expect(light[name].hex).toBe(LIGHT_TABLE[name]);
		});
	}

	it('is inside sRGB to within a rounding error, and every hex is exact', () => {
		// Two of these are a hair outside because Chromatics' gamut mapper stopped there:
		// background_lighter overshoots red by 0.00001, warning undershoots blue by 0.00027. Both round
		// to exact hexes, so nothing is misreported — but the strict check would flag them, which is why
		// the page badges on `perceptiblyOutOfGamut` instead.
		for (const name of names) {
			expect(perceptiblyOutOfGamut(light[name])).toBe(false);
		}
		const strict = names.filter((n) => !light[n].isInGamut);
		expect(strict).toEqual(['background_lighter', 'warning']);
	});

	it('is registered under both mode names', () => {
		expect(themeNames).toEqual(['dark', 'light']);
		expect(themes.dark).toBe(dark);
		expect(themes.light).toBe(light);
	});

	it('displays under the scheme’s own vocabulary', () => {
		expect(tokenName('primary', 'dark')).toBe('primary');
		expect(tokenName('primary', 'light')).toBe('light_primary');
	});
});

describe('the contract holds in light too', () => {
	const contract = measureContract('light');

	it('all 63 pairs clear AA', () => {
		expect(contract.count).toBe(63);
		expect(contract.holds).toBe(true);
	});

	it('the worst cell is success on light_background_darkest at 4.59', () => {
		// The mirror of dark's worst cell: the hardest rail colour on the furthest legal ground. That
		// both modes land on 4.59 is the point — neither is the compromise.
		expect(contract.worst.on).toBe('success');
		expect(contract.worst.shade).toBe('background_darkest');
		expect(contract.worst.ratio).toBeCloseTo(4.59, 2);
	});

	it('body text is matched across modes rather than merely passing', () => {
		expect(contrastRatio(dark.foreground, dark.background)).toBeCloseTo(6.92, 2);
		expect(contrastRatio(light.foreground, light.background)).toBeCloseTo(7.04, 2);
		// Within 2% of each other, so neither mode reads harsher.
		const d = contrastRatio(dark.foreground, dark.background);
		const l = contrastRatio(light.foreground, light.background);
		expect(Math.abs(d - l) / d).toBeLessThan(0.02);
	});

	it('the label rule is binary in light as well, and legible on 16 of 17 plates', () => {
		const short: string[] = [];
		for (const name of names) {
			const ratio = contrastRatio(light[labelFor(name)], light[name]);
			if (ratio < 4.5) short.push(name);
			expect(ratio).toBeGreaterThanOrEqual(4.4);
		}
		// ONE cell misses AA, by 0.05: `light_background` on the `light_cottontail` plate is 4.451.
		// The rule is kept as specified rather than special-cased — but it is a real miss, it is the
		// only one in either mode, and it is asserted here so it cannot be forgotten. Dark's worst
		// label cell is 4.84, comfortably clear.
		expect(short).toEqual(['cottontail']);
		expect(contrastRatio(light.background, light.cottontail)).toBeCloseTo(4.451, 3);
	});
});

describe('what light mode does NOT get', () => {
	it('cottontail changes job: dark clears every shade, light does not', () => {
		const d = cottontailOnShades('dark');
		const l = cottontailOnShades('light');
		expect(d.min).toBeCloseTo(9.56, 1);
		expect(d.max).toBeCloseTo(16.98, 1);
		// 3.04 clears WCAG 1.4.11's 3:1 for a UI component and nothing more — which is why the light
		// one is a focus ring and a marker, never text and never the logo.
		expect(l.min).toBeCloseTo(3.04, 1);
		expect(l.max).toBeCloseTo(5.23, 1);
		expect(l.min).toBeGreaterThanOrEqual(3);
		expect(l.min).toBeLessThan(4.5);
	});

	it('so it is excluded from the contract in both modes', () => {
		expect(measureContract('dark').pairs.some((p) => p.on === 'cottontail')).toBe(false);
		expect(measureContract('light').pairs.some((p) => p.on === 'cottontail')).toBe(false);
	});
});

describe('the light primary is orange, and that is measured', () => {
	it('sits at the rail lightness with the other three brand ranks', () => {
		const rail = light.foreground.l;
		for (const n of ['tertiary', 'secondary', 'primary', 'accent'] as const) {
			expect(light[n].l).toBeCloseTo(rail, 3);
		}
	});

	it('keeps dark’s accent and tertiary offsets', () => {
		expect(light.accent.h).toBeCloseTo((light.primary.h - 72 + 360) % 360, 2);
		expect(light.tertiary.h).toBeCloseTo((light.primary.h - 120 + 360) % 360, 2);
	});

	it('but secondary could not stay the complement — that lands on info', () => {
		const complement = (light.primary.h + 180) % 360;
		// 230.47 is where +180 would land, and `info` is already there.
		expect(Math.abs(complement - 230.47)).toBeLessThan(1);
		expect(Math.abs(light.secondary.h - complement)).toBeGreaterThan(30);
		expect(light.secondary.h).toBeCloseTo(190, 1);
		// And 190 is genuinely clear of both neighbours it had to avoid.
		expect(Math.abs(light.secondary.h - light.success.h)).toBeGreaterThan(45);
		expect(Math.abs(light.secondary.h - light.info.h)).toBeGreaterThan(45);
	});

	it('and warning could not stay at 70 — that is 10° from the page hue', () => {
		expect(dark.warning.h).toBeCloseTo(70, 1);
		expect(Math.abs(70 - light.background.h)).toBeLessThanOrEqual(10);
		expect(light.warning.h).toBeGreaterThan(105);
		expect(light.warning.h).toBeLessThan(115);
	});

	it('chroma still ranks 1·2·3·4 for brand and 6 for the states', () => {
		const u = light.primary.c / 3;
		expect(light.tertiary.c / u).toBeCloseTo(1, 1);
		expect(light.secondary.c / u).toBeCloseTo(2, 1);
		expect(light.accent.c / u).toBeCloseTo(4, 1);
		// success and error are untouched by the gamut mapper, so they land exactly on 6.
		expect(light.success.c / u).toBeCloseTo(6, 1);
		expect(light.error.c / u).toBeCloseTo(6, 1);
	});
});

describe('the light ladder leans down', () => {
	it('is asymmetric, unlike dark’s ±span', () => {
		expect(lightLadderSpan.up).toBeCloseTo(0.055, 3);
		expect(lightLadderSpan.down).toBeCloseTo(0.12, 3);
		expect(lightLadderSpan.down).toBeGreaterThan(lightLadderSpan.up);
	});

	it('runs out of room upward — the lightest shade is plain white', () => {
		expect(light.background_lightest.l).toBe(1);
		expect(light.background_lightest.c).toBe(0);
		expect(light.background.l + lightLadderSpan.up).toBeCloseTo(1, 6);
	});

	it('divides the solved span downward', () => {
		const bl = light.background.l;
		expect(bl - light.background_dark.l).toBeCloseTo(lightLadderSpan.down / 3, 3);
		expect(bl - light.background_darker.l).toBeCloseTo((lightLadderSpan.down * 2) / 3, 3);
		expect(bl - light.background_darkest.l).toBeCloseTo(lightLadderSpan.down, 3);
	});
});

describe('the mark’s ears do not theme', () => {
	it('are byte-identical to dark cottontail, and not in either palette', () => {
		expect(markEars.hex).toBe('#e0f9ab');
		expect(markEars.hex).toBe(dark.cottontail.hex);
		expect(Object.keys(dark)).not.toContain('mark_ears');
		expect(Object.keys(light)).not.toContain('mark_ears');
	});

	it('beat deriving them from light_primary, which is why they are pinned', () => {
		// Dark's recipe, applied to light: lift two spans off the text colour, 60% of the boundary.
		const lift = light.foreground.l + lightLadderSpan.down * 2;
		const base = light.primary.atLightness(lift);
		const derived = base.atChroma(base.maxChroma * 0.6);
		const grey = (c: typeof markEars) => simulateVision(c, 'grayscale');

		// 2.68 against 7.36 in colour, 2.61 against 7.55 in greyscale. Not a close call in either.
		expect(contrastRatio(derived, light.primary)).toBeLessThan(3);
		expect(contrastRatio(markEars, light.primary)).toBeGreaterThan(7);
		expect(contrastRatio(grey(derived), grey(light.primary))).toBeLessThan(3);
		expect(contrastRatio(grey(markEars), grey(light.primary))).toBeGreaterThan(7);
	});

	it('and the light disc is MORE legible than the dark one', () => {
		// Counter-intuitive: dark's mark survives on the logotype exemption at 1.94, light's clears AAA
		// outright at 7.36. Same ears, different disc.
		expect(contrastRatio(markEars, dark.primary)).toBeCloseTo(1.94, 2);
		expect(contrastRatio(markEars, light.primary)).toBeCloseTo(7.36, 2);
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
			const occurrences = css.split(`--brand-${name}:`).length - 1;
			expect(occurrences).toBe(2);
		}
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
		expect(css).toContain(`--brand-mark_ears: ${markEars.hex};`);
	});

	it('JSON keys each mode under the scheme’s own token names', () => {
		const json = JSON.parse(exportJson()) as Record<string, Record<string, { hex: string }>>;
		expect(Object.keys(json)).toEqual(['dark', 'light', 'fixed']);
		expect(json.dark.primary.hex).toBe(dark.primary.hex);
		expect(json.light.light_primary.hex).toBe(light.primary.hex);
		expect(json.fixed.mark_ears.hex).toBe(markEars.hex);
	});
});
