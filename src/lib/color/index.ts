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
 *                    derive/shift, toCSS(), hex, isInGamut, isInP3, gamutMapped
 *   parseColor       any CSS color string -> Color, throwing with the token name on failure
 *   contrastRatio    WCAG 2.x ratio between two Colors
 *   contrastRatioAlpha  same, with the foreground composited at an alpha
 *   wcagLevels       ratio -> { normal, large } pass levels
 *   wcagColor        level -> the swatch color used to render that verdict
 *   simulateVision   Color -> Color under a vision-deficiency or condition filter
 *   visionSimulations  the ready-made option list for a <select>
 */
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
