/**
 * The live scheme, framed at the end of the guide.
 *
 * The palette is authored in Chromatics — `palette.dark.ts` and `palette.light.ts` are transcripts
 * of its export — so the guide can end on the real thing rather than a picture of it. Chromatics'
 * `/showcase` is the read-only view of a scheme, and the whole scheme travels in the URL: the `~2`
 * payload after the `#` is a deflated `{ source, settings }` blob, some 7KB of it.
 *
 * TO SWAP THE SCHEME, replace one file — never this one:
 *
 *     pbpaste > src/lib/brand/config/chromatics-link.txt
 *
 * Anything Chromatics hands out will do — a Share link, a showcase URL, or the whole iframe
 * snippet from Export → Embed. All three carry the payload in the hash and `hashOf` takes only
 * that; everything around it is thrown away. That is deliberate. The presentation knobs below are
 * this page's call rather than the link's: the frame lands inside the light region, so its chrome
 * has to be light, and a brand guide shows a scheme rather than handing out an editor. Pasting a
 * link that was saved with different knobs cannot quietly change either.
 *
 * The payload is the one part that is Chromatics' to own, so the link file holds exactly that and
 * nothing else — no quoting, no escaping, no 7000-character line in a TypeScript module.
 */
import link from './chromatics-link.txt?raw';

import { meta } from './meta';

/**
 * Where Chromatics is published, and the only origin whose height messages the embed will act on.
 * Same host as this site, different project — `lilbunnyrabbit.github.io/chromatics`.
 */
const origin = 'https://lilbunnyrabbit.github.io';
const path = '/chromatics/showcase';

/**
 * What Chromatics reads off the query string. Only the knobs that differ from its defaults are
 * listed; `views`, `chrome` and `autoheight` are left where they are.
 *
 *   tab=styleguide  land on the design system, not the DSL source — the derivation is already
 *                   this page's job, and the tab strip still offers the source to anyone curious
 *   theme=light     the frame sits in the light region, and a dark slab there reads as a bug
 *   edit=none       locked, with no edit affordance. A fork is not saved anywhere, but a brand
 *                   guide that invites you to retint the palette is arguing with itself
 */
const knobs: Record<string, string> = {
	tab: 'styleguide',
	theme: 'light',
	edit: 'none'
};

/**
 * The payload, and only the payload, out of whatever was pasted.
 *
 * Matched rather than sliced at the `#`, because Export → Embed hands out an iframe TAG, not a
 * URL — slicing would take `…" title="…"` along with the scheme. The shape is fixed: a `~`
 * sentinel, one version digit, then base64url until the first character that cannot be part of it,
 * which is the closing quote in a snippet and the end of the line in a bare link.
 *
 * Whitespace goes first, and all of it rather than just the ends: this is one very long line, and
 * an editor that soft-wraps on save would otherwise fold newlines into the middle of the base64
 * and break the deflate stream.
 */
export function hashOf(raw: string): string {
	return /~[0-3][A-Za-z0-9_-]+/.exec(raw.replace(/\s+/g, ''))?.[0] ?? '';
}

/** `<origin>/chromatics/showcase?<knobs>#<payload>` — hash last, or the query would swallow it. */
export function showcaseUrl(raw: string): string {
	const query = new URLSearchParams(knobs).toString();
	const hash = hashOf(raw);
	return `${origin}${path}?${query}${hash ? `#${hash}` : ''}`;
}

export const chromatics = {
	origin,
	url: showcaseUrl(link),
	/** Iframes need one; this one says whose colours and in what. */
	title: `${meta.name} colours, live in Chromatics`,
	/**
	 * The height to hold before the frame reports its own — the same figure Chromatics' own embed
	 * snippet starts from. It is a floor, not a guess at the content: the frame posts its real
	 * height on load and on every tab switch.
	 */
	height: 720
};
