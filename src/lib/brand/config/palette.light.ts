/**
 * Brand Light — the twin set, for product UI only. EDIT HERE.
 *
 * Every dark token has a counterpart here under the SAME key, doing the same job in the same
 * position. Nothing rebinds: switching modes is a scope change, not a remapping. In the scheme's own
 * vocabulary these are the `light_*` tokens, which is what each `Color` carries as its name.
 *
 * It is not an identity palette. Dark is the brand; this exists so a product surface can render
 * light. `config/prohibitions.ts` states the rule.
 *
 * ── WHY THESE ARE LITERALS AND DARK IS DERIVED ──
 *
 * Dark falls out of one seed with arithmetic this codebase owns. Light does not: it leans on two
 * Chromatics solvers that are not vendored here — `ensureContrast()` (used for `foreground` and for
 * the ladder's downward span) and `gamutMap()`, which the scheme calls on all eight rail colours but
 * which only MOVES two of them. `gamutMap` moves lightness and hue as well as chroma, so a
 * chroma-only clip cannot reproduce it. `warning` lands on L 0.4268 H 109.3148 rather than the
 * requested L 0.425 H 110, and `info` on L 0.4329 H 246.2376 rather than L 0.425 H 240 — the drift
 * is the mapper's output, not a rounding artefact. The other six ask for less chroma than sRGB has
 * at the rail, so the call is a no-op and the requested numbers are what ships.
 *
 * The ladder does not use it at all any more. It used to, at the top, and that was the tell that the
 * top was wrong — see `UP`.
 *
 * Reimplementing those solvers would make every number the page states a guess. So the resolved
 * values are transcribed and the recipe is recorded per colour as its description. Same call already
 * made for `ladderSpan` in the dark file, and for the same reason.
 *
 * `tests/palette.test.ts` pins all 17 hexes and re-measures the contract, so a bad transcription
 * fails the build rather than shipping.
 *
 * ── THE PART THAT IS NOT A SWAP ──
 *
 * The light primary is ORANGE, not green. Dark's green sits 13.1 ΔE from this page's own darkened
 * form — it reads as a shade of the paper rather than a colour on it. Orange measures 15.2 in the
 * same position, so the light mode is fitted to its own ground instead of inheriting dark's wheel.
 *
 * One of dark's four brand relationships survives the move, two break, and one has since diverged
 * on dark's side:
 *
 *   accent    = primary − 72     dark's own offset, still legal here
 *   tertiary  = primary − 120    dark's OLD offset. Dark has since moved to +54, its own bisector,
 *               and light cannot follow: its only legal arc is 271.5–293, which is where −120
 *               already lands. See the note on the token.
 *   secondary   BREAKS — the complement of orange is blue, and blue is `info`. Moved to hue 190,
 *               the centre of the legal teal arc, 50° clear of both success and info.
 *   warning     BREAKS — hue 70 sits 10° from the page hue. Nothing between 105 and 115 was free
 *               for an amber, so warning is green-gold at 110.
 */
import { Color } from '$lib/color';
import type { SwatchName } from './palette.dark';

const at = (name: string, l: number, c: number, h: number, formula: string) =>
	new Color(`light_${name}`, l, c, h, formula);

/*
	The page anchor is the top of the dark system: `foreground.l + span * 2`, i.e. exactly where dark
	puts `cottontail`. Its chroma is the same 45.6% gamut fraction the dark seed sits at, so both
	grounds are equally saturated relative to what sRGB allows at their lightness.

	Hue 80 rather than the derived midpoint 86.47, which was too yellow.
*/
const LIGHT_L = 0.945;
const LIGHT_H = 80;
const LIGHT_C = 0.023;

/*
	The rail. `foreground` is solved to dark's OWN body ratio (6.92 → 7.04 here), so neither mode
	reads twice as stark as the other, and the brand rail then sits at that lightness — mirroring
	dark, where primary sits at `foreground.ok_l`.
*/
const RAIL_L = 0.425;

