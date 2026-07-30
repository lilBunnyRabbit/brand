/**
 * The color seam.
 *
 * Every module in this project that touches color math imports from here and nowhere else.
 * Today it wraps the vendored culori-backed `OKLCH` primitive in `./oklch.ts`. When
 * `chromatics` (https://github.com/lilBunnyRabbit/chromatics) settles, the swap is a rewrite of
 * *this file's body only* — no call site changes.
 *
 * Keep this surface narrow. Anything added here is something a future implementation has to
 * provide, so the contract below is the full list of what a replacement must satisfy:
 *
 *   Color            perceptual color value: channels l/c/h, name, description,
 *                    derive/shift/atLightness/atChroma/complement, maxChroma,
 *                    toCSS(), hex, isInGamut, isInP3, gamutMapped
 *   parseColor       any CSS color string -> Color, throwing with the token name on failure
 *   mixOver          composite a color over another at an alpha, in gamma sRGB
 *   travelAxes       interpolate from one Color to another ONE AXIS AT A TIME, for animation
 *   contrastRatio    WCAG 2.x ratio between two Colors
 *   contrastRatioAlpha  same, with the foreground composited at an alpha
 *   wcagLevels       ratio -> { normal, large } pass levels
 *   wcagColor        level -> the swatch color used to render that verdict
 *   simulateVision   Color -> Color under a vision-deficiency or condition filter
 *   visionSimulations  the ready-made option list for a <select>
 *   colorNotations   Color -> every notation it can be written in, CSS-valid ones first
 */
import { converter, formatCss, formatHex, formatRgb, round, type Mode } from 'culori';
import { OKLCH } from './oklch';

export {
	contrastRatio,
	contrastRatioAlpha,
	wcagLevels,
	wcagColor,
	simulateVision,
	visionSimulations
} from './oklch';

export type { WcagLevel, VisionSimulation } from './oklch';

/**
 * A perceptual color value.
 *
 * Exported under a neutral name so call sites don't hardcode the current representation. The
 * value and type declarations live in separate declaration spaces, so one name gives call sites
 * both `new Color(name, l, c, h)` and `let c: Color`. Values are still `instanceof OKLCH` — this
 * is an alias, not a subclass, so nothing breaks when the implementation is swapped for one whose
 * class happens to be named differently.
 */
export const Color = OKLCH;
export type Color = OKLCH;

/** Parse any CSS color string. `name` is the token name, used in the error on failure. */
export function parseColor(css: string, name?: string): Color {
	return OKLCH.fromCSS(css, name);
}

/**
 * Composite `fg` over `bg` at `alpha`, in **gamma** sRGB.
 *
 * Gamma, not linear-light, because that is what a browser paints for `rgba()` and
 * `color-mix(in srgb, …)`. Measuring a translucent token in a linear blend would report a ratio
 * nobody will ever see — the palette brief calls this out specifically.
 */
export function mixOver(fg: Color, bg: Color, alpha: number): Color {
	const [fr, fg_, fb] = fg.srgb;
	const [br, bg_, bb] = bg.srgb;
	const mix = (a: number, b: number) => a * alpha + b * (1 - alpha);
	return OKLCH.fromCSS(
		`rgb(${[mix(fr, br), mix(fg_, bg_), mix(fb, bb)]
			.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255))
			.join(' ')})`,
		`${fg.name}/${Math.round(alpha * 100)}`
	);
}

/** The three channels a colour can travel along, named as the `Color` fields are. */
export type ColorAxis = 'l' | 'c' | 'h';

/**
 * Travel from one colour to another ONE AXIS AT A TIME.
 *
 * `t` runs 0 → 1 and is cut into equal phases, one per entry in `axes`: the first axis moves while
 * the others hold at `from`, then the second, and so on. Lives here rather than in the component
 * that animates it because interpolating channels is colour maths, and because "what does a blend
 * between two palette colours look like" is a question a replacement implementation has to answer
 * the same way.
 *
 * The phasing is not decoration. Most of this palette shares one lightness, so a simultaneous blend
 * between two of its colours passes through near-grey at the halfway point — the move reads as a
 * fade rather than as a turn. One axis at a time keeps each move legible as the thing it is.
 *
 * Hue takes the SHORTER arc and lands on `to`'s own hue rather than on a caller-supplied delta, so a
 * phase list cannot disagree with the palette about where a colour ends up. `t >= 1` returns `to`
 * exactly, which means an axis the caller forgot to list shows up mid-flight and never at rest.
 */
export function travelAxes(from: Color, to: Color, axes: readonly ColorAxis[], t: number): Color {
	if (t <= 0 || axes.length === 0) return from;
	if (t >= 1) return to;

	const span = 1 / axes.length;
	const channels = { l: from.l, c: from.c, h: from.h };

	axes.forEach((axis, index) => {
		const f = Math.min(1, Math.max(0, (t - index * span) / span));
		if (f === 0) return;

		if (axis === 'h') {
			/*
				±180 is a tie between the two arcs, and it resolves FORWARDS — which is how a complement
				reads, and is what a hue defined as `h + 180` looks like on the wheel.

				The tolerance is load-bearing rather than defensive: a palette that derives its complement
				arithmetically lands on 179.99999999999997 or 180.00000000000003 depending on which way the
				subtraction rounds, so a bare `> 180` sends half of the exact complements the long way
				round and the two of them travel through opposite sides of the wheel.
			*/
			let turn = (((to.h - from.h) % 360) + 360) % 360;
			if (turn > 180 + 1e-6) turn -= 360;
			channels.h = (((from.h + turn * f) % 360) + 360) % 360;
		} else {
			channels[axis] = from[axis] + (to[axis] - from[axis]) * f;
		}
	});

	return new OKLCH(`${from.name}→${to.name}`, channels.l, channels.c, channels.h);
}

