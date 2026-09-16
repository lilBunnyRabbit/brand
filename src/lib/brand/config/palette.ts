/**
 * The palette registry: two modes, one set of keys, one set of rules.
 *
 * The colours themselves live next door — `palette.dark.ts` and `palette.light.ts`, both
 * transcribed verbatim from the Chromatics scheme's export. This file holds everything that is
 * TRUE OF BOTH: which names are shades, how they group, what the modifier alphas are, and the one
 * asset colour that does not theme.
 *
 * Because both palettes carry the same 17 keys, no component takes a light variant. A light section
 * is a scope, not a fork: `[data-theme="light"]` swaps the values behind `--brand-*` and everything
 * downstream re-themes from the same rules. Anything needing a light-specific override is a sign the
 * token map is being bypassed.
 */
import type { Color } from '$lib/color';
import { dark, ladderSpan, type SwatchName } from './palette.dark';
import { light, lightLadderSpan } from './palette.light';

export { dark, light, ladderSpan, lightLadderSpan };
export type { SwatchName };

export type Palette = Record<SwatchName, Color>;
export type ThemeName = 'dark' | 'light';

/**
 * Both palettes, keyed by mode. `satisfies` is doing real work: a key present in one and missing
 * from the other is a `bun run check` failure, so the twin set cannot drift out of 1-1.
 */
export const themes = { dark, light } satisfies Record<ThemeName, Palette>;

export const themeNames = ['dark', 'light'] as const satisfies readonly ThemeName[];

/**
 * The mark's pale ears — a FIXED asset colour, byte-identical in both modes.
 *
 * Only the disc themes. It is dark's `cottontail` pinned rather than a colour of its own, so it is
 * derived from that token and cannot drift from it. Deriving light ears from `light_primary` the
 * way dark derives its own gives 1.09 on the disc against 6.06 for this, and they vanish under
 * greyscale.
 */
export const markEars = dark.cottontail.derive(
	'mark_ears',
	{},
	'Fixed. Identical in both modes. Only the disc themes.'
);

/* ── Structure — shared by both modes ───────────────────────────────────── */

/** The 7 legal page/section backgrounds, lightest to darkest. */
export const shadeNames = [
	'background_lightest',
	'background_lighter',
	'background_light',
	'background',
	'background_dark',
	'background_darker',
	'background_darkest'
] as const satisfies readonly SwatchName[];

export type ShadeName = (typeof shadeNames)[number];

/** Everything that is not a shade — i.e. everything the contract has to hold for. */
export const onShadeNames = [
	'foreground',
	'tertiary',
	'secondary',
	'primary',
	'accent',
	'cottontail',
	'success',
	'warning',
	'error',
	'info'
] as const satisfies readonly SwatchName[];

export function isShade(name: string): name is ShadeName {
	return (shadeNames as readonly string[]).includes(name);
}

/**
 * The token name as the scheme writes it, for exports and copyable code.
 *
 * The page itself uses `displayName` instead — a swatch card is read, not typed.
 */
export function tokenName(name: string, theme: ThemeName): string {
	return theme === 'light' ? `light_${name}` : name;
}

/**
 * What a swatch is CALLED, as opposed to what it is keyed by.
 *
 * The whole key, capitalised word by word: `background_lightest` is "Background Lightest", not
 * "Lightest". Shortening it to the ladder rung alone read as a different token — the shade IS a
 * background, and the card is the place that says so.
 *
 * No `light_` prefix, though: a card sitting on cream inside a light section does not need to announce
 * which mode it is in, and the machine name is one click away on the card's own copy buttons.
 */
export function displayName(name: SwatchName): string {
	return name
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export interface PaletteGroup {
	/** Anchor id, so a group is directly linkable. */
	id: string;
	label: string;
	description?: string;
	swatches: readonly SwatchName[];
}

/** Group membership is identical in both modes; only the copy differs. */
const MEMBERS = {
	surfaces: shadeNames,
	content: ['foreground'],
	brand: ['tertiary', 'secondary', 'primary', 'accent'],
	identity: ['cottontail'],
	states: ['success', 'warning', 'error', 'info']
} as const satisfies Record<string, readonly SwatchName[]>;

type GroupId = keyof typeof MEMBERS;

const COPY: Record<ThemeName, Record<GroupId, { label: string; description: string }>> = {
	dark: {
		surfaces: {
			label: 'Surfaces',
			description:
				'Seven shades of the same deep blue-grey. Any of them works as a background. Three at ' +
				'a time is plenty.'
		},
		content: { label: 'Content', description: 'For everything you read.' },
		brand: {
			label: 'Brand',
			description:
				'Four colours at the same brightness, so none of them shouts. Give them a little space ' +
				'and they get along.'
		},
		identity: {
			label: 'Identity',
			description:
				"The brightest thing here, named after the flash of a rabbit's tail. It has exactly one " +
				'job: the mark on a primary badge. Never text.'
		},
		states: {
			label: 'States',
			description: 'The familiar four. Here for reference, not decoration.'
		}
	},
	light: {
		surfaces: {
			label: 'Surfaces',
			description:
				'Seven shades of warm paper, white down to soft sand. The top rung is white because ' +
				'that is where the tint runs out, not because anyone picked it; the page is the fourth. ' +
				'Same job as the dark seven: pick one and build on it.'
		},
		content: {
			label: 'Content',
			description:
				'For everything you read. Solved to an 8:1 body ratio, a step darker than the dark text ' +
				'on purpose: on paper the text alone decides how deep the ladder goes.'
		},
		brand: {
			label: 'Brand',
			description:
				'The same four ranks, re-solved for a warm ground and sat a step above the text. The ' +
				'loud one turned orange on the way over. That story is further down.'
		},
		identity: {
			label: 'Identity',
			description:
				'The one token that changed job. Here it is a UI colour: a focus ring, a marker, a ' +
				'chart highlight. Never text, and never the logo.'
		},
		states: {
			label: 'States',
			description: 'The familiar four, darkened until they sit on paper.'
		}
	}
};

/** The groups for a mode: shared membership, mode-specific copy. */
export function groupsFor(theme: ThemeName): readonly PaletteGroup[] {
	return (Object.keys(MEMBERS) as GroupId[]).map((id) => ({
		id,
		label: COPY[theme][id].label,
		description: COPY[theme][id].description,
		swatches: MEMBERS[id]
	}));
}

/* ── Modifiers — unchanged across modes ─────────────────────────────────── */

/**
 * Interaction and de-emphasis are opacity on an existing colour, never a new colour. Composited in
 * gamma sRGB (`color-mix(in srgb, …)`), which is what a browser paints.
 */
export const modifiers = {
	hover: 0.85,
	active: 0.7,
	/**
	 * AA-large at best — captions and metadata only. Misses 3:1 on the rungs furthest from the page:
	 * dark's lightest shade, light's two deepest.
	 */
	muted: 0.65,
	/** About 2:1 in either mode. Legally exempt, but never for anything informational. */
	disabled: 0.38,
	/**
	 * The lowest alpha clearing 3:1 on EVERY shade in BOTH modes. Dark alone would settle for 0.66;
	 * light's ladder reaches deeper below its page than dark's does, and its deepest rung needs this.
	 */
	border: 0.76
} as const;

export type ModifierName = keyof typeof modifiers;
