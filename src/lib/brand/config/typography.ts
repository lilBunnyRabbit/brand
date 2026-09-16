/**
 * The two faces. EDIT HERE.
 *
 * Both are self-hosted in `styles/fonts.css`. That matters more here than on most sites: this page's
 * whole subject is things looking the same everywhere, and for months both families were names in a
 * stack with nothing loading them, so the page rendered in a different typeface per machine.
 *
 * No size ladder. `--text-*` exists in `app.css` because this page needs sizes to be built, but the
 * steps are not a brand decision — publishing them as one invited anyone reading to treat an
 * internal implementation detail as a rule. The stylesheet is the only place they are stated.
 */

export interface TypeFace {
	id: string;
	/** What to call it. */
	name: string;
	/** The CSS custom property that selects it. */
	cssVar: string;
	/** What it is for, in one line. */
	role: string;
	/** Weights the page actually uses. A weight not listed here is a weight nobody asked for. */
	weights: readonly number[];
	/** Two lines set in the face: one at display weight, one at reading size. */
	specimen: readonly [string, string];
	/** Where it came from, and under what licence. */
	source: string;
	licence: string;
}

export const faces: readonly TypeFace[] = [
	{
		id: 'sans',
		name: 'Inter',
		cssVar: '--font-sans',
		role: 'Everything you read. Headings, body, labels.',
		weights: [400, 500, 600, 700, 800],
		specimen: [
			'Dark is the brand.',
			'Light is what you reach for when a product surface needs it.'
		],
		source: 'rsms/inter v4.1, the variable file',
		licence: 'SIL Open Font License 1.1'
	},
	{
		id: 'mono',
		name: 'Hack',
		cssVar: '--font-mono',
		role: 'Every value: hexes, formulas, ratios, token names. And the wordmark.',
		weights: [400, 700],
		specimen: ['lilBunnyRabbit', '1 − L · C ÷ 3 · H + 180°'],
		source: 'source-foundry/Hack v3.003',
		licence: 'MIT, plus Bitstream Vera for the inherited DejaVu work'
	}
];
