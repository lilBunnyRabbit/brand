/**
 * Brand Light — the twin set, for product UI only. TRANSCRIBED, not derived. EDIT HERE.
 *
 * Every dark token has a counterpart here under the SAME key, doing the same job in the same
 * position. Nothing rebinds: switching modes is a scope change, not a remapping. In the scheme's own
 * vocabulary these are the `light_*` tokens, which is what each `Color` carries as its name.
 *
 * It is not an identity palette. Dark is the brand; this exists so a product surface can render
 * light. `config/prohibitions.ts` states the rule.
 *
 * ── WHY THESE ARE LITERALS ──
 *
 * Nothing in the light half is chosen — every value is a relationship to the dark seed or a solve
 * against the contract — but the solving lives in Chromatics, not here. Three of its operations are
 * not vendored: `xyy.setLuminance`, which lands a colour on an exact WCAG luminance and sizes the
 * text, the brand and the ladder; `maxChroma` at every rung, which is what keeps the ladder inside
 * sRGB all the way up to white; and `gamutMap`, which three of the states need. Reimplementing them
 * would make every number the page states a guess, so the resolved values are transcribed and the
 * recipe is recorded per colour as its description — the same call as `ladderSpan` in the dark file.
 *
 * ── THE PAGE ──
 *
 * The page is the top of the dark system: L 0.949 = `foreground.l + span * 2`, where dark puts
 * `cottontail`. Its hue is the midpoint of the two hues dark is built around, the text's (also
 * accent's) and primary's — 86.47 — and its chroma is the same 45.6% gamut fraction (`tint`) the
 * dark seed sits at. The text sits on the page's complement at exactly the luminance an 8:1 body
 * ratio demands, darker than dark's inherited 6.92 on purpose: on paper the text alone sizes the
 * ladder, so its body ratio is also the depth.
 *
 * ── THE CONTRACT SPLITS ──
 *
 * At L 0.40 the sRGB gamut is about half as wide as at dark's 0.745: brand colours at the text's
 * lightness came out brown, grey or olive. So on paper the contract splits by role. The text clears
 * AA on every shade; brand and states clear AA on the page and the surface (`background_dark`) and
 * WCAG's 3:1 non-text floor on every rung below; and the brand sits at its own solved lightness,
 * 0.474, a step above the text — where its loudest colour (a rank-6 green) still reads 4.55 on the
 * surface. The page measures all three parts live.
 *
 * ── THE LADDER ──
 *
 * Every rung holds `tint` of the chroma sRGB allows AT ITS OWN LIGHTNESS, so the chroma is a
 * different literal on every rung. Two reaches, neither chosen. Up, the limit is a wall: white,
 * where the available chroma is zero, so the top rung comes out `#ffffff` on its own — the one value
 * in either palette with no chroma, and a rung of the ladder rather than a hole in it. Down, the
 * limit is the contract: the ladder descends until the text reads 4.55, the mirror of dark's `span`.
 * Steps of 3.2 · 2.9 · 2.7 ΔE above the page and 8.3 · 6.1 · 4.9 below — the page sits near white,
 * so the only depth a light ladder can have is below it.
 *
 * ── THE PART THAT IS NOT A SWAP ──
 *
 * The light primary is ORANGE, not green. Carry the page hue down the ladder to the brand's
 * lightness — the page's own darkened form — and measure each candidate against it: a green on
 * dark's hue sits 12.8 ΔE from it, close enough to read as a shade of the paper rather than a colour
 * on it; the orange 14.2. Orange is also the seed's complement, `foreground.h`, the angle dark's own
 * accent sits on. Not one hue here is a literal: accent keeps dark's 72° from primary on the other
 * side, and the rest are midpoints. `hueMoves` in `light-story.ts` states which of dark's four
 * relationships survived the move.
 */
import { Color } from '$lib/color';
import type { SwatchName } from './palette.dark';

const at = (name: string, l: number, c: number, h: number, formula: string) =>
	new Color(`light_${name}`, l, c, h, formula);

/* The page: the top of the dark system, on the midpoint hue, at the seed's gamut fraction. */
const TOP = 0.949;
const LIGHT_H = 86.47;
const PAGE_C = 0.0259;

/* The brand lightness, solved against the surface. Every brand and state colour shares it. */
const BRAND_L = 0.4743;

