/**
 * The sanctioned logo colour combinations. EDIT HERE.
 *
 * Most of the time the logo is just the mark, one colour, straight onto whatever it sits on — no
 * disc, no ground of its own. The two disc combos are for places that need a self-contained badge.
 *
 * Ratios are measured from the palette at render time, not written down here, so they cannot drift
 * from the colours.
 */
import type { SwatchName } from './palette';

export interface LogoCombo {
	id: string;
	label: string;
	/** `plain` = the bare mark on a surface. `disc` = the mark inside a filled circle. */
	kind: 'plain' | 'disc';
	/** What sits behind the mark. */
	ground: SwatchName;
	/** The mark itself. */
	ink: SwatchName;
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
		note: 'Flipped, as a filled badge — an avatar, an app icon, a favicon. Carries its own ground, so it works anywhere.'
	},
	{
		id: 'primary-cottontail',
		label: 'primary + cottontail',
		kind: 'disc',
		ground: 'primary',
		ink: 'cottontail',
		note: 'The bright one, for when the badge should catch the eye. Lower contrast by design — fine for a logotype, never for text.',
		exempt: true
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
