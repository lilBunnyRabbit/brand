/**
 * What the light region says. EDIT HERE.
 *
 * The prose lives in the sections; this is the part that is DATA — which uses are sanctioned, which
 * of dark's brand relationships survived the move to a warm ground, and the two ΔE measurements that
 * decided the light primary's hue. Kept here so the claims can be changed without touching markup,
 * and so the page cannot state a relationship the palette does not have.
 */

/** Where light mode is allowed, and where it is not. The second list is the one people misread. */
export const lightUsage = {
	yes: [
		'Product UI: an app, a dashboard, a settings screen.',
		'Anywhere a user has asked for a light interface.',
		'Documents and print, where paper is the ground anyway.'
	],
	no: [
		'Brand recognition. The mark anywhere it introduces itself.',
		'Marketing, landing pages, decks.',
		'The app icon and the favicon.',
		'Social cards and share images.'
	]
} as const;

/**
 * The measurement that decided the hue.
 *
 * Carry the page hue down the ladder rule to the brand's lightness — the page's own darkened form —
 * and measure each candidate against it. Dark's green sits too close to read as a colour ON the
 * paper instead of a shade OF it; the orange sits further out in the same position, and it is also
 * the seed's complement, so the measurement and the relationship agree.
 */
export const hueEvidence = {
	green: 12.8,
	orange: 14.2,
	unit: 'ΔE',
	note: 'Distance from the page’s own darkened form. Further is better: the colour reads as ink on the paper instead of a tint of it.'
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

/** Dark's four brand relationships, and the three that could not come along. */
export const hueMoves: readonly HueMove[] = [
	{
		id: 'accent',
		token: 'accent',
		rule: 'primary − 72°',
		kept: true,
		outcome: 'Dark’s own offset, on the other side of primary. Still legal here.'
	},
	{
		id: 'tertiary',
		token: 'tertiary',
		rule: 'primary + 54°',
		kept: false,
		outcome:
			'Dark’s tertiary is the midpoint of primary and the ground. On a warm page that arc is spoken for, so it takes the one arc paper leaves open: the midpoint of the text and accent hues, 302°, 36° from each.'
	},
	{
		id: 'secondary',
		token: 'secondary',
		rule: 'primary + 180°',
		kept: false,
		outcome:
			'The complement of orange is blue, and blue is already info. Moved to the midpoint of success and info, 190°, 50° clear of both.'
	},
	{
		id: 'warning',
		token: 'warning',
		rule: 'hue 70°',
		kept: false,
		outcome:
			'70° sits 16° from the page hue. Moved to the midpoint of the page and success, 113°, 27° clear of both. A green-gold, forced rather than chosen.'
	}
];
