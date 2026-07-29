/**
 * Palette → CSS custom properties, and the copyable export formats.
 *
 * Every function here is pure and derives from `config/palette.ts`, so a change to the seed moves
 * the page, the swatch values and every export together. Nothing is maintained in parallel.
 *
 * The emitted `<style>` block goes into `<svelte:head>`. Because the site is prerendered by
 * adapter-static, that string is evaluated during `vite build` and baked into the static HTML's
 * head — build-time output with no generator script, and no dependence on client JS for first
 * paint.
 */
import type { Color } from '$lib/color';
import { groups, swatches, type SwatchName } from './config/palette';

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

const names = Object.keys(swatches) as SwatchName[];

/**
 * The document stylesheet.
 *
 * Hex rather than `oklch()` for the values: the palette is authored in OKLCH and displayed in it,
 * but one swatch (`background-darkest`) sits marginally outside sRGB, and emitting raw OKLCH would
 * render it slightly differently from the hex this page tells people to use. The guide and the
 * thing it documents have to agree.
 */
export function brandStyleSheet(): string {
	const lines = names.map((name) => `\t${varName(name)}: ${swatches[name].hex};`);
	return `:root {\n${lines.join('\n')}\n}`;
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

/** A column-aligned markdown table — the same shape the palette was handed over in. */
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
	lang: string;
	render(): string;
}

/**
 * The export registry. The UI iterates this, so adding a sixth format is one entry plus one
 * function — no component change.
 */
export const exportFormats: ExportFormat[] = [
	{ id: 'css', label: 'CSS', filename: 'palette.css', lang: 'css', render: exportCss },
	{
		id: 'tailwind',
		label: 'Tailwind',
		filename: 'palette.theme.css',
		lang: 'css',
		render: exportTailwind
	},
	{ id: 'json', label: 'JSON', filename: 'palette.json', lang: 'json', render: exportJson },
	{
		id: 'markdown',
		label: 'Markdown',
		filename: 'palette.md',
		lang: 'markdown',
		render: exportMarkdown
	}
];

/* ────────────────────────────── view model ────────────────────────────── */

export interface SwatchView {
	name: string;
	color: Color;
	hex: string;
	oklch: string;
	rgb: string;
	cssVar: string;
	formula?: string;
	formats: CopyFormat[];
	/** Marginally outside sRGB — the page badges these rather than hiding them. */
	outOfGamut: boolean;
	/** True when this swatch is light enough to need dark text on it. */
	needsDarkText: boolean;
}

export interface GroupView {
	id: string;
	label: string;
	description?: string;
	swatches: SwatchView[];
}

function toView(name: SwatchName): SwatchView {
	const color = swatches[name];
	return {
		name,
		color,
		hex: color.hex,
		oklch: formatOklch(color),
		rgb: formatRgb(color),
		cssVar: varName(name),
		formula: color.description,
		formats: copyFormats(name, color),
		outOfGamut: !color.isInGamut,
		// OKLCH lightness is perceptual, so a plain threshold is a fair proxy here.
		needsDarkText: color.l > 0.6
	};
}

export const swatchViews: SwatchView[] = names.map(toView);

export const groupViews: GroupView[] = groups.map((group) => ({
	id: group.id,
	label: group.label,
	description: group.description,
	swatches: group.swatches.map(toView)
}));