/*
	The ladder is ASYMMETRIC, unlike dark's ±span.

	Downward the reach is solved the same way dark's is — the darkest shade is the darkest ground on
	which the hardest rail colour still clears AA — and comes out at 0.12.

	Upward the binding limit is not contrast, it is the GAMUT. Up used to be `1 - light_bl`, which
	reaches for L 1.0 — a coordinate, not a colour. The sRGB chroma ceiling at L 1.0 is exactly zero,
	so the mapper stripped the whole page tint and the top rung fell out as #ffffff, the one value in
	the light half with no chroma at all. It read as a hole in the ladder rather than a rung of it,
	and the spacing said so: 1.26, 2.59, then 8.26 ΔE from the page. That last jump was a chroma
	CLIFF, not a lightness step.

	So up reaches the TINT ceiling instead — the lightest L at which the page chroma still fits in
	sRGB, 0.9744, giving 0.0294. All seven rungs are now OKLCH(L, LIGHT_C, LIGHT_H): one chroma, one
	hue, only lightness moving, and not one of them needs gamut mapping.

	The ceiling is a division, not a solve. Near white the sRGB boundary converges on a straight line
	into (L 1, C 0), so a single probe fixes its slope — in Chromatics,
	`OKLCH(0.99, 0.02, 80).maxChroma() / 0.01` — and the ceiling is `1 - light_c / slope`. Probes from
	0.96 to 0.995 land within 0.0004 of each other and produce the identical hex.

	The up side is quieter than it was, and that is correct rather than a loss: there is 0.0294 of
	lightness above the page before the tint leaves sRGB, against 0.120 below. The reach the old
	ladder appeared to have WAS the cliff. Do not compensate by pushing the top rung back toward white.
*/
const UP = 0.0294;
const DOWN = 0.12;

export const light = {
	background_lightest: at(
		'background_lightest',
		0.9744,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl + up, light_c, light_bh) — up reaches the tint ceiling, not L 1.0'
	),
	background_lighter: at(
		'background_lighter',
		0.9646,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl + up * 2/3, light_c, light_bh)'
	),
	background_light: at(
		'background_light',
		0.9548,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl + up / 3, light_c, light_bh)'
	),
	background: at(
		'background',
		LIGHT_L,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(foreground.ok_l + span * 2, maxChroma * k, 80) — the page. k is the seed’s gamut fraction'
	),
	background_dark: at(
		'background_dark',
		0.905,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl - light_span / 3, light_c, light_bh)'
	),
	background_darker: at(
		'background_darker',
		0.865,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl - light_span * 2/3, light_c, light_bh)'
	),
	background_darkest: at(
		'background_darkest',
		0.825,
		LIGHT_C,
		LIGHT_H,
		'OKLCH(light_bl - light_span, light_c, light_bh)'
	),

	foreground: at(
		'foreground',
		RAIL_L,
		0.0233,
		260,
		'ensureContrast(OKLCH(0.70, c, 260), light_background, 6.92) — solved to dark’s body ratio'
	),

	/*
		−120, where dark now uses +54 (its bisector) — and this is the one place light cannot follow.

		Light has the same defect as dark had, worse: ΔE 4.8 from `light_foreground`, close enough to
		body text that it barely reads as a colour. It is not fixable by hue. The scheme's hue law
		leaves light exactly ONE legal arc, 271.5–293, and the best point in it scores 5.3 against
		this 4.8 — half a ΔE for abandoning dark's offset. The binding constraint is chroma, not
		angle: `u × 1` is 0.0205 against `light_foreground`'s 0.0233 at the same lightness, so no hue
		puts meaningful distance between a rank-1 colour and the text. Moving it would mean breaking
		the integer chroma ranks, which is a bigger decision than this token.
	*/
	tertiary: at('tertiary', RAIL_L, 0.0205, 290.47, 'OKLCH(light_l, u * 1, primary − 120)'),
	secondary: at(
		'secondary',
		RAIL_L,
		0.0409,
		190,
		'OKLCH(light_l, u * 2, 190) — +180 lands on info, so the teal arc instead'
	),
	primary: at(
		'primary',
		RAIL_L,
		0.0614,
		50.47,
		'OKLCH(light_l, u * 3, light_ph) — light_ph 50.47, orange, at 55% of its ceiling'
	),
	accent: at('accent', RAIL_L, 0.0818, 338.47, 'OKLCH(light_l, u * 4, primary − 72)'),

	cottontail: at(
		'cottontail',
		0.545,
		0.1431,
		50.47,
		'OKLCH(light_foreground.ok_l + light_span, maxChroma(), light_ph) — pops by chroma, not lightness'
	),

	success: at('success', RAIL_L, 0.1228, 140, 'OKLCH(light_l, u * 6, 140)'),
	warning: at(
		'warning',
		0.4268,
		0.0928,
		109.3148,
		'OKLCH(light_l, u * 6, 110).gamutMap() — green-gold; 70 is 10° from the page hue'
	),
	error: at('error', RAIL_L, 0.1228, 30, 'OKLCH(light_l, u * 6, 30)'),
	info: at('info', 0.4329, 0.1119, 246.2376, 'OKLCH(light_l, u * 6, 240).gamutMap()')
} satisfies Record<SwatchName, Color>;

/**
 * Both reaches, exported so the page can state that this ladder is not symmetric — and that the two
 * limits are different KINDS of limit. `down` is a contrast solve, `up` is the sRGB tint ceiling.
 */
export const lightLadderSpan = { up: UP, down: DOWN };
