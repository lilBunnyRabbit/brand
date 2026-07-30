/** Business card. EDIT HERE. */
import type { SwatchName } from './palette';

export interface CardLine {
	label: string;
	value: string;
	placeholder?: boolean;
}

/** One printed colourway. Ink is the label rule: `background` on light grounds, `primary` on dark. */
export interface CardVariant {
	id: string;
	/** Printer's shorthand, as it appears down the side of a spec sheet. */
	code: string;
	label: string;
	/** A palette swatch, or a raw CSS colour for stock that is not in the palette (white). */
	ground: SwatchName | string;
	ink: SwatchName;
	/** Secondary text colour on this ground. */
	quiet: SwatchName;
}

export interface CardSpec {
	widthMm: number;
	heightMm: number;
	bleedMm: number;
	name: string;
	role: string;
	lines: CardLine[];
	variants: readonly CardVariant[];
}

export const card: CardSpec = {
	widthMm: 85,
	heightMm: 55,
	bleedMm: 3,
	name: 'Andraž',
	role: 'Your job here',
	lines: [
		{ label: 'email', value: 'hello@example.com', placeholder: true },
		{ label: 'phone', value: '+1 415 555 0128', placeholder: true },
		{ label: 'web', value: 'example.com', placeholder: true }
	],
	variants: [
		{
			id: 'stock',
			code: 'CW 1',
			label: 'Stock',
			ground: 'primary',
			ink: 'background',
			quiet: 'background_dark'
		},
		{
			id: 'brand',
			code: 'CW 2',
			label: 'Brand',
			ground: '#ffffff',
			ink: 'background',
			quiet: 'background_light'
		},
		{
			id: 'reverse',
			code: 'CW 3',
			label: 'Reverse',
			ground: 'background_darkest',
			ink: 'primary',
			quiet: 'foreground'
		}
	]
};
