/**
 * Palette → CSS custom properties, the swatch view model, and the copyable export formats.
 *
 * Every function is pure and derives from `config/palette*.ts`, so a change to the seed moves the
 * page, the swatch values, the favicon and every export together.
 *
 * The emitted `<style>` block goes into `<svelte:head>`. Because the site is prerendered by
 * adapter-static, that string is evaluated during `vite build` and baked into the static HTML's
 * head — build-time output, no generator script, and no dependence on client JS for first paint.
 *
 * Both modes ship in that one block. Dark sits on `:root` so the canonical mode needs no attribute
 * and no JS; light sits on a bare `[data-theme='light']` so ANY element can scope it, which is how a
 * light section renders inside a page whose root is dark.
 */
import { contrastRatio, mixOver, type Color } from '$lib/color';
import {
	dark,
	groupsFor,
	isShade,
	markEars,
	modifiers,
	shadeNames,
	themes,
	tokenName,
	type ModifierName,
	type Palette,
	type ShadeName,
	type SwatchName,
	type ThemeName
} from './config/palette';

const names = Object.keys(dark) as SwatchName[];

/** CSS custom property name for a swatch. Identical in both modes — the mode is the scope. */
export function varName(name: string): string {
	return `--brand-${name}`;
}

/** `oklch(l c h)`, trailing zeros trimmed. The canonical form — the palette is authored in it. */
export function formatOklch(color: Color): string {
	const round = (value: number, places: number) => String(Number(value.toFixed(places)));
	return `oklch(${round(color.l, 4)} ${round(color.c, 5)} ${round(color.h, 2)})`;
}

/** `rgb(r g b)` with integer channels. */
export function formatRgb(color: Color): string {
	const [r, g, b] = color.srgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));
	return `rgb(${r} ${g} ${b})`;
}

/**
 * The label colour for a swatch card — a binary rule, not a luminance heuristic, and the same rule
 * in both modes.
 *
 * Shades take `foreground`, everything else takes `background`. Measured: dark 4.84–8.60 and
 * 6.55–13.66, light 4.82–8.28 and 4.45–7.48. Nothing else works — in dark, `foreground`,
 * `cottontail` and white all land between 1.0 and 2.4 on the light swatches.
 */
export function labelFor(name: string): SwatchName {
	return isShade(name) ? 'foreground' : 'background';
}

export interface CopyFormat {
	id: string;
	label: string;
	value: string;
}

/** Everything a swatch can be copied as, in the order the UI shows them. */
export function copyFormats(name: string, color: Color): CopyFormat[] {
	return [
		{ id: 'hex', label: 'HEX', value: color.hex },
		{ id: 'oklch', label: 'OKLCH', value: formatOklch(color) },
		{ id: 'rgb', label: 'RGB', value: formatRgb(color) },
		{ id: 'var', label: 'CSS var', value: `var(${varName(name)})` }
	];
}

/* ────────────────────────────── the stylesheet ────────────────────────────── */

const declare = (palette: Palette) =>
	names.map((name) => `\t${varName(name)}: ${palette[name].hex};`).join('\n');

/**
 * The document stylesheet: both palettes, the modifier alphas, and the composited steps.
 *
 * Hex rather than `oklch()` for the values so that what the page renders is byte-identical to the
 * hex it tells people to use.
 *
 * The composited steps are emitted under `:root, [data-theme]` rather than `:root` alone, and that
 * matters: a custom property's computed value has its `var()` references already substituted, so a
 * `--fg-muted` computed once on `:root` would inherit into a light scope still carrying the DARK
 * foreground. Matching the scoping element itself forces a recompute. Same reason `app.css` declares
 * its derived vars the same way.
 *
 * Modifiers are `color-mix(in srgb, …)` — gamma, which is what a browser paints. A linear-light
 * blend would land somewhere nobody sees.
 */
export function brandStyleSheet(): string {
	const alphas = (Object.keys(modifiers) as ModifierName[]).map(
		(key) => `\t--alpha-${key}: ${modifiers[key]};`
	);

	// Composited foreground steps, so components never have to spell the mix out.
	const mixes = (['muted', 'disabled', 'border'] as const).map(
		(key) =>
			`\t--fg-${key}: color-mix(in srgb, var(--brand-foreground) ${modifiers[key] * 100}%, transparent);`
	);

	return [
		`:root,\n[data-theme='dark'] {`,
		declare(themes.dark),
		'}',
		'',
		`[data-theme='light'] {`,
		declare(themes.light),
		'}',
		'',
		'/* The mark’s ears do not theme. Only the disc does. */',
		':root {',
		`\t${varName(markEars.name)}: ${markEars.hex};`,
		'',
		...alphas,
		'}',
		'',
		':root,\n[data-theme] {',
		...mixes,
		'}'
	].join('\n');
}

