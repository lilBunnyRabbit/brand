/**
 * The wrong versions, and how to draw each one. EDIT HERE.
 *
 * Every entry is a CSS declaration applied to the REAL mark. No hand-made "wrong" asset exists in this
 * repo and none should: a broken copy of the logo is a file that has to be re-broken by hand every time
 * the mark changes, and the day it is not, the guide is showing a rule against a logo nobody uses.
 * Generated from the live SVG, these stay true for free.
 *
 * `css` goes straight into a `style` attribute on the mark's wrapper, so it must be a valid declaration
 * list — and it must be one that works on an SVG. `transform` and `filter` do. Text-only tricks like
 * `background-clip: text` and `-webkit-text-stroke` do not, so the two obvious misuses they would have
 * drawn (a gradient fill and an outlined version) are not in this list. Neither is faked with a picture.
 */
export interface Misuse {
	id: string;
	/** What was done to it. */
	label: string;
	/** Why it is not allowed. One line, no hedging. */
	why: string;
	/** Applied to the mark. Valid CSS declarations. */
	css: string;
}

export const misuses: readonly Misuse[] = [
	{
		id: 'stretch',
		label: 'Stretched',
		why: 'The ear strokes are one weight. Scaling one axis makes them two.',
		css: 'transform: scaleX(1.45);'
	},
	{
		id: 'squash',
		label: 'Squashed',
		why: 'Same fault the other way. Set width and height together or set neither.',
		css: 'transform: scaleY(0.62);'
	},
	{
		id: 'rotate',
		label: 'Rotated',
		why: 'It is a nose. It reads as one at 0°.',
		css: 'transform: rotate(-14deg);'
	},
	{
		id: 'recolour',
		label: 'Off-palette colour',
		why: 'The ink is one of the seventeen. Hue-shifting it invents an eighteenth.',
		css: 'filter: hue-rotate(150deg) saturate(2.4);'
	},
	{
		id: 'shadow',
		label: 'Drop shadow',
		why: 'It sits on the surface, not above it. Nothing here has depth.',
		css: 'filter: drop-shadow(0 6px 5px rgb(0 0 0 / 0.75));'
	},
	{
		id: 'faded',
		label: 'Faded out',
		why: 'Below full strength it stops being the logo and becomes decoration.',
		css: 'opacity: 0.28;'
	},
	{
		id: 'washed',
		label: 'Washed out',
		why: 'Greyed and low contrast. There is a one-colour fallback for this, and it is not this.',
		css: 'filter: grayscale(1) contrast(0.4);'
	},
	{
		id: 'blurred',
		label: 'Blurred',
		why: 'What a raster copy looks like scaled up. The SVG is the asset.',
		css: 'filter: blur(1.1px);'
	}
];