/* Both reaches: up to white, down to where the text still reads 4.55. */
const UP = 0.051;
const DOWN = 0.1748;

export const light = {
	background_lightest: at(
		'background_lightest',
		1,
		0,
		LIGHT_H,
		'OKLCH(top + up, maxChroma * tint, light_bh) — white: at L 1 there is no chroma to hold'
	),
	background_lighter: at(
		'background_lighter',
		0.983,
		0.0086,
		LIGHT_H,
		'OKLCH(top + up * 2/3, maxChroma * tint, light_bh)'
	),
	background_light: at(
		'background_light',
		0.966,
		0.0172,
		LIGHT_H,
		'OKLCH(top + up / 3, maxChroma * tint, light_bh)'
	),
	background: at(
		'background',
		TOP,
		PAGE_C,
		LIGHT_H,
		'OKLCH(foreground.l + span * 2, maxChroma * tint, (foreground.h + primary.h) / 2) — the page'
	),
	background_dark: at(
		'background_dark',
		0.8907,
		0.0566,
		LIGHT_H,
		'OKLCH(top - light_span / 3, maxChroma * tint, light_bh) — the surface'
	),
	background_darker: at(
		'background_darker',
		0.8325,
		0.0777,
		LIGHT_H,
		'OKLCH(top - light_span * 2/3, maxChroma * tint, light_bh)'
	),
	background_darkest: at(
		'background_darkest',
		0.7742,
		0.0723,
		LIGHT_H,
		'OKLCH(top - light_span, maxChroma * tint, light_bh)'
	),

	foreground: at(
		'foreground',
		0.3982,
		0.0233,
		266.47,
		'OKLCH(page.complement().xyy.setLuminance((page.Y + 0.05) / 8 - 0.05).ok_l, c, light_bh + 180) — an 8:1 body'
	),

	/*
		Rank 1 on the midpoint of the text and accent hues — 36° from each, dark's "furthest from both
		walls" rule in the one arc a warm page leaves open. 9.5 ΔE from the text. At the text's own
		lightness it read 3.7 whatever the hue, which is what pushed the whole brand rail up to its own
		solved lightness.
	*/
	tertiary: at(
		'tertiary',
		BRAND_L,
		0.0259,
		302.47,
		'OKLCH(light_bl, u * 1, (light_foreground.h + light_accent.h) / 2)'
	),
	secondary: at(
		'secondary',
		BRAND_L,
		0.0519,
		190,
		'OKLCH(light_bl, u * 2, (h_success + h_info) / 2) — +180 lands on info, so the teal arc instead'
	),
	primary: at(
		'primary',
		BRAND_L,
		0.0778,
		50.47,
		'OKLCH(light_bl, u * 3, foreground.h) — the seed’s complement: orange'
	),
	accent: at('accent', BRAND_L, 0.1037, 338.47, 'OKLCH(light_bl, u * 4, foreground.h − 72)'),

	/*
		Pops by CHROMA, not lightness: on paper the "brighter than everything" route lands beside the
		text. Two up-strides above the text at the full sRGB ceiling — boxed between the brand rail
		0.03 below it and the darkest rung's 3:1 floor just above, so it is primary's louder twin
		(same hue, 9.9 ΔE) rather than a colour of its own.
	*/
	cottontail: at(
		'cottontail',
		0.5002,
		0.1314,
		50.47,
		'light_primary.atLightness(light_foreground.l + up * 2).atChroma(maxChroma()) — pops by chroma, not lightness'
	),

	success: at('success', 0.4745, 0.1538, 140.32, 'OKLCH(light_bl, u * 6, 140).gamutMap()'),
	warning: at(
		'warning',
		0.4761,
		0.1064,
		113.24,
		'OKLCH(light_bl, u * 6, (light_bh + h_success) / 2).gamutMap() — green-gold; 70 sits 16° from the page hue'
	),
	error: at('error', BRAND_L, 0.1556, 30, 'OKLCH(light_bl, u * 6, 30)'),
	info: at('info', 0.4829, 0.1244, 246.07, 'OKLCH(light_bl, u * 6, 240).gamutMap()')
} satisfies Record<SwatchName, Color>;

/**
 * Both reaches, exported so the page can state that this ladder is not symmetric — and that the two
 * limits are different KINDS of limit. `down` is a contrast solve; `up` is the wall at white.
 */
export const lightLadderSpan = { up: UP, down: DOWN };
