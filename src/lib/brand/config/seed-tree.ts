/**
 * The seed tree: who comes from whom, in what words, and where each card sits. EDIT HERE.
 *
 * `palette.dark.ts` states the derivation as arithmetic. This states it as a FAMILY — six moves, each
 * one card leaving the colour it came from — so the shape of the palette is something you look at
 * rather than read. No colour values live here. The figure reads those from `themes[theme]`, which is
 * the only way this file and the swatch list cannot end up claiming different hexes.
 *
 * Three things:
 *
 *   the moves      parent, the wording that sits on the card's third line, and which axes the travel
 *                  is phased over. ONE PHASE PER AXIS: nine of these colours share a lightness, so a
 *                  straight blend between two of them spends its middle in grey mud.
 *   the layouts    WIDE is a left-to-right tree; NARROW an indented list. Two tables rather than one
 *                  figure that scales, so a phone reflows the tree instead of shrinking the type.
 *   the narration  one beat per move, in ms, so the caption keeps step with the figure.
 *
 * A hue phase carries no angle. `travelAxes` turns the shorter way round to the child's OWN hue, so
 * the wording here ("into green", "other side") cannot drift from what the palette does — and light
 * needs none of the 150.47° / 139.53° / 78.47° literals a hand-written delta table would.
 *
 * Light is not a re-run of dark's arithmetic (`palette.light.ts` says why), so its wording is its
 * own. `secondary` is the one to watch: in dark it is primary's complement, in light it is a teal at
 * 190°, because the complement of orange lands on `info`. Nothing here may say "other side" of it.
 */
import type { ColorAxis } from '$lib/color';
import { shadeNames, type SwatchName, type ThemeName } from './palette';

/**
 * The seven colours in the tree, in draw order.
 *
 * `satisfies readonly SwatchName[]` is the whole point: rename a token in the palette and this is a
 * `bun run check` error rather than a card that silently renders `undefined`.
 */
export const treeNames = [
	'background',
	'foreground',
	'primary',
	'accent',
	'secondary',
	'tertiary',
	'cottontail'
] as const satisfies readonly SwatchName[];

export type TreeName = (typeof treeNames)[number];

export interface TreeNode {
	name: TreeName;
	/** Null only for the seed. */
	parent: TreeName | null;
	/** The move, short enough to sit on the card. The seed's line says it was a choice. */
	move: string;
	/** One phase per axis, in the order they travel. Empty for the seed. */
	phases: readonly ColorAxis[];
	/** The travel window, in ms from the start of the sequence. */
	from: number;
	to: number;
}

/**
 * When each card travels.
 *
 * `secondary` and `tertiary` share a window because they are siblings off primary and the narration
 * speaks about them as a pair — two wires drawing at once is the point, not a collision.
 */
const WINDOW: Record<TreeName, readonly [number, number]> = {
	/* The seed does not travel. It appears, and everything else leaves from it. */
	background: [400, 400],
	foreground: [800, 2400],
	primary: [2400, 3700],
	accent: [3700, 4800],
	secondary: [4800, 6000],
	tertiary: [4800, 6000],
	cottontail: [6000, 7200]
};

/** The whole sequence, in ms. The last beat is the closing line, after the tree is complete. */
export const END = 8000;

type Move = Omit<TreeNode, 'from' | 'to'>;

const build = (moves: readonly Move[]): readonly TreeNode[] =>
	moves.map((move) => ({ ...move, from: WINDOW[move.name][0], to: WINDOW[move.name][1] }));

