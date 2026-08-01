/**
 * Brand Dark v4 — the primary palette. TRANSCRIBED, not derived. EDIT HERE.
 *
 * Every number below is pasted verbatim from the Chromatics scheme's OKLCH export
 * (`~/dev/org/lilbunnyrabbit/chromatics`). ALL solving and derivation lives there — the seed, the
 * ladder span, the chroma ranks, the gamut work. This file is data: 17 literals, plus each colour's
 * recipe carried as its description string so the swatch cards can state the formula without this
 * codebase ever running it. `palette.light.ts` is the twin set, authored the same way.
 *
 * The rounded OKLCH values reproduce the Chromatics hex export byte-for-byte (verified with culori
 * at transcription time), and the rounding preserves the exact chroma ranks: 0.0466 = 2 × 0.0233,
 * 0.0699 = 3×, 0.0932 = 4×, 0.1398 = 6×.
 *
 * Structure:
 *   7 surface shades    the elevation ladder
 *   1 foreground        all body copy
 *   4 brand             hue is identity, chroma is rank (1c–4c; 5c empty on purpose)
 *   1 identity          cottontail — the badge ink, only ever on primary
 *   4 states            fixed cultural hues at 6c
 *
 * THE CONTRACT: every one of the 9 rail colours clears WCAG AA (4.5:1) against every one of the 7
 * shades — 63 pairs, worst case 4.59. Solved and verified in Chromatics; the page measures it live
 * with `measureContract` for display, not for proof.
 *
 * To retune the theme: change it in Chromatics, re-export, paste the new numbers here. Hand-tweaks
 * are also fine — this is the only file that has to change.
 */
import { Color } from '$lib/color';

const at = (name: string, l: number, c: number, h: number, formula: string) =>
	new Color(name, l, c, h, formula);

/**
 * The ladder's half-reach in lightness, solved in Chromatics:
 * `ensureContrast(background.atLightness(0.50), error, 4.55).ok_l - bl` → 0.100.
 * Kept as data because the page states it.
 */
const span = 0.1;

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
		0.355,
		0.0324,
		230.47,
		'OKLCH(bl + span, c * (bl + span) / bl, bh)'
	),
	background_lighter: at(
		'background_lighter',
		0.3217,
		0.0294,
		230.47,
		'OKLCH(bl + span * 2/3, c * (bl + span * 2/3) / bl, bh)'
	),
	background_light: at(
		'background_light',
		0.2883,
		0.0263,
		230.47,
		'OKLCH(bl + span / 3, c * (bl + span / 3) / bl, bh)'
	),
	background: at(
		'background',
		0.255,
		0.0233,
		230.47,
		'OKLCH(0.255, 0.0233, 230.47) — the seed'
	),
	background_dark: at(
		'background_dark',
		0.2217,
		0.0203,
		230.47,
		'OKLCH(bl - span / 3, c * (bl - span / 3) / bl, bh)'
	),
	background_darker: at(
		'background_darker',
		0.1883,
		0.0172,
		230.47,
		'OKLCH(bl - span * 2/3, c * (bl - span * 2/3) / bl, bh)'
	),
	background_darkest: at(
		'background_darkest',
		0.155,
		0.0142,
		230.47,
		'OKLCH(bl - span, c * (bl - span) / bl, bh)'
	),

	foreground: at('foreground', 0.745, 0.0078, 50.47, 'OKLCH(1 - bl, c / 3, (bh + 180) % 360)'),

	tertiary: at('tertiary', 0.745, 0.0233, 2.47, 'primary.shift({ h: -120 }).atChroma(c * 1)'),
	secondary: at('secondary', 0.745, 0.0466, 302.47, 'primary.complement().atChroma(c * 2)'),
	primary: at(
		'primary',
		0.745,
		0.0699,
		122.47,
		'OKLCH(foreground.ok_l, c * 3, (foreground.ok_h + 72) % 360)'
	),
	accent: at(
		'accent',
		0.745,
		0.0932,
		50.47,
		'primary.derive({ h: foreground.ok_h }).atChroma(c * 4)'
	),

	cottontail: at(
		'cottontail',
		0.945,
		0.1033,
		122.47,
		'primary.atLightness(lift).atChroma(maxChroma() * 0.60)'
	),

	success: at('success', 0.745, 0.1398, 140, 'OKLCH(foreground.ok_l, c * 6, 140)'),
	warning: at('warning', 0.745, 0.1398, 70, 'OKLCH(foreground.ok_l, c * 6, 70)'),
	error: at('error', 0.745, 0.1398, 30, 'OKLCH(foreground.ok_l, c * 6, 30)'),
	info: at('info', 0.745, 0.1398, 240, 'OKLCH(foreground.ok_l, c * 6, 240)')
} as const;

export type SwatchName = keyof typeof dark;

/** The span, exported so the page, the light twin and the exports can state it. */
export const ladderSpan = span;
