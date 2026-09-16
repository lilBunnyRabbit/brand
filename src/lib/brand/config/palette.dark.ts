/**
 * Brand Dark v4 — the primary palette. TRANSCRIBED, not derived. EDIT HERE.
 *
 * Every number below is pasted from the Chromatics scheme's OKLCH export
 * (`~/dev/orgs/lilbunnyrabbit/chromatics`; the vault's Brand Dark Theme Spec carries the source).
 * ALL solving and derivation lives there — the seed, the ladder reach, the chroma ranks, the gamut
 * work. This file is data: 17 literals, plus each colour's recipe carried as its description string
 * so the swatch cards can state the formula without this codebase ever running it.
 * `palette.light.ts` is the twin set, authored the same way.
 *
 * The rounded OKLCH values reproduce the Chromatics hex export byte-for-byte (verified with culori
 * at transcription time), and the rounding preserves the exact chroma ranks: 0.0466 = 2 × 0.0233,
 * 0.0699 = 3×, 0.0932 = 4×, 0.1398 = 6×.
 *
 * Structure:
 *   7 surface shades    the elevation ladder, ±span around the seed
 *   1 foreground        all body copy
 *   4 brand             hue is identity, chroma is rank (1c–4c; 5c empty on purpose)
 *   1 identity          cottontail — the badge ink, only ever on primary
 *   4 states            fixed cultural hues at 6c
 *
 * THE CONTRACT: every one of the 9 rail colours clears WCAG AA (4.5:1) against every one of the 7
 * shades — 63 pairs, worst case 4.54 on the shipped hexes. Dark meets the whole of it because every
 * rail colour sits at the text's lightness and the ladder is solved against the dimmest of them.
 * Paper cannot, and splits it by role — see `palette.light.ts`. The page measures it live with
 * `measureContract` for display, not for proof.
 *
 * To retune the theme: change it in Chromatics, re-export, paste the new numbers here. Hand-tweaks
 * are also fine — this is the only file that has to change.
 */
import { Color } from '$lib/color';

const at = (name: string, l: number, c: number, h: number, formula: string) =>
	new Color(name, l, c, h, formula);

/**
 * The ladder's reach in lightness, SOLVED in Chromatics rather than searched for.
 *
 * WCAG contrast is a ratio of relative luminances, so a contrast target inverts into a luminance
 * target with one division, and xyY's Y is that luminance. The lightest shade is the seed lifted to
 * exactly the luminance at which the dimmest rail colour (`error`, as it happens — asked for, not
 * assumed) still reads 4.55: AA, plus the 0.05 that the rungs' own chroma and the 8-bit rounding
 * cost between the solve and the screen.
 *
 *     span = background.xyy.setLuminance((dimmest + 0.05) / 4.55 - 0.05).ok_l - background.l
 *
 * Kept as data because the page states it. Chroma moves in proportion to lightness down the
 * ladder (`span_c = c * span / bl`), which below the gamut cusp is the same as holding a fixed
 * fraction of the sRGB boundary: lighter shades gain colour, darker ones lose it, nothing leaves
 * the gamut.
 */
const span = 0.102;

/**
 * Flat, so every key is a string literal type and a group or role naming a swatch that does not
 * exist is a `svelte-check` error rather than a runtime surprise. This object is the source of
 * `SwatchName`; the light twin must satisfy the same keys exactly.
 *
 * Order is the elevation ladder first, lightest to darkest, then content, brand, identity, states.
 */
