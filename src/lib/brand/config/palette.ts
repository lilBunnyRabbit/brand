/**
 * The palette. EDIT HERE.
 *
 * Everything derives from ONE seed: `background`. Change its lightness, chroma or hue and the
 * whole scheme moves together, because every other colour is expressed as a formula against it
 * rather than as a pasted hex.
 *
 * The formulas are transcribed exactly as authored:
 *
 *   background            oklch(0.255 0.0233 230.47)                    Source
 *   background-lighter    $background.l + 0.05, $background.c + 0.005, $background.h
 *   background-lightest   $background.l + 0.1,  $background.c + 0.01,  $background.h
 *   background-darker     $background.l - 0.05, $background.c + 0.005, $background.h
 *   background-darkest    $background.l - 0.1,  $background.c + 0.01,  $background.h
 *   foreground            1 - $background.l, $background.c / 3, $background.h + 180
 *   primary               $foreground.l, $background.c * 3, $foreground.h + (360 / 5)
 *   secondary             $primary.l, $primary.c, $primary.h + 180
 *   accent                $primary.l, $primary.c, $foreground.h
 *   success/warning/error/info   $primary.l, $primary.c * 2, <fixed hue>
 *
 * Note the shape of the neutral ramp: lightness moves away from the seed in BOTH directions while
 * chroma *increases* either way. Colour intensifies as the surface departs from the base, which is
 * what stops the darker steps going muddy and the lighter steps going chalky.
 */
import { Color } from '$lib/color';

/* ── the seed ─────────────────────────────────────────────────────────── */

export const background = new Color('background', 0.255, 0.0233, 230.47, 'Source');

/* ── derived ──────────────────────────────────────────────────────────── */

/**
 * Wrap a hue into [0, 360).
 *
 * `derive` sets channels absolutely and does not wrap (only `shift` does), so `230.47 + 180` would
 * be stored as 410.47. That renders identically — hue is modular — but the token would *display*
 * as `oklch(0.745 0.00777 410.47)`, and this guide's whole job is showing correct values.
 */
const wrap = (h: number) => ((h % 360) + 360) % 360;

const foreground = background.derive(
	'foreground',
	{ l: 1 - background.l, c: background.c / 3, h: wrap(background.h + 180) },
	'1 - $background.l, $background.c / 3, $background.h + 180'
);

const primary = background.derive(
	'primary',
	{ l: foreground.l, c: background.c * 3, h: wrap(foreground.h + 360 / 5) },
	'$foreground.l, $background.c * 3, $foreground.h + (360 / 5)'
);

/** Status colours share primary's lightness at double its chroma, on fixed hues. */
const status = (name: string, hue: number, label: string) =>
	primary.derive(name, { c: primary.c * 2, h: hue }, `$primary.l, $primary.c * 2, '${label}' hue`);

/**
 * The flat swatch registry. Keys are the canonical token names.
 *
 * Flat and `as const` on purpose: it makes every key a string literal type, so a role or a group
 * naming a swatch that does not exist is a `svelte-check` error rather than a runtime surprise.
 */
export const swatches = {
	'background-lightest': background.shift(
		'background-lightest',
		{ l: 0.1, c: 0.01 },
		'$background.l + 0.1, $background.c + 0.01, $background.h'
	),
	'background-lighter': background.shift(
		'background-lighter',
		{ l: 0.05, c: 0.005 },
		'$background.l + 0.05, $background.c + 0.005, $background.h'
	),
	background,
	'background-darker': background.shift(
		'background-darker',
		{ l: -0.05, c: 0.005 },
		'$background.l - 0.05, $background.c + 0.005, $background.h'
	),
	'background-darkest': background.shift(
		'background-darkest',
		{ l: -0.1, c: 0.01 },
		'$background.l - 0.1, $background.c + 0.01, $background.h'
	),

	foreground,
	primary,

	secondary: primary.shift('secondary', { h: 180 }, '$primary.l, $primary.c, $primary.h + 180'),
	accent: primary.derive('accent', { h: foreground.h }, '$primary.l, $primary.c, $foreground.h'),

	success: status('success', 140, 'green'),
	warning: status('warning', 70, 'yellow-orange'),
	error: status('error', 30, 'red'),
	info: status('info', 240, 'blue')
} as const;

export type SwatchName = keyof typeof swatches;

/* ── groups ───────────────────────────────────────────────────────────── */

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
			'One seed, stepped ±0.05 and ±0.1 in lightness. Chroma rises in both directions, so the ' +
			'darker steps stay blue rather than going muddy.',
		swatches: [
			'background-lightest',
			'background-lighter',
			'background',
			'background-darker',
			'background-darkest'
		]
	},
	{
		id: 'brand',
		label: 'Brand',
		description:
			'Foreground is the seed inverted in lightness, a third of its chroma, opposite hue. ' +
			'Primary, secondary and accent all sit at that same lightness — they are hue rotations, ' +
			'not tints, so none of them out-shouts another.',
		swatches: ['foreground', 'primary', 'secondary', 'accent']
	},
	{
		id: 'status',
		label: 'Status',
		description:
			"Primary's lightness at double its chroma, on fixed hues. Louder than the brand colours " +
			'by chroma alone, which is what makes them read as signals.',
		swatches: ['success', 'warning', 'error', 'info']
	}
];
