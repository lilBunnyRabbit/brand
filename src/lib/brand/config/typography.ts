/**
 * The two faces and the size ladder. EDIT HERE.
 *
 * Both are self-hosted in `styles/fonts.css`. That matters more here than on most sites: this page's
 * whole subject is things looking the same everywhere, and for months both families were names in a
 * stack with nothing loading them, so the page rendered in a different typeface per machine.
 *
 * The sizes below are the real `--text-*` custom properties from `app.css`, listed rather than
 * duplicated: the specimen reads them off the page, so a change to the scale moves this section too.
 * Nothing here can claim a size the stylesheet does not have.
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
		source: 'rsms/inter v4.1, the variable file',
		licence: 'SIL Open Font License 1.1'
	},
	{
		id: 'mono',
		name: 'Hack',
		cssVar: '--font-mono',
		role: 'Every value: hexes, formulas, ratios, token names. And the wordmark.',
		weights: [400, 700],
		source: 'source-foundry/Hack v3.003',
		licence: 'MIT, plus Bitstream Vera for the inherited DejaVu work'
	}
];

export interface TypeStep {
	/** The custom property, without the `--text-` prefix. */
	id: string;
	/** The declared value, so the page states what the stylesheet says rather than a measurement. */
	value: string;
	use: string;
}

/**
 * The ladder, in the order it is declared.
 *
 * `text(15, 1.25)` from the scheme, on a 16px root rather than 15: a 15px root put `xs` at 9.6px, and
 * this page is mostly captions and metadata.
 */
export const typeScale: readonly TypeStep[] = [
	{ id: 'xs', value: '0.75rem', use: 'Notation buttons, counts, eyebrow labels.' },
	{ id: 'sm', value: '0.875rem', use: 'Captions, metadata, every mono value.' },
	{ id: 'base', value: '1rem', use: 'Body.' },
	{ id: 'lg', value: '1.1875rem', use: 'Section ledes, the job labels on the cottontail panel.' },
	{ id: 'xl', value: '1.5rem', use: 'Panel headings.' },
	{ id: '2xl', value: '1.875rem', use: 'The seed value.' },
	{ id: 'display', value: 'clamp(1.875rem, 8vw, 4.75rem)', use: 'Section titles.' },
	{ id: 'hero', value: 'clamp(2.375rem, 11vw, 6.5rem)', use: 'The tagline. Once per page.' }
];