export const dark = {
	background_lightest: at(
		'background_lightest',
		0.357,
		0.0326,
		230.47,
		'background.shift({ l: span, c: span_c })'
	),
	background_lighter: at(
		'background_lighter',
		0.323,
		0.0295,
		230.47,
		'background.shift({ l: span * 2/3, c: span_c * 2/3 })'
	),
	background_light: at(
		'background_light',
		0.289,
		0.0264,
		230.47,
		'background.shift({ l: span / 3, c: span_c / 3 })'
	),
	background: at('background', 0.255, 0.0233, 230.47, 'OKLCH(0.255, 0.0233, 230.47) — the seed'),
	background_dark: at(
		'background_dark',
		0.221,
		0.0202,
		230.47,
		'background.shift({ l: -span / 3, c: -span_c / 3 })'
	),
	background_darker: at(
		'background_darker',
		0.187,
		0.0171,
		230.47,
		'background.shift({ l: -span * 2/3, c: -span_c * 2/3 })'
	),
	background_darkest: at(
		'background_darkest',
		0.153,
		0.014,
		230.47,
		'background.shift({ l: -span, c: -span_c })'
	),

	foreground: at('foreground', 0.745, 0.0078, 50.47, 'OKLCH(1 - bl, c / 3, (bh + 180) % 360)'),

	/*
		THE BISECTOR OF PRIMARY AND THE GROUND, and it is derived rather than picked.

		At −120 this was a dusty rose 28° from `error` — the only brand colour parked in a semantic
		hue's neighbourhood — and ΔE 7.2 from `foreground` where `secondary` is 14.7. Rank 1 fell off
		the chroma ladder into body-text territory instead of tapering into it: too close to the text
		to read as a colour, too warm on a blue-grey page not to catch the eye.

		The scheme's hue law (≥45° off the neutral and off every other brand hue) leaves dark exactly
		two arcs: 167.5–185 and 347.5–5.5. −120 took the second. The first is wider and empty, and its
		two edges are set by the two 45° constraints — the neutral at 230.47 above, primary at 122.47
		below — so the point furthest from both is their midpoint, (122.47 + 230.47) / 2 = 176.47.
		Hence `primary + 54`.

		ΔE from the nearest rail 7.2 → 12.0. A teal at 194 scores a hair better but sits 36° off the
		neutral, which is the rule's own definition of reading as a lit shade of the page — measured,
		that colour is ΔE 5.7 from the page hue raised to this lightness, against 7.9 here.

		Light does not take this midpoint: on a warm page the arc between primary and the ground is
		spoken for, so its tertiary is the midpoint of the text and accent hues instead. See the note
		there.
	*/
	tertiary: at(
		'tertiary',
		0.745,
		0.0233,
		176.47,
		'OKLCH(foreground.l, c * 1, (primary.h + bh) / 2) — the midpoint of the legal arc'
	),
	secondary: at(
		'secondary',
		0.745,
		0.0466,
		302.47,
		'OKLCH(foreground.l, c * 2, (primary.h + 180) % 360)'
	),
	primary: at(
		'primary',
		0.745,
		0.0699,
		122.47,
		'OKLCH(foreground.l, c * 3, (foreground.h + 72) % 360)'
	),
	accent: at('accent', 0.745, 0.0932, 50.47, 'OKLCH(foreground.l, c * 4, foreground.h)'),

	/*
		Two spans above the text, or the ears stop reading on the disc. Chroma at 60% of the sRGB
		ceiling: contrast on the page is flat from 60% to 92% of it (13.7–13.8), so the fraction is
		a look decision and 60% keeps headroom if the seed moves. Its 1.96 against primary is a
		logotype allowance and nothing more.
	*/
	cottontail: at(
		'cottontail',
		0.949,
		0.0939,
		122.47,
		'primary.atLightness(top).atChroma(maxChroma(top, primary.h) * 0.60) — top = foreground.l + span * 2'
	),

	success: at('success', 0.745, 0.1398, 140, 'OKLCH(foreground.l, c * 6, 140)'),
	warning: at('warning', 0.745, 0.1398, 70, 'OKLCH(foreground.l, c * 6, 70)'),
	error: at('error', 0.745, 0.1398, 30, 'OKLCH(foreground.l, c * 6, 30)'),
	info: at('info', 0.745, 0.1398, 240, 'OKLCH(foreground.l, c * 6, 240)')
} as const;

export type SwatchName = keyof typeof dark;

/** The reach, exported so the page, the light twin and the exports can state it. */
export const ladderSpan = span;
