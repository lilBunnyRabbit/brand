/**
 * The mark beside the name — every arrangement worth looking at. EDIT HERE.
 *
 * There is no wordmark asset. The name is set live in Hack, the same face every value on this page is
 * set in, so a lockup is a layout decision rather than a drawing: nothing here needs exporting before
 * it can be judged, and deleting a row deletes the option.
 *
 * The name is camelCase, which is the whole reason there is more than one candidate. `lilBunnyRabbit`
 * has two humps, so the choices are what to do with them: leave the case to carry the rhythm, drop to
 * one case and let tracking do it, or split the parts by tone. `parts` exists for that — the name is
 * always the same string, only its segmentation and tone change.
 *
 * Nothing is marked as the answer. That is deliberate: these are candidates for a decision that has
 * not been made, and a page that quietly crowns one is a page that makes the decision for you.
 */

/** One segment of the name. Splitting it is how a camel hump gets a different tone or weight. */
export interface WordmarkPart {
	text: string;
	/**
	 * `ink` — the page's own foreground.
	 * `quiet` — foreground at the muted alpha, for a part that should recede.
	 * `brand` — primary. Legal on every shade; it is in the contract.
	 */
	tone: 'ink' | 'quiet' | 'brand';
	/** Start a new line before this part. */
	newline?: boolean;
}

export interface WordmarkLockup {
	id: string;
	label: string;
	/** What this arrangement is for, or what it costs. One line. */
	note: string;
	/** Where the name sits relative to the mark. */
	layout: 'row' | 'row-reverse' | 'stack';
	/** Cross-axis alignment. `baseline` only means anything on a single-line row. */
	align: 'center' | 'start' | 'baseline';
	/** Name size as a multiple of the mark's width, so a lockup scales as one object. */
	scale: number;
	tracking: string;
	weight: 400 | 700;
	transform?: 'uppercase' | 'lowercase';
	/** Line height, for the arrangements that break the name over lines. */
	leading?: number;
	parts: readonly WordmarkPart[];
}

/* The name, split at its two humps. Reused rather than retyped so no row can misspell it. */
const LIL = { text: 'lil', tone: 'ink' } as const;
const BUNNY = { text: 'Bunny', tone: 'ink' } as const;
const RABBIT = { text: 'Rabbit', tone: 'ink' } as const;
const WHOLE = [LIL, BUNNY, RABBIT] as const;

export const wordmarks: readonly WordmarkLockup[] = [
	{
		id: 'row-camel',
		label: 'Horizontal',
		note: 'Mark, gap, name. The default. Holds up in a README or a browser tab.',
		layout: 'row',
		align: 'center',
		scale: 0.42,
		tracking: '-0.02em',
		weight: 700,
		parts: WHOLE
	},
	{
		id: 'row-split',
		label: 'Quiet prefix',
		note: '`lil` steps back so the two humps read as one word instead of three.',
		layout: 'row',
		align: 'center',
		scale: 0.42,
		tracking: '-0.02em',
		weight: 700,
		parts: [{ ...LIL, tone: 'quiet' }, BUNNY, RABBIT]
	},
	{
		id: 'row-brand',
		label: 'Brand hump',
		note: 'One segment in primary. Loud, and it fixes the lockup to a colour the mark does not need.',
		layout: 'row',
		align: 'center',
		scale: 0.42,
		tracking: '-0.02em',
		weight: 700,
		parts: [{ ...LIL, tone: 'quiet' }, { ...BUNNY, tone: 'brand' }, RABBIT]
	},
	{
		id: 'row-light',
		label: 'Regular weight',
		note: 'The same arrangement at 400. Quieter. Good in a footer.',
		layout: 'row',
		align: 'center',
		scale: 0.42,
		tracking: '0',
		weight: 400,
		parts: WHOLE
	},
	{
		id: 'row-lower',
		label: 'All lowercase',
		note: 'Loses the humps, so tracking has to carry the rhythm. Reads like a handle.',
		layout: 'row',
		align: 'center',
		scale: 0.42,
		tracking: '0.04em',
		weight: 400,
		transform: 'lowercase',
		parts: WHOLE
	},
	{
		id: 'row-upper',
		label: 'All caps',
		note: 'Smaller and tracked out. The most formal of these, and the least like the name.',
		layout: 'row',
		align: 'center',
		scale: 0.3,
		tracking: '0.18em',
		weight: 700,
		transform: 'uppercase',
		parts: WHOLE
	},
	{
		id: 'row-baseline',
		label: 'Baseline sat',
		note: 'The mark sits on the name’s baseline rather than on its optical centre. Tighter, less even.',
		layout: 'row',
		align: 'baseline',
		scale: 0.42,
		tracking: '-0.02em',
		weight: 700,
		parts: WHOLE
	},
	{
		id: 'row-reverse',
		label: 'Mark trailing',
		note: 'Name first. Reads as a signature, and the mark stops being the first thing you see.',
		layout: 'row-reverse',
		align: 'center',
		scale: 0.42,
		tracking: '-0.02em',
		weight: 700,
		parts: WHOLE
	},
	{
		id: 'stack-center',
		label: 'Stacked, centred',
		note: 'For a square-ish space: an avatar frame, or the middle of a card.',
		layout: 'stack',
		align: 'center',
		scale: 0.34,
		tracking: '-0.01em',
		weight: 700,
		parts: WHOLE
	},
	{
		id: 'stack-start',
		label: 'Stacked, left',
		note: 'Same object on a left margin. Lines up with body copy underneath it.',
		layout: 'stack',
		align: 'start',
		scale: 0.34,
		tracking: '-0.01em',
		weight: 700,
		parts: WHOLE
	},
	{
		id: 'row-two-lines',
		label: 'Two lines',
		note: 'Breaks at the second hump, so the lockup is as tall as the mark and half as wide.',
		layout: 'row',
		align: 'center',
		scale: 0.3,
		tracking: '-0.01em',
		weight: 700,
		leading: 1,
		parts: [LIL, BUNNY, { ...RABBIT, newline: true }]
	},
	{
		id: 'row-three-lines',
		label: 'Three lines',
		note: 'A block of name beside the mark. Tall, and hard to use small.',
		layout: 'row',
		align: 'center',
		scale: 0.26,
		tracking: '0',
		weight: 700,
		leading: 1,
		parts: [
			{ ...LIL, tone: 'quiet' },
			{ ...BUNNY, newline: true },
			{ ...RABBIT, newline: true }
		]
	}
];