/* ────────────────────────────── export formats ────────────────────────────── */

const widest = Math.max(...names.map((n) => varName(n).length));

function cssBlock(selector: string, palette: Palette, theme: ThemeName): string {
	const body = names
		.map((name) => {
			const color = palette[name];
			const decl = `\t${varName(name).padEnd(widest)}: ${color.hex};`;
			return color.description ? `${decl} /* ${color.description} */` : decl;
		})
		.join('\n');
	return `/* ${theme} */\n${selector} {\n${body}\n}\n`;
}

/** CSS custom properties for both modes, with the derivation formula as a comment per line. */
export function exportCss(): string {
	return [
		cssBlock(":root,\n[data-theme='dark']", themes.dark, 'dark'),
		cssBlock("[data-theme='light']", themes.light, 'light'),
		`/* Fixed asset colour — identical in both modes. */\n:root {\n\t${varName(markEars.name)}: ${markEars.hex};\n}\n`
	].join('\n');
}

/** Tailwind v4 `@theme`, so the palette is usable as `bg-background`, `text-primary`, … */
export function exportTailwind(): string {
	const theme = names.map((name) => `\t--color-${name}: ${themes.dark[name].hex};`).join('\n');
	const override = names.map((name) => `\t--color-${name}: ${themes.light[name].hex};`).join('\n');
	return (
		`@theme {\n${theme}\n\t--color-mark_ears: ${markEars.hex};\n}\n\n` +
		`/* Light is a scope, not a second theme block. */\n[data-theme='light'] {\n${override}\n}\n`
	);
}

/** Flat JSON tokens per mode: hex, oklch, rgb and the formula per swatch. */
export function exportJson(): string {
	const out: Record<string, unknown> = {};
	for (const theme of ['dark', 'light'] as const) {
		const mode: Record<string, Record<string, string>> = {};
		for (const name of names) {
			const color = themes[theme][name];
			mode[tokenName(name, theme)] = {
				hex: color.hex,
				oklch: formatOklch(color),
				rgb: formatRgb(color),
				...(color.description ? { formula: color.description } : {})
			};
		}
		out[theme] = mode;
	}
	out.fixed = {
		mark_ears: { hex: markEars.hex, oklch: formatOklch(markEars), rgb: formatRgb(markEars) }
	};
	return `${JSON.stringify(out, null, 2)}\n`;
}

/** Column-aligned markdown — the shape the palette was handed over in, one table per mode. */
export function exportMarkdown(): string {
	const headers = ['name', 'hex', 'oklch', 'comment'];

	const table = (theme: ThemeName) => {
		const rows = names.map((name) => {
			const color = themes[theme][name];
			return [tokenName(name, theme), color.hex, formatOklch(color), color.description ?? ''];
		});
		const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
		const line = (cells: string[]) =>
			`| ${cells.map((cell, i) => cell.padEnd(widths[i])).join(' | ')} |`;
		return [
			`### ${theme}`,
			'',
			line(headers),
			`| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`,
			...rows.map(line)
		].join('\n');
	};

	return [
		table('dark'),
		'',
		table('light'),
		'',
		`Plus \`mark_ears\` \`${markEars.hex}\`, identical in both modes.`
	].join('\n');
}

export interface ExportFormat {
	id: string;
	label: string;
	filename: string;
	render(): string;
}

/**
 * The export registry. The UI iterates this, so adding a fifth format is one entry plus one
 * function — no component change. Every format covers both modes.
 */
export const exportFormats: ExportFormat[] = [
	{ id: 'css', label: 'CSS', filename: 'palette.css', render: exportCss },
	{ id: 'tailwind', label: 'Tailwind', filename: 'palette.theme.css', render: exportTailwind },
	{ id: 'json', label: 'JSON', filename: 'palette.json', render: exportJson },
	{ id: 'markdown', label: 'Markdown', filename: 'palette.md', render: exportMarkdown }
];

/* ────────────────────────────── view model ────────────────────────────── */

