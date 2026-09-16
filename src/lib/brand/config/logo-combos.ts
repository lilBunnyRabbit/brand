/**
 * The sanctioned logo colour combinations. EDIT HERE.
 *
 * Most of the time the logo is just the mark, one colour, straight onto whatever it sits on — no
 * disc, no ground of its own. The disc combos are for places that need a self-contained badge.
 *
 * Ratios are measured from the palette at render time, not written down here, so they cannot drift
 * from the colours.
 */
import type { SwatchName, ThemeName } from './palette';

/**
 * What a mark may be inked with: any palette key, or the fixed ears colour.
 *
 * `mark_ears` is dark's `cottontail` pinned, so in dark the two are one colour. In light it is what
 * keeps the pale ears pale on the orange disc — `light_cottontail` on `light_primary` reads 1.09,
 * and the badge would vanish.
 */
export type Ink = SwatchName | 'mark_ears';

export interface LogoCombo {
	id: string;
	label: string;
	/** `plain` = the bare mark on a surface. `disc` = the mark inside a filled circle. */
	kind: 'plain' | 'disc';
	/** What sits behind the mark. */
	ground: SwatchName;
	/** The mark itself. */
	ink: Ink;
	note: string;
	/** Logotypes are exempt from WCAG contrast (SC 1.4.3, 1.4.11); flags the ones relying on that. */
	exempt?: boolean;
}

export const logoCombos: readonly LogoCombo[] = [
	{
		id: 'bg-primary',
		label: 'background + primary',
		kind: 'plain',
		ground: 'background',
		ink: 'primary',
		note: 'The default. The bare mark in primary, on the page or any other shade.'
	},
	{
		id: 'primary-bg',
		label: 'primary + background',
		kind: 'disc',
		ground: 'primary',
		ink: 'background',
		note: 'Flipped into a filled badge: an avatar, an app icon, a favicon. It carries its own ground, so it goes anywhere.'
	},
	{
		id: 'primary-cottontail',
		label: 'primary + cottontail',
		kind: 'disc',
		ground: 'primary',
		ink: 'mark_ears',
		note: 'The bright one, for when the badge should catch the eye. The ears are the fixed asset colour, pale on either disc. Low contrast in dark on purpose: a logotype, never text.',
		exempt: true
	},
	/*
		The neutral pair. No brand colour in it at all, which is the point: this is the one that goes on
		a fax, an embroidery file, a single-colour print, or anywhere the brand colour cannot be trusted.
		It was missing from the guide even though the navigation bar has always used it.
	*/
	{
		id: 'fg-bg',
		label: 'foreground + background',
		kind: 'disc',
		ground: 'foreground',
		ink: 'background',
		note: 'The one-colour fallback. Same two colours as body text, so it needs nothing the page does not already have.'
	},
	{
		id: 'bg-fg',
		label: 'background + foreground',
		kind: 'disc',
		ground: 'background',
		ink: 'foreground',
		note: 'The same pair the other way round. On the page itself the disc IS the page, so only the ears show. A knockout, not a badge.'
	}
];

/**
 * Inks for the bare mark in specific places. Not combos — just which single colour to reach for.
 */
export const plainInks: readonly { id: string; ink: SwatchName; note: string }[] = [
	{ id: 'chrome', ink: 'foreground', note: 'In navigation and other chrome, beside the wordmark.' },
	{ id: 'brand', ink: 'primary', note: 'Anywhere the mark should read as the brand.' },
	{
		id: 'light',
		ink: 'background',
		note: 'On a light or white ground, where primary would vanish.'
	}
];

/* ── the four disc variants, across both modes ──────────────────────────── */

export interface MarkVariant {
	id: string;
	label: string;
	theme: ThemeName;
	/** The disc fill. */
	disc: SwatchName;
	/** The ears. `null` means the fixed asset colour, which does not theme. */
	ears: SwatchName | null;
	note: string;
}

/**
 * The mark, in every combination worth shipping: brand and neutral, dark and light.
 *
 * `ears: null` is `mark_ears` — pinned, identical in both modes. Only the disc themes, and that is
 * the whole reason the light brand mark works: keeping the pale ears fixed gives 6.06 on the light
 * disc, where deriving them from `light_primary` the way dark derives its own would give 1.09 and
 * disappear entirely in greyscale.
 *
 * Worth saying out loud: the LIGHT brand mark needs no exemption. Dark's 1.96 survives on the
 * logotype allowance; light's 6.06 clears AA on its own.
 */
export const markVariants: readonly MarkVariant[] = [
	{
		id: 'dark-brand',
		label: 'Dark, brand',
		theme: 'dark',
		disc: 'primary',
		ears: null,
		note: 'The one people will recognise. This is the mark.'
	},
	{
		id: 'dark-neutral',
		label: 'Dark, neutral',
		theme: 'dark',
		disc: 'foreground',
		ears: 'background',
		note: 'No brand colour. For one-colour printing and anywhere the green cannot be trusted.'
	},
	{
		id: 'light-brand',
		label: 'Light, brand',
		theme: 'light',
		disc: 'primary',
		ears: null,
		note: 'Same ears, orange disc. Clears AA on its own, where the dark badge lives on the logotype exemption. Still not the one to use for recognition.'
	},
	{
		id: 'light-neutral',
		label: 'Light, neutral',
		theme: 'light',
		disc: 'foreground',
		ears: 'background',
		note: 'The neutral pair on paper. Same job as its dark twin.'
	}
];
