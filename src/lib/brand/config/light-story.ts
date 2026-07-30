/**
 * What the light region says. EDIT HERE.
 *
 * The prose lives in the sections; this is the part that is DATA — which uses are sanctioned, which
 * of dark's brand relationships survived the move to a warm ground, and the two ΔE measurements that
 * decided the light primary's hue. Kept here so the claims can be changed without touching markup,
 * and so the page cannot state a relationship the palette does not have — `tests/palette.test.ts`
 * asserts each of the four against the real colours.
 */

/** Where light mode is allowed, and where it is not. The second list is the one people misread. */
export const lightUsage = {
	yes: [
		'Product UI — an app, a dashboard, a settings screen.',
		'Anywhere a user has asked for a light interface.',
		'Documents and print, where paper is the ground anyway.'
	],
	no: [
		'Brand recognition — the mark, anywhere it introduces itself.',
		'Marketing, landing pages, decks.',
		'The app icon and the favicon.',
		'Social cards and share images.'
	]
} as const;

/**
 * The measurement that decided the hue.
 *
 * Reusing dark's green on a warm page fails, and it fails measurably rather than by taste: it sits
 * too close to the page's own darkened form to read as a colour ON the paper instead of a shade OF
 * it. Orange sits further out in the same position.
 */
export const hueEvidence = {
	green: 13.1,
	orange: 15.2,
	unit: 'ΔE',
	note: 'Distance from the page’s own darkened form. Further is better — it is what makes a colour read as ink rather than as a tint of the paper.'
} as const;

export interface HueMove {
	id: string;
	/** The token, in the scheme's light vocabulary. */
	token: string;
	/** The relationship as dark states it. */
	rule: string;
	/** Did it survive the move to a warm ground? */
	kept: boolean;
	/** Where it ended up when it could not. */
	outcome: string;
}

/** Dark's four brand relationships, and which two could not come along. */
export const hueMoves: readonly HueMove[] = [
	{
		id: 'accent',
		token: 'accent',
		rule: 'primary − 72°',
		kept: true,
		outcome: 'Dark’s own offset, still legal here.'
	},
	{
		id: 'tertiary',
		token: 'tertiary',
		rule: 'primary − 120°',
		kept: true,
		outcome: 'Dark’s own offset, still legal here.'
	},
	{
		id: 'secondary',
		token: 'secondary',
		rule: 'primary + 180°',
		kept: false,
		outcome:
			'The complement of orange is blue, and blue is already info. Moved to 190° — the centre of the legal teal arc, 50° clear of both success and info.'
	},
	{
		id: 'warning',
		token: 'warning',
		rule: 'hue 70°',
		kept: false,
		outcome:
			'70° sits 10° from the page hue, and nothing between 105° and 115° was free for an amber. So warning is green-gold at 110°.'
	}
];
