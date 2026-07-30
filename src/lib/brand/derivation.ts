/**
 * The derivation plot's data — every coordinate computed from `config/palette.ts`.
 *
 * Nothing here is hand-written. Move the seed and the whole figure moves with it, which is the only
 * way a diagram claiming "nothing was picked by hand" can be honest.
 *
 * Two scales:
 *   x  chroma, counted in SEEDS (multiples of the seed's own chroma). The brand colours land on
 *      1, 2, 3, 4 and the states on 6, so integer multiples become even spacing on a real axis.
 *   y  lightness, inverted so lighter is higher.
 *
 * Padding of 0.3 seeds and 0.02 lightness keeps a focused node's ring inside the clipped panel.
 */
import { contrastRatio } from '$lib/color';
import { onShadeNames, shadeNames, swatches, type SwatchName } from './config/palette';

const SEED = swatches.background.c;

const X_MIN = -0.3;
const X_MAX = 7;
const Y_MIN = 0.1;
const Y_MAX = 1.02;

/** Chroma in seeds → percent across. */
export function xOf(chroma: number): number {
	return ((chroma / SEED - X_MIN) / (X_MAX - X_MIN)) * 100;
}

/** Lightness → percent down. */
export function yOf(lightness: number): number {
	return ((Y_MAX - lightness) / (Y_MAX - Y_MIN)) * 100;
}

/** Where the ray through the origin would cross the bottom edge, for drawing it. */
export const ORIGIN = { x: xOf(0), y: yOf(0) };

export interface PlotNode {
	name: SwatchName;
	hex: string;
	/** Percent across / down. */
	x: number;
	y: number;
	/** Chroma in seeds, rounded for display. */
	seeds: number;
	hue: number;
	lightness: number;
	/** How many other colours share this lightness. */
	sameLightness: number;
	/** Other colours at this exact hue. */
	sameHue: SwatchName[];
	/** Other colours at this exact chroma. */
	sameChroma: SwatchName[];
	/** One short sentence: how this colour is reached. */
	how: string;
	/** Fraction of the sRGB chroma available at its lightness and hue. */
	gamutUse: number;
}

const HOW: Record<SwatchName, string> = {
	background: 'The seed. Everything else is a formula against this one.',
	bg_lightest: 'A full span up. Chroma rises with it, in proportion.',
	bg_lighter: 'Two thirds of a span up.',
	bg_light: 'One third of a span up.',
	bg_dark: 'One third of a span down.',
	bg_darker: 'Two thirds of a span down.',
	bg_darkest: 'A full span down. Chroma falls with it.',
	foreground:
		'The seed, inside out. Lightness flipped, chroma cut to a third, hue turned right around.',
	tertiary: 'One seed of chroma — exactly what the background carries. The quiet one.',
	secondary: 'Primary, straight across. Two seeds.',
	primary: "Foreground's lightness, three seeds of chroma, 72° round from it.",
	accent: "Foreground's hue, twelve times louder.",
	cottontail:
		'Primary, lifted two spans, at 60% of what sRGB allows. Ink for the badge, never text.',
	success: 'Six seeds of chroma. The hue is a convention, not a derivation.',
	warning: 'Six seeds of chroma, on the amber convention.',
	error: 'Six seeds, and the darkest thing on the rail. It sized the whole ladder.',
	info: 'Six seeds. At this hue that is almost everything sRGB has — the reason there is no 7c.'
};

const ALL = Object.keys(swatches) as SwatchName[];
const near = (a: number, b: number, tol = 1e-4) => Math.abs(a - b) < tol;

function toNode(name: SwatchName): PlotNode {
	const c = swatches[name];
	const boundary = c.atLightness(c.l).maxChroma;
	return {
		name,
		hex: c.hex,
		x: xOf(c.c),
		y: yOf(c.l),
		seeds: Number((c.c / SEED).toFixed(4)),
		hue: c.h,
		lightness: c.l,
		sameLightness: ALL.filter((n) => n !== name && near(swatches[n].l, c.l)).length,
		sameHue: ALL.filter((n) => n !== name && near(swatches[n].h, c.h, 0.01)),
		sameChroma: ALL.filter((n) => n !== name && near(swatches[n].c, c.c, 1e-5)),
		how: HOW[name],
		gamutUse: boundary > 0 ? c.c / boundary : 0
	};
}