export const trees: Record<ThemeName, readonly TreeNode[]> = {
	dark: build([
		{ name: 'background', parent: null, move: 'the one choice', phases: [] },
		{
			name: 'foreground',
			parent: 'background',
			move: 'turned inside out',
			phases: ['l', 'c', 'h']
		},
		{ name: 'primary', parent: 'foreground', move: '3× · into green', phases: ['c', 'h'] },
		{ name: 'accent', parent: 'foreground', move: '4× · same hue', phases: ['c'] },
		{ name: 'secondary', parent: 'primary', move: '2× · other side', phases: ['c', 'h'] },
		{ name: 'tertiary', parent: 'primary', move: '1× · into teal', phases: ['c', 'h'] },
		{ name: 'cottontail', parent: 'primary', move: 'lifted brighter', phases: ['l', 'c'] }
	]),
	light: build([
		{ name: 'background', parent: null, move: 'the paper', phases: [] },
		{
			name: 'foreground',
			parent: 'background',
			move: 'dark enough to read',
			phases: ['l', 'c', 'h']
		},
		{
			name: 'primary',
			parent: 'foreground',
			move: '3× · into orange',
			phases: ['l', 'c', 'h']
		},
		{ name: 'accent', parent: 'foreground', move: '4× · into pink', phases: ['l', 'c', 'h'] },
		{ name: 'secondary', parent: 'primary', move: '2× · into teal', phases: ['c', 'h'] },
		{ name: 'tertiary', parent: 'primary', move: '1× · into mauve', phases: ['c', 'h'] },
		{ name: 'cottontail', parent: 'primary', move: 'pushed louder', phases: ['l', 'c'] }
	])
};

/* ── the two layouts ────────────────────────────────────────────────────── */

export interface Layout {
	/** Which one this is, for the id namespace and the media query that swaps them. */
	key: 'wide' | 'narrow';
	/** Card size, in viewBox units. */
	cardW: number;
	cardH: number;
	/** viewBox width and height. Everything below is in these units, including type. */
	viewBox: readonly [number, number];
	/** Curved wires between columns, or elbows down an indent. */
	curved: boolean;
	/** Top-left of each card. */
	pos: Record<TreeName, readonly [number, number]>;
}

/**
 * Wide: a left-to-right tree.
 *
 * With the move written ON the card, the gaps between columns only have to carry a wire — so the
 * columns close right up and the cards get the space instead. Both forks stay symmetric: foreground
 * sits midway between primary and accent, and primary midway through its own three children.
 */
const WIDE: Layout = {
	key: 'wide',
	cardW: 132,
	cardH: 76,
	viewBox: [696, 398],
	curved: true,
	pos: {
		background: [6, 212],
		foreground: [192, 212],
		primary: [378, 110],
		accent: [378, 314],
		secondary: [564, 8],
		tertiary: [564, 110],
		cottontail: [564, 212]
	}
};

/**
 * Narrow: an indented list, one card per row, the move beside each colour.
 *
 * A tree cannot reflow by shrinking — 132 units of card in a 266-unit viewBox would put the hex at
 * about 6px on a phone. Indentation carries the same parentage down the page instead, and the type
 * grows because the viewBox got smaller.
 */
const NARROW: Layout = {
	key: 'narrow',
	cardW: 190,
	cardH: 64,
	viewBox: [266, 544],
	curved: false,
	pos: {
		background: [4, 4],
		foreground: [26, 82],
		primary: [48, 160],
		secondary: [70, 238],
		tertiary: [70, 316],
		cottontail: [70, 394],
		accent: [48, 472]
	}
};

/** Both, rendered together and swapped in CSS — so the reflow needs no JavaScript and no observer. */
export const layouts: readonly Layout[] = [WIDE, NARROW];