/* ────────────────────────────── notations ────────────────────────────── */

export interface ColorNotation {
	id: string;
	label: string;
	value: string;
	/** A browser can parse it. The rest are culori-only and marked as such in the UI. */
	css: boolean;
}

/**
 * Every notation a colour can be written in — conversion done entirely by culori, never by hand.
 *
 * `css: true` is the set a browser will actually parse: the four legacy/modern functions, the three
 * perceptual ones, and the `color()` spaces. Everything below that line is culori's own space
 * (`--okhsl`, `--jzazbz`, …), valid to the library and to nothing else, which is why it is flagged
 * rather than mixed in.
 *
 * Two notes on the two library calls that are NOT `formatCss`:
 *   hex   `formatHex`, because `formatCss` on an rgb value emits `color(srgb …)` rather than a hex.
 *   rgb   `formatRgb`, for the same reason — `rgb(164, 180, 131)` is what people expect to copy.
 */
const NOTATIONS: { id: string; label: string; mode: Mode; css: boolean }[] = [
	{ id: 'oklch', label: 'OKLCH', mode: 'oklch', css: true },
	{ id: 'hsl', label: 'HSL', mode: 'hsl', css: true },
	{ id: 'hwb', label: 'HWB', mode: 'hwb', css: true },
	{ id: 'lab', label: 'LAB', mode: 'lab', css: true },
	{ id: 'lch', label: 'LCH', mode: 'lch', css: true },
	{ id: 'oklab', label: 'OKLAB', mode: 'oklab', css: true },
	{ id: 'p3', label: 'Display P3', mode: 'p3', css: true },
	{ id: 'lrgb', label: 'sRGB linear', mode: 'lrgb', css: true },
	{ id: 'rec2020', label: 'Rec. 2020', mode: 'rec2020', css: true },
	{ id: 'a98', label: 'A98 RGB', mode: 'a98', css: true },
	{ id: 'prophoto', label: 'ProPhoto RGB', mode: 'prophoto', css: true },
	{ id: 'xyz65', label: 'XYZ D65', mode: 'xyz65', css: true },
	{ id: 'xyz50', label: 'XYZ D50', mode: 'xyz50', css: true },
	{ id: 'okhsl', label: 'OKHSL', mode: 'okhsl', css: false },
	{ id: 'okhsv', label: 'OKHSV', mode: 'okhsv', css: false },
	{ id: 'hsv', label: 'HSV', mode: 'hsv', css: false },
	{ id: 'lchuv', label: 'LCHuv', mode: 'lchuv', css: false },
	{ id: 'jch', label: 'JzCzHz', mode: 'jch', css: false }
];

/*
	Four decimals, applied to culori's converted channels before formatting.

	Unrounded output runs to seventeen significant figures, which nothing can usefully paste. Rounding
	the fractional channels to four gives percentages to two places, which is the precision a hand-written
	stylesheet uses anyway.
*/
const trim = round(4);

/*
	Rounding the channels is not enough on its own: `formatCss` renders saturation and lightness as
	percentages, and multiplying an already-rounded fraction by 100 puts the float error back —
	`0.6092 * 100` prints as `60.919999999999995%`. So the formatted string gets a second pass.

	Done on the output rather than per colour space because every percentage-bearing space has the same
	problem, and one rule beats five special cases.
*/
const tidy = (css: string) =>
	css.replace(/-?\d+\.\d{5,}/g, (n) => String(Number(Number(n).toFixed(4))));

/**
 * Every notation for a colour, CSS-valid ones first.
 *
 * Achromatic colours are special-cased for ONE reason: pure white converts to sRGB a hair off (1,1,1),
 * so the hue-bearing spaces divide by a vanishing chroma and culori reports `hsl(300 50% 100%)` for
 * white. The source's own chroma is the reliable test — it is exactly 0 by construction — so the hue is
 * zeroed rather than recomputed. No colour maths, just refusing to print a meaningless angle.
 */
export function colorNotations(color: Color): ColorNotation[] {
	const achromatic = color.c === 0;

	const notations = NOTATIONS.map(({ id, label, mode, css }) => {
		const converted = converter(mode)(color.culori) as unknown as Record<string, unknown>;
		const cleaned = Object.fromEntries(
			Object.entries(converted).map(([channel, value]) => {
				if (typeof value !== 'number') return [channel, value];
				const zeroed = achromatic && (channel === 'h' || channel === 's');
				return [channel, zeroed ? 0 : trim(value)];
			})
		);
		return { id, label, value: tidy(formatCss(cleaned as never) ?? ''), css };
	});

	return [
		{ id: 'hex', label: 'HEX', value: formatHex(color.culori) ?? '', css: true },
		{ id: 'rgb', label: 'RGB', value: formatRgb(color.culori) ?? '', css: true },
		...notations
	];
}
