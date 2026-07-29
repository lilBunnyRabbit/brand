/**
 * The rules, and the reasons. EDIT HERE.
 *
 * Transcribed from the colour brief. These drive the Do / Don't section, so the page states the same
 * rules the code enforces — and several of them are asserted in `tests/palette.test.ts`, which is
 * the difference between a guideline and a guarantee.
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
		id: 'no-light-mode',
		rule: 'No light mode.',
		why: 'Designed but not built. Nothing here should be inverted to fake one, and there is no toggle.',
		severity: 'never'
	},
	{
		id: 'nothing-on-white',
		rule: 'Nothing brand-coloured on white.',
		why: 'primary is 2.23:1 on white and cottontail is 1.15:1 — the mark’s edge simply disappears.',
		severity: 'never'
	},
	{
		id: 'no-adjacent-brand',
		rule: 'No two brand colours adjacent or layered.',
		why: 'foreground, the four brand colours and all four states sit at lightness 0.745, so any pair is roughly 1:1. Separate them with a gap of the page shade or a border.',
		severity: 'never'
	},
	{
		id: 'no-brand-gradients',
		rule: 'No gradients between brand colours.',
		why: 'Equal lightness means no luminance travel, so the gradient reads as mud. Between two shades is fine.',
		severity: 'never'
	},
	{
		id: 'no-white-on-brand',
		rule: 'No white text on a brand fill.',
		why: 'White on primary is 2.23:1. Text on any brand fill is background #17252c — 6.55 to 7.06, all AA.',
		severity: 'never'
	},
	{
		id: 'no-new-colours',
		rule: 'Do not add colours.',
		why: 'Anything apparently missing is an opacity modifier on an existing colour, or a shade.',
		severity: 'never'
	},
	{
		id: 'no-retinting',
		rule: 'Do not re-tint the greys.',
		why: 'The shades carry hue 230 and the brand carries 122. They are meant to differ.',
		severity: 'never'
	},
	{
		id: 'three-shades',
		rule: 'No more than three shades per viewport.',
		why: 'Adjacent shades are about 1.1:1 apart, so stacking them reads as noise rather than structure.',
		severity: 'care'
	},
	{
		id: 'muted-text',
		rule: 'Muted text is for captions, not content.',
		why: 'foreground at 65% is 3.76:1 on the page shade — AA-large only — and drops to about 2.96 on the lightest shade.',
		severity: 'care'
	},
	{
		id: 'logo-exempt',
		rule: 'Do not “fix” the logo’s contrast.',
		why: 'cottontail on primary is 1.94:1 and that is deliberate. WCAG exempts logotypes (SC 1.4.3, 1.4.11). No stroke, no shadow, no lighter green.',
		severity: 'never'
	}
];
