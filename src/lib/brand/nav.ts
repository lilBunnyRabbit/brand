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
 * The page's outline, in order: every section, its two-digit index, and whether it sits in the header
 * strip. One list, so the index printed on a section head, the strip and the desktop rail cannot
 * disagree about what "09" is.
 *
 * The strip carries one entry for the whole light region, not one per light section. It already holds
 * six on a 360px screen; four more would turn it into a scroller nobody reads to the end of. The rail
 * has room for all thirteen, and that is its job.
 */
const OUTLINE = [
	{ id: 'colours', label: 'Colour', strip: true },
	{ id: 'idea', label: 'Idea', strip: true },
	{ id: 'logo', label: 'Logo', strip: true },
	{ id: 'wordmark', label: 'Name', strip: true },
	{ id: 'type', label: 'Type', strip: true },
	{ id: 'card', label: 'Card', strip: true },
	{ id: 'rules', label: "Don't", strip: true },
	{ id: 'light', label: 'Light', strip: true },
	{ id: 'light-colour', label: 'Twins', strip: false },
	{ id: 'light-orange', label: 'Orange', strip: false },
	{ id: 'light-logo', label: 'Mark on paper', strip: false },
	{ id: 'live', label: 'Live', strip: false },
	{ id: 'assets', label: 'Assets', strip: true }
] as const;

export type SectionId = (typeof OUTLINE)[number]['id'];

export interface OutlineEntry extends SectionLink {
	id: SectionId;
	/** Two digits, page order: what the section head prints and the rail lists. */
	index: string;
}

export const sectionIds: readonly SectionId[] = OUTLINE.filter((s) => s.strip).map((s) => s.id);

/** Every section, base-prefixed and numbered. */
export function outline(): OutlineEntry[] {
	return OUTLINE.map((s, i) => ({
		id: s.id,
		label: s.label,
		index: String(i + 1).padStart(2, '0'),
		href: `${base}/#${s.id}`
	}));
}

/** The header strip: the outline minus the light region's inner sections. */
export function sections(): SectionLink[] {
	return outline().filter((s) => sectionIds.includes(s.id));
}

export function sectionIndex(id: SectionId): string {
	return String(OUTLINE.findIndex((s) => s.id === id) + 1).padStart(2, '0');
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
