/**
 * The rules, and the reasons. EDIT HERE.
 *
 * Transcribed from the colour brief. These drive the Do / Don't section, so the page states the same
 * rules the code enforces, and the contract behind them is measured on the page rather than quoted.
 */
export interface Rule {
	id: string;
	/** The rule, imperative. */
	rule: string;
	/** Why — a measured number wherever there is one. */
	why: string;
	/** `never` shows as a hard don't; `care` as a caution. */
	severity: 'never' | 'care';
}

export const prohibitions: readonly Rule[] = [
	{
		id: 'light-is-ui-only',
		rule: 'Light mode is UI only.',
		why: 'Use it when a product surface needs it. Never for brand recognition, marketing, the app icon or social cards. Those are always dark.',
		severity: 'never'
	},
	{
		id: 'nothing-on-white',
		rule: 'Nothing brand-coloured on white.',
		why: 'Dark’s colours on white vanish: primary is 2.23:1 and cottontail 1.14:1. White is the top rung of the LIGHT ladder — that is where the tint runs out — and the light palette is what goes on it. Nothing from the dark palette ever does.',
		severity: 'never'
	},
	{
		id: 'no-adjacent-brand',
		rule: 'No two brand colours adjacent or layered.',
		why: 'They are all the same brightness, so side by side they blur into one shape. A gap or a border fixes it.',
		severity: 'never'
	},
	{
		id: 'no-brand-gradients',
		rule: 'No gradients between brand colours.',
		why: 'Same brightness means the gradient has nowhere to travel, and it comes out muddy. Between two shades is lovely.',
		severity: 'never'
	},
	{
		id: 'no-white-on-brand',
		rule: 'No white text on a brand fill.',
		why: 'White on primary is 2.23:1. Use background #17252c and you get 6.55 to 7.06 instead.',
		severity: 'never'
	},
	{
		id: 'no-new-colours',
		rule: 'Do not add colours.',
		why: 'Whatever seems to be missing is either a shade or an existing colour turned down.',
		severity: 'never'
	},
	{
		id: 'no-retinting',
		rule: 'Do not re-tint the greys.',
		why: 'The backgrounds are blue and the brand is green on purpose. Leave them be.',
		severity: 'never'
	},
	{
		id: 'three-shades',
		rule: 'No more than three shades per viewport.',
		why: 'Neighbours are only about 1.1:1 apart, so a fourth one stops reading as structure.',
		severity: 'care'
	},
	{
		id: 'muted-text',
		rule: 'Muted text is for captions, not content.',
		why: 'At 65% it is 3.75:1 on the page and 2.94 on the lightest shade. Fine for a caption, not for anything important.',
		severity: 'care'
	},
	{
		id: 'logo-exempt',
		rule: 'Do not “fix” the logo’s contrast.',
		why: 'The bright badge is 1.96:1 on purpose. Logos are exempt (WCAG 1.4.3, 1.4.11). No stroke, no shadow, no lighter green.',
		severity: 'never'
	}
];
