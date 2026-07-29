/**
 * Brand Dark v4 — the palette. EDIT HERE.
 *
 * **DARK ONLY.** There is no light mode. It is designed but not built, so there is nothing here to
 * invert and no toggle to add. See `prohibitions.ts`.
 *
 * 17 colours, all generated from ONE literal — the seed `oklch(0.255 0.0233 230.47)`. Nothing is
 * hand-picked. This file is a transcription of the Chromatics scheme, kept in the same shape so the
 * two can be diffed by eye:
 *
 *   7 surface shades    the elevation ladder
 *   1 foreground        all body copy
 *   4 brand             hue is identity, chroma is rank
 *   1 identity          cottontail — the badge ink, only ever on primary
 *   4 states            fixed cultural hues
 *
 * THE CONTRACT: every one of the 10 non-shade colours clears WCAG AA (4.5:1) against every one of
 * the 7 shades. 63 of those pairs are the load-bearing ones (the 9 at lightness 0.745); worst case
 * 4.59. The practical consequence is that ANY shade can back ANY section and nothing needs
 * re-checking. `tests/palette.test.ts` asserts it, so it cannot rot.
 */
import { Color } from '$lib/color';

/* ── 1. Seed — the only literal ─────────────────────────────────────────── */

export const background = new Color(
	'background',
	0.255,
	0.0233,
	230.47,
	'OKLCH(0.255, 0.0233, 230.47) — the seed'
);

const c = background.c;
const bl = background.l;
const bh = background.h;

/* ── 2. Foreground ──────────────────────────────────────────────────────── */

const foreground = background.derive(
	'foreground',
	{ l: 1 - bl, c: c / 3, h: (bh + 180) % 360 },
	'OKLCH(1 - bl, c / 3, (bh + 180) % 360)'
);

/* ── 3. Brand — hue is identity, chroma is rank ─────────────────────────── */

/**
 * The seed's chroma is the quantum: every rank is an integer multiple of it. Pinning primary at 3c
 * forces the count — exactly two rungs beneath it, exactly two quieter siblings. 5c is left empty
 * so the brand band (1–4c) and the state band (6c) stay apart.
 */
const primary = background.derive(
	'primary',
	{ l: foreground.l, c: c * 3, h: (foreground.h + 72) % 360 },
	'OKLCH(foreground.ok_l, c * 3, (foreground.ok_h + 72) % 360)'
);

const secondary = primary
	.complement('secondary')
	.atChroma(c * 2, 'secondary', 'primary.complement().atChroma(c * 2)');

const accent = primary
	.derive('accent', { h: foreground.h })
	.atChroma(c * 4, 'accent', 'primary.derive({ h: foreground.ok_h }).atChroma(c * 4)');

const tertiary = primary
	.shift('tertiary', { h: -120 })
	.atChroma(c * 1, 'tertiary', 'primary.shift({ h: -120 }).atChroma(c * 1)');

/* ── 4. States — fixed cultural hues at the top of the chroma ladder ────── */

const state = (name: string, hue: number) =>
	background.derive(
		name,
		{ l: foreground.l, c: c * 6, h: hue },
		`OKLCH(foreground.ok_l, c * 6, ${hue})`
	);

/* ── 5. How far the ladder may reach — SOLVED, not chosen ───────────────── */

/**
 * `span` is the ladder's half-reach in lightness, and it is a solved quantity: the lightest shade
 * is the lightest colour on which the hardest text still clears AA. `error` is the hardest (lowest
 * luminance of everything at L 0.745).
 *
 * The Chromatics scheme solves it with `ensureContrast(background.atLightness(0.50), error, 4.55)`
 * and lands on 0.100. Kept as a literal here rather than re-deriving it, because reimplementing
 * that solver would be a second source of truth for one number — and a number this load-bearing
 * should be asserted, not recomputed. `tests/palette.test.ts` proves the property that matters:
 * the contract holds at 0.100 and breaks above ~0.1047, so 0.100 sits at 96% of the true ceiling.
 *
 * Move the seed or change the states and this has to be re-solved in Chromatics.
 */
const span = 0.1;

/* ── 6. The ladder — lightest to darkest ────────────────────────────────── */

/**
 * Chroma is proportional to lightness, which below the gamut cusp is the same as holding chroma at
 * a constant fraction of the sRGB boundary. Lighter shades gain colour so they read as *elevated*;
 * darker ones lose it and recede. Nothing leaves gamut.
 */
const shade = (name: string, l: number, formula: string) =>
	background.derive(name, { l, c: (c * l) / bl }, formula);

/* ── 6b. Identity ───────────────────────────────────────────────────────── */

/**
 * cottontail — the brightest colour in the system, and the ink of the two-tone badge.
 *
 * Used ONLY as the mark on a primary ground. Never as text, anywhere: on a primary fill it is
 * 1.94:1, which is a logotype allowance and nothing more.
 *
 * Lightness is two ladder spans above the text colour: it has to clear L 0.94 or the ears stop
 * reading on the disc. Chroma is 60% of the sRGB boundary at that lightness and hue — expressed as
 * a fraction rather than an absolute so it keeps its relationship to the gamut if the seed hue
 * moves. 0.60 leaves real headroom; 0.92 would be full neon and would clip if the seed shifted.
 *
 * Contrast is flat across that whole range (13.7 on the page, 1.94 on primary), so the fraction is
 * a look decision, not a legibility one.
 */