/** The seven shades, lightest first. They are collinear with the origin. */
export const ladder: PlotNode[] = shadeNames.map(toNode);

/** The nine colours sharing lightness 0.745 — the rail. */
export const railNames = onShadeNames.filter((n) => n !== 'cottontail');

/** Individually plotted nodes: everything except the four states, which share one coordinate. */
export const soloNodes: PlotNode[] = [
	...ladder,
	...(['foreground', 'tertiary', 'secondary', 'primary', 'accent', 'cottontail'] as const).map(
		toNode
	)
];

/** The four states, drawn as one node cut into four because they ARE one coordinate. */
export const stateNodes: PlotNode[] = (['error', 'warning', 'success', 'info'] as const).map(
	toNode
);

export const stateCluster = {
	x: stateNodes[0].x,
	y: stateNodes[0].y,
	seeds: stateNodes[0].seeds
};

/** Every node, for the readout and the tests. */
export const allNodes: PlotNode[] = [...soloNodes, ...stateNodes];

export interface Arc {
	id: string;
	from: SwatchName;
	to: SwatchName;
	label: string;
	/** How far below the rail the arc dips, in percent. Nested so none of them cross. */
	depth: number;
}

/**
 * The hue turns, all four springing from `primary` or landing on it — which is how the figure shows
 * that primary is the hub and the siblings are rotations off it. Depths are staggered so the arcs
 * nest rather than intersect.
 */
export const arcs: Arc[] = [
	{ id: 'primary-accent', from: 'primary', to: 'accent', label: '−72°', depth: 12 },
	{ id: 'primary-secondary', from: 'primary', to: 'secondary', label: '+180°', depth: 17 },
	{ id: 'primary-tertiary', from: 'primary', to: 'tertiary', label: '−120°', depth: 23 },
	{ id: 'foreground-primary', from: 'foreground', to: 'primary', label: '+72°', depth: 30 }
];

const byName = new Map(allNodes.map((n) => [n.name, n]));

export function arcPath(arc: Arc): string {
	const a = byName.get(arc.from)!;
	const b = byName.get(arc.to)!;
	const mid = (a.x + b.x) / 2;
	return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} Q${mid.toFixed(2)} ${(a.y + arc.depth * 2).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function arcLabelAt(arc: Arc): { x: number; y: number } {
	const a = byName.get(arc.from)!;
	const b = byName.get(arc.to)!;
	return { x: (a.x + b.x) / 2, y: a.y + arc.depth };
}

/** The rail: y, and the x span it needs to cover. */
export const rail = {
	y: byName.get('primary')!.y,
	x1: Math.min(...railNames.map((n) => byName.get(n)!.x)) - 4,
	x2: 96
};

/** The empty 5c rung, sitting between accent (4c) and the states (6c). */
export const vacancy = { x: xOf(SEED * 5), label: '5c — empty on purpose.' };

/**
 * Where sRGB runs out at the rail's lightness. `info`'s hue is the tightest, so this is the wall
 * that makes 7c impossible rather than merely unused.
 */
const infoNode = byName.get('info')!;
export const wall = {
	x: xOf(swatches.info.atLightness(swatches.info.l).maxChroma),
	/** What share of the available chroma 6c already spends, at that hue. */
	use: infoNode.gamutUse
};

/** Proof for the tests and the caption: every shade sits at the same fraction of the gamut. */
export const ladderGamutFractions = ladder.map((n) => Number(n.gamutUse.toFixed(4)));

/** The tightest colour on the rail — the one that sized the ladder. */
export const hardestOnRail = railNames
	.map((n) => ({ name: n, ratio: contrastRatio(swatches[n], swatches.bg_lightest) }))
	.reduce((a, b) => (b.ratio < a.ratio ? b : a));
