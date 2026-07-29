/**
 * Palette → CSS custom properties, the swatch view model, and the copyable export formats.
 *
 * Every function is pure and derives from `config/palette.ts`, so a change to the seed moves the
 * page, the swatch values, the favicon and every export together.
 *
 * The emitted `<style>` block goes into `<svelte:head>`. Because the site is prerendered by
 * adapter-static, that string is evaluated during `vite build` and baked into the static HTML's
 * head — build-time output, no generator script, and no dependence on client JS for first paint.
 */
import { contrastRatio, mixOver, type Color } from '$lib/color';
import {
	groups,
	isShade,
	modifiers,
	shadeNames,
	swatches,
	type ModifierName,
	type ShadeName,
	type SwatchName
} from './config/palette';

const names = Object.keys(swatches) as SwatchName[];

/** CSS custom property name for a swatch. */
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
 * The label colour for a swatch card — a binary rule, not a luminance heuristic.
 *
 * Shades take `foreground` (4.84–8.60). Everything else takes `background` (6.55–13.66). Nothing
 * else works: on the light swatches, `foreground`, `cottontail` and white all land between 1.0 and
 * 2.4:1, and on `cottontail` specifically only `background` is legible.
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

/**
 * The document stylesheet: the 17 colours, the modifier alphas, and the page roles.
 *
 * Hex rather than `oklch()` for the values so that what the page renders is byte-identical to the
 * hex it tells people to use.
 *
 * Modifiers are emitted as `color-mix(in srgb, …)` — gamma, which is what a browser paints. A
 * linear-light blend would land somewhere nobody sees.
 */
export function brandStyleSheet(): string {
	const colors = names.map((name) => `\t${varName(name)}: ${swatches[name].hex};`);

	const alphas = (Object.keys(modifiers) as ModifierName[]).map(
		(key) => `\t--alpha-${key}: ${modifiers[key]};`
	);

	// Composited foreground steps, so components never have to spell the mix out.
	const mixes = (['muted', 'disabled', 'border'] as const).map(
		(key) =>
			`\t--fg-${key}: color-mix(in srgb, var(--brand-foreground) ${modifiers[key] * 100}%, transparent);`
	);

	return [':root {', ...colors, '', ...alphas, '', ...mixes, '}'].join('\n');
}

/* ────────────────────────────── export formats ────────────────────────────── */

/** CSS custom properties, with the derivation formula as a comment per line. */
export function exportCss(): string {
	const width = Math.max(...names.map((n) => varName(n).length));
	const body = names
		.map((name) => {
			const color = swatches[name];
			const decl = `\t${varName(name).padEnd(width)}: ${color.hex};`;
			return color.description ? `${decl} /* ${color.description} */` : decl;
		})
		.join('\n');
	return `:root {\n${body}\n}\n`;
}

/** Tailwind v4 `@theme`, so the palette is usable as `bg-background`, `text-primary`, … */
export function exportTailwind(): string {
	const body = names.map((name) => `\t--color-${name}: ${swatches[name].hex};`).join('\n');
	return `@theme {\n${body}\n}\n`;
}

/** Flat JSON tokens: hex, oklch, rgb and the formula per swatch. */
export function exportJson(): string {
	const out: Record<string, Record<string, string>> = {};
	for (const name of names) {
		const color = swatches[name];
		out[name] = {
			hex: color.hex,
			oklch: formatOklch(color),
			rgb: formatRgb(color),
			...(color.description ? { formula: color.description } : {})
		};
	}
	return `${JSON.stringify(out, null, 2)}\n`;
}

/** A column-aligned markdown table — the shape the palette was handed over in. */
export function exportMarkdown(): string {
	const headers = ['name', 'hex', 'oklch', 'comment'];
	const rows = names.map((name) => {
		const color = swatches[name];
		return [name, color.hex, formatOklch(color), color.description ?? ''];
	});

	const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
	const line = (cells: string[]) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`;

	return [
		line(headers),
		`| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`,
		...rows.map(line)
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
 * function — no component change.
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
	/** Marginally outside sRGB. None of these are, but the page would badge one if it appeared. */
	outOfGamut: boolean;
}

export interface GroupView {
	id: string;
	label: string;
	description?: string;
	swatches: SwatchView[];
}

function toView(name: SwatchName): SwatchView {
	const color = swatches[name];
	const label = labelFor(name);
	return {
		name,
		color,
		hex: color.hex,
		oklch: formatOklch(color),
		rgb: formatRgb(color),
		cssVar: varName(name),
		formula: color.description,
		formats: copyFormats(name, color),
		labelVar: varName(label),
		labelRatio: contrastRatio(swatches[label], color),
		outOfGamut: !color.isInGamut
	};
}

export const groupViews: GroupView[] = groups.map((group) => ({
	id: group.id,
	label: group.label,
	description: group.description,
	swatches: group.swatches.map(toView)
}));

/* ────────────────────────────── the contract ────────────────────────────── */

export interface ContractResult {
	/** Every non-shade colour against every shade. */
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
 */
export function measureContract(): ContractResult {
	const pairs: ContractResult['pairs'] = [];
	for (const shade of shadeNames) {
		for (const name of names) {
			if (isShade(name)) continue;
			pairs.push({ on: name, shade, ratio: contrastRatio(swatches[name], swatches[shade]) });
		}
	}
	const worst = pairs.reduce((a, b) => (b.ratio < a.ratio ? b : a));
	return { pairs, worst, holds: worst.ratio >= 4.5, count: pairs.length };
}

/** Contrast of a foreground at a modifier alpha over a given shade, composited in gamma sRGB. */
export function modifierRatio(fg: SwatchName, shade: ShadeName, modifier: ModifierName): number {
	return contrastRatio(
		mixOver(swatches[fg], swatches[shade], modifiers[modifier]),
		swatches[shade]
	);
}