const lift = foreground.l + span * 2;
const cottontailBase = primary.atLightness(lift);
const cottontail = cottontailBase.atChroma(
	cottontailBase.maxChroma * 0.6,
	'cottontail',
	'primary.atLightness(lift).atChroma(maxChroma() * 0.60)'
);

/* ── The registry ───────────────────────────────────────────────────────── */

/**
 * Flat and `as const`, so every key is a string literal type and a group or role naming a swatch
 * that does not exist is a `svelte-check` error rather than a runtime surprise.
 *
 * Order is the elevation ladder first, lightest to darkest, then content, brand, identity, states.
 */
export const swatches = {
	bg_lightest: shade('bg_lightest', bl + span, 'OKLCH(bl + span, c * (bl + span) / bl, bh)'),
	bg_lighter: shade(
		'bg_lighter',
		bl + (span * 2) / 3,
		'OKLCH(bl + span * 2/3, c * (bl + span * 2/3) / bl, bh)'
	),
	bg_light: shade('bg_light', bl + span / 3, 'OKLCH(bl + span / 3, c * (bl + span / 3) / bl, bh)'),
	background,
	bg_dark: shade('bg_dark', bl - span / 3, 'OKLCH(bl - span / 3, c * (bl - span / 3) / bl, bh)'),
	bg_darker: shade(
		'bg_darker',
		bl - (span * 2) / 3,
		'OKLCH(bl - span * 2/3, c * (bl - span * 2/3) / bl, bh)'
	),
	bg_darkest: shade('bg_darkest', bl - span, 'OKLCH(bl - span, c * (bl - span) / bl, bh)'),

	foreground,

	tertiary,
	secondary,
	primary,
	accent,

	cottontail,

	success: state('success', 140),
	warning: state('warning', 70),
	error: state('error', 30),
	info: state('info', 240)
} as const;

export type SwatchName = keyof typeof swatches;

/* ── Structure ──────────────────────────────────────────────────────────── */

/** The 7 legal page/section backgrounds, lightest to darkest. */
export const shadeNames = [
	'bg_lightest',
	'bg_lighter',
	'bg_light',
	'background',
	'bg_dark',
	'bg_darker',
	'bg_darkest'
] as const satisfies readonly SwatchName[];

export type ShadeName = (typeof shadeNames)[number];

/** Everything that is not a shade — i.e. everything the contract has to hold for. */
export const onShadeNames = [
	'foreground',
	'tertiary',
	'secondary',
	'primary',
	'accent',
	'cottontail',
	'success',
	'warning',
	'error',
	'info'
] as const satisfies readonly SwatchName[];

export function isShade(name: string): name is ShadeName {
	return (shadeNames as readonly string[]).includes(name);
}

export interface PaletteGroup {
	/** Anchor id, so a group is directly linkable. */
	id: string;
	label: string;
	description?: string;
	swatches: readonly SwatchName[];
}

export const groups: readonly PaletteGroup[] = [
	{
		id: 'surfaces',
		label: 'Surfaces',
		description:
			'Seven shades of the same deep blue-grey. Pick any of them for a background — three at a ' +
			'time is plenty.',
		swatches: shadeNames
	},
	{
		id: 'content',
		label: 'Content',
		description: 'For everything you read.',
		swatches: ['foreground']
	},
	{
		id: 'brand',
		label: 'Brand',
		description:
			'Four colours at the same brightness, so none of them shouts. Give them a little space and ' +
			'they get along.',
		swatches: ['tertiary', 'secondary', 'primary', 'accent']
	},
	{
		id: 'identity',
		label: 'Identity',
		description:
			"The brightest thing here, named after the flash of a rabbit's tail. It has exactly one job: " +
			'the mark on a primary badge. Never text.',
		swatches: ['cottontail']
	},
	{
		id: 'states',
		label: 'States',
		description: 'The familiar four. Here for reference, not decoration.',
		swatches: ['success', 'warning', 'error', 'info']
	}
];

/* ── Modifiers ──────────────────────────────────────────────────────────── */

/**
 * Interaction and de-emphasis are opacity on an existing colour, never a new colour. Composited in
 * gamma sRGB (`color-mix(in srgb, …)`), which is what a browser paints.
 */
export const modifiers = {
	hover: 0.85,
	active: 0.7,
	/** AA-large at best — captions and metadata only, and not on the lightest two shades. */
	muted: 0.65,
	/** 2.17:1. Legally exempt, but never for anything informational. */
	disabled: 0.38,
	/** The lowest alpha clearing 3:1 on EVERY shade. `muted` at 0.65 misses it on the lightest two. */
	border: 0.67
} as const;

export type ModifierName = keyof typeof modifiers;

/** The span, exported so the page and the tests can state it. */
export const ladderSpan = span;
