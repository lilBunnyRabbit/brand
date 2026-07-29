/**
 * Business card content. EDIT HERE.
 *
 * Placeholders are marked as such on the page rather than dressed up as real details, so nobody
 * sends the artwork to a printer thinking it is finished.
 */
export interface CardLine {
	label: string;
	value: string;
	/** Shown struck through as a placeholder until it is real. */
	placeholder?: boolean;
}

export interface CardSpec {
	/** Printed size. 85 × 55 mm is the ISO/European standard; the US equivalent is 89 × 51. */
	widthMm: number;
	heightMm: number;
	/** Trim allowance to add on every edge when exporting for print. */
	bleedMm: number;
	role: string;
	lines: CardLine[];
	/** Front and back grounds, by swatch name. Both must be shades. */
	frontShade: string;
	backShade: string;
}

export const card: CardSpec = {
	widthMm: 85,
	heightMm: 55,
	bleedMm: 3,
	role: 'Your job here',
	lines: [
		{ label: 'Email', value: 'hello@example.com', placeholder: true },
		{ label: 'Web', value: 'example.com', placeholder: true },
		{ label: 'GitHub', value: 'lilBunnyRabbit' }
	],
	frontShade: 'bg_light',
	backShade: 'bg_darkest'
};