/** The wire a card travels along, parent's edge to child's edge. */
export function wirePath(layout: Layout, parent: TreeName, child: TreeName): string {
	const [ax, ay] = layout.pos[parent];
	const [bx, by] = layout.pos[child];
	const y2 = by + layout.cardH / 2;

	if (layout.curved) {
		const x1 = ax + layout.cardW;
		const y1 = ay + layout.cardH / 2;
		const mx = (x1 + bx) / 2;
		return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${bx} ${y2}`;
	}

	/* An elbow dropped from inside the parent's own left edge, so the wires nest as they indent. */
	const sx = ax + 16;
	return `M${sx} ${ay + layout.cardH} L${sx} ${y2} L${bx} ${y2}`;
}

/* ── the narration ──────────────────────────────────────────────────────── */

/**
 * One beat per move.
 *
 * Split into three parts rather than held as one string with markup in it: the middle part is the
 * one that gets emphasised, and a sentence that has to be parsed to be rendered is a sentence that
 * can be got wrong. `tail` is empty on the beats that end on their emphasis.
 */
export interface Beat {
	from: number;
	to: number;
	lead: string;
	strong: string;
	tail: string;
}

export const beats: Record<ThemeName, readonly Beat[]> = {
	dark: [
		{
			from: 0,
			to: 800,
			lead: 'One colour. ',
			strong: 'The dark blue-green',
			tail: ' everything else is worked out from.'
		},
		{
			from: 800,
			to: 2400,
			lead: 'The text colour is that seed ',
			strong: 'turned inside out',
			tail: ': as light as the seed is dark.'
		},
		{
			from: 2400,
			to: 3700,
			lead: 'primary leaves the text colour ',
			strong: 'three times stronger',
			tail: ', and turns into the greens.'
		},
		{
			from: 3700,
			to: 4800,
			lead: 'accent goes further, ',
			strong: 'four times stronger',
			tail: ', staying on the same hue.'
		},
		{
			from: 4800,
			to: 6000,
			lead: 'secondary and tertiary both come off primary, ',
			strong: 'each one quieter',
			tail: ' than the last.'
		},
		{
			from: 6000,
			to: 7200,
			lead: 'cottontail is primary again, ',
			strong: 'lifted',
			tail: ' until it is the brightest thing here. The logo colour.'
		},
		{
			from: 7200,
			to: END,
			lead: 'Seven colours, six moves. ',
			strong: 'The only real decision was the first one.',
			tail: ''
		}
	],
	light: [
		{
			from: 0,
			to: 800,
			lead: 'One colour. ',
			strong: 'The warm paper',
			tail: ' everything else sits on.'
		},
		{
			from: 800,
			to: 2400,
			lead: 'The text colour sits opposite the paper on the wheel, ',
			strong: 'exactly as dark as an 8:1 body needs',
			tail: '.'
		},
		{
			from: 2400,
			to: 3700,
			lead: 'primary leaves the text colour a step lighter and ',
			strong: 'three times stronger',
			tail: ', and turns into the oranges.'
		},
		{
			from: 3700,
			to: 4800,
			lead: 'accent goes further, ',
			strong: 'four times stronger',
			tail: ', round into the pinks.'
		},
		{
			from: 4800,
			to: 6000,
			lead: 'secondary and tertiary both come off primary, ',
			strong: 'each one quieter',
			tail: ' than the last.'
		},
		{
			from: 6000,
			to: 7200,
			lead: 'cottontail is primary again, ',
			strong: 'pushed to all the chroma',
			tail: ' the gamut allows. A UI colour here, never the logo.'
		},
		{
			from: 7200,
			to: END,
			lead: 'Seven colours, six moves. ',
			strong: 'The same shape as dark, different answers.',
			tail: ''
		}
	]
};

/* ── the two strips ─────────────────────────────────────────────────────── */

/** The four states, which are not in the tree because their hue is a convention, not a move. */
const STATES = ['success', 'warning', 'error', 'info'] as const satisfies readonly SwatchName[];

export interface Strip {
	id: string;
	label: string;
	swatches: readonly SwatchName[];
	/** Name on the swatch. The ladder is a ramp; labelling each rung of it says nothing. */
	named: boolean;
}

const STRIP_LABELS: Record<ThemeName, { states: string; surfaces: string }> = {
	dark: {
		states: 'Status colours: the hue is a convention, not a derivation',
		surfaces: 'Surfaces: the seed, lightened and darkened'
	},
	light: {
		states: 'Status colours: the hue is a convention, not a derivation',
		surfaces: 'Surfaces: the paper, lightened and darkened'
	}
};

/**
 * What sits under the figure: the ten colours the tree leaves out, and why they are not in it.
 *
 * `shadeNames` rather than a second list of seven, so the ladder cannot end up in a different order
 * here than in the palette.
 */
export function stripsFor(theme: ThemeName): readonly Strip[] {
	return [
		{ id: 'states', label: STRIP_LABELS[theme].states, swatches: STATES, named: true },
		{ id: 'surfaces', label: STRIP_LABELS[theme].surfaces, swatches: shadeNames, named: false }
	];
}
