/**
 * The ONLY module that constructs internal hrefs.
 *
 * Everything here is prefixed with `base` from `$app/paths`. The reason is a bug already shipped in
 * a sibling project: `colors/src/routes/+page.svelte:126` writes `href="/demo"`, which under
 * `BASE_PATH=/colors` resolves to `<user>.github.io/demo` — a 404. Deployed navigation between its
 * two pages is broken to this day.
 *
 * The guide is a single page, so these are section anchors rather than routes. They still go
 * through `base`: a bare `href="#colours"` would work, but the section list also feeds the "skip
 * to" affordances and needs to be absolute-resolvable.
 */
import { base } from '$app/paths';

export interface SectionLink {
	id: string;
	href: string;
	label: string;
}

/**
 * One entry for the whole light region, not one per light section. The strip already carries six on a
 * 360px screen; four more would turn it into a scroller nobody reads to the end of. The light region
 * has its own internal headings for anyone who lands mid-way.
 */
const SECTIONS = [
	{ id: 'colours', label: 'Colour' },
	{ id: 'idea', label: 'Idea' },
	{ id: 'logo', label: 'Logo' },
	{ id: 'wordmark', label: 'Name' },
	{ id: 'type', label: 'Type' },
	{ id: 'card', label: 'Card' },
	{ id: 'rules', label: "Don't" },
	{ id: 'light', label: 'Light' },
	{ id: 'assets', label: 'Assets' }
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const sectionIds: readonly SectionId[] = SECTIONS.map((s) => s.id);

/** Section anchors, base-prefixed. */
export function sections(): SectionLink[] {
	return SECTIONS.map((s) => ({ ...s, href: `${base}/#${s.id}` }));
}

/** The page root. */
export function home(): string {
	return `${base}/`;
}

/**
 * The machine-readable guide — prerendered from `src/routes/llms.txt/+server.ts` at build time,
 * so its palette tables are generated from the config rather than hand-maintained.
 *
 * A real file rather than an anchor, so it needs `base` for exactly the reason at the top of this
 * file — under `BASE_PATH=/brand` a bare `/llms.txt` is a 404. `src/app.html` points a
 * `<link rel="alternate">` at the same file for anything that discovers it without reading the page.
 */
export function llmsTxt(): string {
	return `${base}/llms.txt`;
}
