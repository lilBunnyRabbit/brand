/**
 * OKLCH color primitive, culori-backed.
 *
 * Vendored from `playground/colors/src/lib/oklch.ts` (the `color-testing` repo), with three
 * changes: the `culpiOklch` typo is renamed to `culori`, `fromCSS` reports which token failed,
 * and the file is formatted to this project's prettier config.
 *
 * Do NOT import this file directly from components or config — import `$lib/color` instead.
 * That module is the seam where this implementation gets swapped for `chromatics`.
 */
import {
	formatHex,
	formatCss,
	parse,
	wcagContrast,
	wcagLuminance,
	displayable,
	inGamut,
	clampChroma,
	converter,
	blend,
	filterDeficiencyProt,
	filterDeficiencyDeuter,
	filterDeficiencyTrit,
	filterGrayscale,
	filterContrast,
	filterBrightness,
	filterSaturate,
	type Oklch,
	type Rgb,
	type Lrgb
} from 'culori';

const toRgb = converter('rgb');
const toLrgb = converter('lrgb');
const toOklch = converter('oklch');

export class OKLCH {
	readonly description?: string;

	constructor(
		public readonly name: string,
		public readonly l: number,
		public readonly c: number,
		public readonly h: number,
		description?: string
	) {
		this.description = description;
	}

	describe(description: string): OKLCH {
		return new OKLCH(this.name, this.l, this.c, this.h, description);
	}

	/** Clone with absolute channel overrides. */
	derive(
		name: string,
		overrides: Partial<{ l: number; c: number; h: number }> = {},
		description?: string
	): OKLCH {
		return new OKLCH(
			name,
			overrides.l ?? this.l,
			overrides.c ?? this.c,
			overrides.h ?? this.h,
			description
		);
	}

	/** Clone with relative channel deltas. Hue wraps. */
	shift(
		name: string,
		deltas: Partial<{ l: number; c: number; h: number }> = {},
		description?: string
	): OKLCH {
		return new OKLCH(
			name,
			this.l + (deltas.l ?? 0),
			this.c + (deltas.c ?? 0),
			(((this.h + (deltas.h ?? 0)) % 360) + 360) % 360,
			description
		);
	}

	/** The culori color object. */
	get culori(): Oklch {
		return { mode: 'oklch', l: this.l, c: this.c, h: this.h };
	}

	toCSS(): string {
		return formatCss(this.culori);
	}

	get hex(): string {
		return formatHex(this.culori);
	}

	get srgb(): [number, number, number] {
		const rgb = toRgb(this.culori) as Rgb;
		return [rgb.r, rgb.g, rgb.b];
	}

	get linearSrgb(): [number, number, number] {
		const lrgb = toLrgb(this.culori) as Lrgb;
		return [lrgb.r, lrgb.g, lrgb.b];
	}

	get relativeLuminance(): number {
		return wcagLuminance(this.culori);
	}

	get isInGamut(): boolean {
		return displayable(this.culori);
	}

	get isInP3(): boolean {
		return inGamut('p3')(this.culori);
	}

	get gamutMapped(): OKLCH {
		if (this.isInGamut) return this;
		const clamped = toOklch(clampChroma(this.culori, 'oklch', 'rgb')) as Oklch;
		return new OKLCH(this.name, clamped.l, clamped.c, clamped.h ?? this.h, this.description);
	}

	/**
	 * Parse any CSS color string — hex, rgb(), hsl(), oklch(), named.
	 *
	 * `name` is included in the error because the upstream version threw bare
	 * `Invalid color: #ff00`, which gives no clue which token in the config is wrong.
	 */
	static fromCSS(color: string, name?: string): OKLCH {
		const parsed = parse(color);
		if (!parsed) {
			throw new Error(name ? `Invalid color for "${name}": ${color}` : `Invalid color: ${color}`);
		}
		const oklch = toOklch(parsed) as Oklch;
		return new OKLCH(name ?? formatHex(parsed), oklch.l, oklch.c, oklch.h ?? 0);
	}
}

export function contrastRatio(c1: OKLCH, c2: OKLCH): number {
	return wcagContrast(c1.culori, c2.culori);
}

/** Contrast ratio of fg over bg with fg at the given alpha (0–1), blended in linear sRGB. */
export function contrastRatioAlpha(fg: OKLCH, bg: OKLCH, alpha: number): number {
	if (alpha >= 1) return contrastRatio(fg, bg);
	const blended = blend([bg.culori, { ...fg.culori, alpha }], 'normal', 'lrgb');
	return wcagContrast(blended, bg.culori);
}

export type WcagLevel = 'AAA' | 'AA' | 'Fail';

export function wcagLevels(ratio: number): { normal: WcagLevel; large: WcagLevel } {
	return {
		normal: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
		large: ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'Fail'
	};
}

export function wcagColor(level: WcagLevel): string {
	switch (level) {
		case 'AAA':
			return '#22c55e';
		case 'AA':
			return '#eab308';
		case 'Fail':
			return '#ef4444';
	}
}

// --- Vision deficiency & condition simulation ---

export type VisionSimulation =
	| 'none'
	| 'protanopia'
	| 'deuteranopia'
	| 'tritanopia'
	| 'grayscale'
	| 'low-contrast'
	| 'high-contrast'
	| 'low-brightness'
	| 'high-saturation'
	| 'low-saturation';

export const visionSimulations: { value: VisionSimulation; label: string }[] = [
	{ value: 'none', label: 'Normal vision' },
	{ value: 'protanopia', label: 'Protanopia (no red)' },
	{ value: 'deuteranopia', label: 'Deuteranopia (no green)' },
	{ value: 'tritanopia', label: 'Tritanopia (no blue)' },
	{ value: 'grayscale', label: 'Grayscale' },
	{ value: 'low-contrast', label: 'Low contrast' },
	{ value: 'high-contrast', label: 'High contrast' },
	{ value: 'low-brightness', label: 'Low brightness' },
	{ value: 'high-saturation', label: 'High saturation' },
	{ value: 'low-saturation', label: 'Low saturation' }
];

const simFilters: Record<VisionSimulation, ((c: Oklch) => Rgb) | null> = {
	none: null,
	protanopia: filterDeficiencyProt(1) as (c: Oklch) => Rgb,
	deuteranopia: filterDeficiencyDeuter(1) as (c: Oklch) => Rgb,
	tritanopia: filterDeficiencyTrit(1) as (c: Oklch) => Rgb,
	grayscale: filterGrayscale(1) as (c: Oklch) => Rgb,
	'low-contrast': filterContrast(0.5) as (c: Oklch) => Rgb,
	'high-contrast': filterContrast(1.8) as (c: Oklch) => Rgb,
	'low-brightness': filterBrightness(0.5) as (c: Oklch) => Rgb,
	'high-saturation': filterSaturate(2) as (c: Oklch) => Rgb,
	'low-saturation': filterSaturate(0.3) as (c: Oklch) => Rgb
};

export function simulateVision(color: OKLCH, sim: VisionSimulation): OKLCH {
	const filter = simFilters[sim];
	if (!filter) return color;
	const result = toOklch(filter(color.culori)) as Oklch;
	return new OKLCH(color.name, result.l, result.c, result.h ?? 0, color.description);
}