export interface SwatchView {
	name: SwatchName;
	/** The name as the scheme writes it — `light_primary` in light, `primary` in dark. */
	token: string;
	color: Color;
	hex: string;
	oklch: string;
	rgb: string;
	cssVar: string;
	formula?: string;
	formats: CopyFormat[];
	/** `foreground` for a shade, `background` for everything else. */
	labelVar: string;
	/** Contrast of that label against the plate. */
	labelRatio: number;
	/** Outside sRGB by enough to matter. See `perceptiblyOutOfGamut`. */
	outOfGamut: boolean;
}

/**
 * Outside sRGB by more than half a channel step (1/510).
 *
 * A strict `isInGamut` is too strict to badge: two of the light colours land a hair outside because
 * Chromatics' gamut mapper stopped there — `background_lighter` overshoots red by 0.00001 and
 * `warning` undershoots blue by 0.00027. Both round to exact, correct hexes. Badging them would
 * report a problem that does not exist at 8 bits per channel, so the threshold is the smallest
 * excursion a display could actually show.
 */
export function perceptiblyOutOfGamut(color: Color): boolean {
	const slack = 1 / 510;
	return color.srgb.some((v) => v < -slack || v > 1 + slack);
}

export interface GroupView {
	id: string;
	label: string;
	description?: string;
	swatches: SwatchView[];
}

function toView(name: SwatchName, theme: ThemeName): SwatchView {
	const palette = themes[theme];
	const color = palette[name];
	const label = labelFor(name);
	return {
		name,
		token: tokenName(name, theme),
		color,
		hex: color.hex,
		oklch: formatOklch(color),
		rgb: formatRgb(color),
		cssVar: varName(name),
		formula: color.description,
		formats: copyFormats(name, color),
		labelVar: varName(label),
		labelRatio: contrastRatio(palette[label], color),
		outOfGamut: perceptiblyOutOfGamut(color)
	};
}

/** The grouped swatches for a mode. Membership is shared; values and copy are not. */
export function groupViews(theme: ThemeName): GroupView[] {
	return groupsFor(theme).map((group) => ({
		id: group.id,
		label: group.label,
		description: group.description,
		swatches: group.swatches.map((name) => toView(name, theme))
	}));
}

/* ────────────────────────────── the contract ────────────────────────────── */

export interface ContractResult {
	/** Every rail colour against every shade. */
	pairs: { on: SwatchName; shade: ShadeName; ratio: number }[];
	worst: { on: SwatchName; shade: ShadeName; ratio: number };
	holds: boolean;
	count: number;
}

/**
 * Measure the contract rather than asserting it in prose.
 *
 * The page states the worst cell as a live number, so if the seed ever moves and the contract
 * degrades, the page says so instead of continuing to claim 4.59.
 *
 * `cottontail` is excluded in both modes — it is an identity colour, not a rail colour, and it makes
 * no contract claim. Dark's clears anyway (9.56–16.98); light's does not (3.04–5.23), which is
 * exactly why it is a UI token there and nothing more.
 */
export function measureContract(theme: ThemeName): ContractResult {
	const palette = themes[theme];
	const pairs: ContractResult['pairs'] = [];
	for (const shade of shadeNames) {
		for (const name of names) {
			if (isShade(name) || name === 'cottontail') continue;
			pairs.push({ on: name, shade, ratio: contrastRatio(palette[name], palette[shade]) });
		}
	}
	const worst = pairs.reduce((a, b) => (b.ratio < a.ratio ? b : a));
	return { pairs, worst, holds: worst.ratio >= 4.5, count: pairs.length };
}

/** Contrast of `cottontail` across the seven shades — the focus-ring range, per mode. */
export function cottontailOnShades(theme: ThemeName): { min: number; max: number } {
	const palette = themes[theme];
	const ratios = shadeNames.map((shade) => contrastRatio(palette.cottontail, palette[shade]));
	return { min: Math.min(...ratios), max: Math.max(...ratios) };
}

/** Contrast of a foreground at a modifier alpha over a given shade, composited in gamma sRGB. */
export function modifierRatio(
	fg: SwatchName,
	shade: ShadeName,
	modifier: ModifierName,
	theme: ThemeName = 'dark'
): number {
	const palette = themes[theme];
	return contrastRatio(mixOver(palette[fg], palette[shade], modifiers[modifier]), palette[shade]);
}
