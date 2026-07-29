/**
 * Pure string transforms for the brand SVGs.
 *
 * These run at prerender time (no DOM available) and under `bun test`, so everything here is
 * regex over source text rather than DOM manipulation. That is a deliberate constraint, not a
 * shortcut: the same code has to work in Node during `vite build` and in the browser.
 *
 * Every transform exists because a real export needed it, not on principle:
 *
 *   - Design tools emit GENERIC ids — `top-mask`, `svg1`, `path5-1-93-3-1-8`. Inline two files on
 *     one page and the second's `url(#top-mask)` resolves to the FIRST one's mask, because the
 *     browser takes the first match in document order. It renders the wrong art under the right
 *     label, silently. Substitution is longest-id-first, or `path5-1-93-3-1-8` corrupts
 *     `path5-1-93-3-1-8-4`. -> `namespaceIds`
 *   - Roots carry absolute sizes (`199.28448mm`, `30%`) that stop CSS from sizing the mark, and a
 *     `style="color: ..."` that outranks the inherited `color` which `fill="currentColor"` reads.
 *     -> `stripRootSize`, `stripRootColor`
 *   - Inkscape paints a solid mark as `style="...;fill:#ffffff;..."` with no `currentColor` at all,
 *     which is invisible on any surface matching its own fill. A single-colour file converts
 *     losslessly; a multi-colour one must not be touched. -> `toCurrentColor`
 *   - Line 1 is `<?xml version="1.0" ...?>`, invalid inside HTML and rendered as visible text.
 *     -> `stripXmlProlog`
 *   - Comments are not markup. `<!-- Created with Inkscape -->` is in every export, and a comment
 *     that happens to mention `<animate` would make a static mark report as animated.
 *     -> `stripComments`
 *   - SMIL-animated masks rasterise to an arbitrary mid-draw frame, and a mask can be authored
 *     fully HIDDEN (non-zero `stroke-dashoffset`) so that only its `<animate>` reveals it —
 *     dropping the animation without rewriting the offset silently loses that stroke.
 *     -> `freezeAnimation`
 */

/** Tags whose presence means the element is animated. */
const ANIMATION_TAGS = ['animate', 'animateTransform', 'animateMotion', 'set'] as const;

/**
 * Drop comments.
 *
 * Every analysis function below runs on the comment-stripped text, because a comment is not
 * markup and must not be read as if it were. This is not hypothetical: Inkscape puts
 * `<!-- Created with Inkscape ... -->` in every export, and design tools annotate paths with
 * measurements. A comment mentioning `<animate` or `currentColor` would otherwise make a static
 * mark report as animated, or inflate the paint count.
 *
 * Also applied to the inlined output, where comments are pure weight — they are repeated once per
 * copy of the mark on the page and mean nothing to the DOM.
 */
export function stripComments(raw: string): string {
	return raw.replace(/<!--[\s\S]*?-->/g, '');
}

/** Matches an element's opening tag. Attribute values containing `>` would break this; none do. */
const OPEN_TAG = /<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

export interface ViewBox {
	minX: number;
	minY: number;
	width: number;
	height: number;
	/** width / height */
	aspect: number;
}

export interface SvgAudit {
	hasSvgRoot: boolean;
	viewBox: ViewBox | null;
	/** Root width/height attributes as authored, before stripping. */
	rootWidth: string | null;
	rootHeight: string | null;
	/** Number of `fill|stroke="currentColor"` occurrences. */
	currentColorCount: number;
	/** Literal colors found in attributes and inline styles, deduped, lowercased. */
	hardcodedColors: string[];
	/**
	 * Distinct literal colors used as actual PAINT (`fill:` / `stroke:`), deduped, lowercased.
	 * Narrower than `hardcodedColors`, which also catches inert things like `stop-color`.
	 */
	paintColors: string[];
	/** Exactly one paint color, so it can be safely converted to `currentColor`. */
	monochrome: boolean;
	/** A root `style` `color:` declaration blocks inherited color from reaching currentColor. */
	rootColorLocked: boolean;
	ids: string[];
	/** Ids referenced but never declared — a broken file, or one that expects an outer sprite. */
	danglingRefs: string[];
	animated: boolean;
	animationDurations: string[];
	bytes: number;
	/** Whether a <script> or on* handler was found and removed. Should always be false. */
	hadScript: boolean;
}

/* ────────────────────────────── inline safety ────────────────────────────── */

/**
 * Drop the XML declaration and any DOCTYPE.
 *
 * Required before `{@html}`: `<?xml ...?>` is a processing instruction, not HTML, and browsers
 * surface it as visible text.
 */
export function stripXmlProlog(raw: string): string {
	return raw
		.replace(/^﻿/, '')
		.replace(/<\?xml[\s\S]*?\?>/g, '')
		.replace(/<!DOCTYPE[^>]*>/gi, '')
		.replace(/^\s+/, '');
}

/**
 * Remove `<script>` elements and `on*` event-handler attributes.
 *
 * These files are our own, committed to this repo and inlined by Vite at build time — they are
 * source code, at the same trust tier as a `.svelte` file, so this is NOT a sanitizer and must
 * not be relied on as one. It exists to make an accidental paste of a third-party SVG fail
 * loudly in the audit rather than quietly gain script execution.
 */
export function stripScripting(raw: string): { svg: string; hadScript: boolean } {
	const before = raw;
	const svg = raw
		.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
		.replace(/<script\b[^>]*\/>/gi, '')
		.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
	return { svg, hadScript: svg !== before };
}

/* ────────────────────────────── root presentation ────────────────────────────── */

/**
 * Strip the root `<svg>`'s `width`/`height` so CSS controls the rendered size.
 *
 * `viewBox` is preserved — without it the stripped mark has no intrinsic aspect ratio at all.
 * Only the ROOT tag is touched: inner `width`/`height` (on masks, rects) are load-bearing.
 */
export function stripRootSize(raw: string): string {
	return replaceRootTag(raw, (attrs) =>
		attrs
			.replace(/\swidth\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
			.replace(/\sheight\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
	);
}

/**
 * Remove the root `color` / `background-color` style declarations.
 *
 * The `color` one is what unlocks `fill="currentColor"` for theming. `background-color` goes too:
 * a mark that paints its own backdrop can't be previewed against the palette, which is the whole
 * point of the background matrix.
 *
 * Kept separate from `stripRootSize` because a standalone file — the favicon — wants its size
 * stripped but its color KEPT. Outside a document `currentColor` falls back to the initial value,
 * black, which is invisible on a dark browser chrome.
 */
export function stripRootColor(raw: string): string {
	return replaceRootTag(raw, (attrs) =>
		attrs.replace(/\sstyle\s*=\s*"([^"]*)"/i, (_m, style: string) => {
			const kept = style
				.split(';')
				.map((d) => d.trim())
				.filter((d) => d.length > 0)
				.filter((d) => !/^(color|background-color|background)\s*:/i.test(d));
			return kept.length ? ` style="${kept.join('; ')}"` : '';
		})
	);
}

/** Both of the above: what an inlined, themeable mark needs. */
export function stripRootPresentation(raw: string): string {
	return stripRootColor(stripRootSize(raw));
}

/* ────────────────────────────── paint ────────────────────────────── */

/** Values that appear in a paint slot but are not a literal color. */
const NON_COLOR_PAINT = /^(none|currentcolor|inherit|transparent|context-fill|context-stroke)$/i;

/** Matches a `fill=` / `stroke=` presentation attribute. */
const PAINT_ATTR = /\s(fill|stroke)\s*=\s*"([^"]*)"/g;

/**
 * Matches a `fill:` / `stroke:` declaration inside a style string.
 *
 * The `(?!-)` is load-bearing: an Inkscape export is full of `fill-opacity`, `stroke-width`,
 * `stroke-linecap` and friends, none of which are paint. It also excludes `stop-color`, which is
 * a gradient stop rather than paint — counting that would make a one-color Inkscape file look
 * two-coloured and silently disqualify it from recolouring.
 */
const PAINT_DECL = /\b(fill|stroke)(?!-)\s*:\s*([^;"']+)/g;

function isLiteralColor(value: string): boolean {
	const v = value.trim();
	if (v === '' || NON_COLOR_PAINT.test(v) || v.startsWith('url(')) return false;
	return /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\()/i.test(v);
}

/** Distinct literal paint colors, lowercased. */
export function collectPaintColors(raw: string): string[] {
	const src = stripComments(raw);
	const found = new Set<string>();

	for (const m of src.matchAll(PAINT_ATTR)) {
		if (isLiteralColor(m[2])) found.add(m[2].trim().toLowerCase());
	}
	for (const m of src.matchAll(/\sstyle\s*=\s*"([^"]*)"/g)) {
		for (const d of m[1].matchAll(PAINT_DECL)) {
			if (isLiteralColor(d[2])) found.add(d[2].trim().toLowerCase());
		}
	}

	return [...found];
}

/**
 * Convert a monochrome mark's paint to `currentColor` so CSS can drive its ink.
 *
 * A no-op unless the file paints in exactly ONE literal color. That guard is the whole point: a
 * full-colour mark must keep its colours, and flattening it would be destructive. But a
 * single-colour export — which is what Inkscape produces for a solid mark, as
 * `style="…;fill:#ffffff;…"` — is losslessly convertible, and without it the mark is
 * invisible on any surface matching its own fill.
 *
 * Preferred over asking the designer to hand-edit each export, because the next export from
 * Inkscape would silently lose the edit.
 */
export function toCurrentColor(raw: string): { svg: string; converted: boolean } {
	const colors = collectPaintColors(raw);
	if (colors.length !== 1) return { svg: raw, converted: false };
	const target = colors[0];

	const svg = raw
		.replace(PAINT_ATTR, (match, prop: string, value: string) =>
			value.trim().toLowerCase() === target ? ` ${prop}="currentColor"` : match
		)
		.replace(/\sstyle\s*=\s*"([^"]*)"/g, (match, style: string) => {
			const next = style.replace(PAINT_DECL, (decl, prop: string, value: string) =>
				value.trim().toLowerCase() === target ? `${prop}:currentColor` : decl
			);
			return next === style ? match : ` style="${next}"`;
		});

	return { svg, converted: svg !== raw };
}

/* ────────────────────────────── id namespacing ────────────────────────────── */

/** All `id="..."` values in document order, deduped. */
export function collectIds(raw: string): string[] {
	const src = stripComments(raw);
	const ids = new Set<string>();
	for (const m of src.matchAll(/\sid\s*=\s*"([^"]*)"/g)) ids.add(m[1]);
	for (const m of src.matchAll(/\sid\s*=\s*'([^']*)'/g)) ids.add(m[1]);
	return [...ids];
}

/** Ids referenced via `url(#x)`, `href="#x"` or `xlink:href="#x"`. */
export function collectRefs(raw: string): string[] {
	const src = stripComments(raw);
	const refs = new Set<string>();
	for (const m of src.matchAll(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g)) refs.add(m[1]);
	for (const m of src.matchAll(/(?:xlink:)?href\s*=\s*["']#([^"']+)["']/g)) refs.add(m[1]);
	return [...refs];
}

/** Make a prefix safe for use in a fragment identifier and a CSS selector. */
export function sanitizePrefix(prefix: string): string {
	const cleaned = prefix.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	// An id starting with a digit is legal in HTML but needs escaping in a CSS selector.
	return /^[0-9]/.test(cleaned) ? `id-${cleaned}` : cleaned || 'svg';
}

/**
 * Remove `id` attributes that nothing references.
 *
 * Design tools label everything — Inkscape emits `id="svg1"`, `id="defs1"`,
 * `id="path5-1-93-3-1-8"` whether or not anything points at them. Those ids are dead weight, and
 * worse: the same mark is rendered several times on one page (three background tiles, the header,
 * the hero), so every unreferenced id becomes a duplicate-id validity error multiplied by the
 * number of copies.
 *
 * Dropping them means a mark with no internal references — most marks — is safe to inline any
 * number of times with no per-instance work at all. Marks that DO use masks or gradients keep
 * their ids and go through `instantiateSvg` instead.
 */
export function dropUnusedIds(raw: string): string {
	const referenced = new Set(collectRefs(raw));
	return raw.replace(/\sid\s*=\s*(["'])([^"']*)\1/g, (match, _q, id: string) =>
		referenced.has(id) ? match : ''
	);
}

/**
 * Make one already-prepared mark safe to render more than once on a page.
 *
 * `prepareSvg` namespaces by FILE, which stops two different variants colliding. It does not stop
 * the same variant colliding with itself, and this page renders the mark five times. Call this per
 * render site with a key unique to that site — Svelte's `$props.id()` plus a slot name.
 *
 * Fast path: after `dropUnusedIds` most marks carry no ids at all, so this returns immediately.
 */
export function instantiateSvg(prepared: string, key: string): string {
	return collectIds(prepared).length === 0 ? prepared : namespaceIds(prepared, key);
}

/**
 * Rewrite every internal id to `<prefix>__<id>` and update every reference to it.
 *
 * Ids are substituted LONGEST FIRST. With `filter_1_2` and `filter_1_20` present, rewriting the
 * shorter one first would corrupt the longer one's name into `p__filter_1_2` + `0`. The current
 * marks have no such overlap, but a future export from a design tool very likely will.
 *
 * Known limitation: SMIL syncbase timing (`begin="otherAnim.end"`) references an element id
 * without `#`, so it is not rewritten. None of the marks use it; `auditSvg` does not flag it.
 */
export function namespaceIds(raw: string, prefix: string): string {
	const safe = sanitizePrefix(prefix);
	const ids = collectIds(raw).sort((a, b) => b.length - a.length);
	if (ids.length === 0) return raw;

	let out = raw;
	for (const id of ids) {
		const q = escapeRegExp(id);
		const next = `${safe}__${id}`;
		out = out
			.replace(new RegExp(`(\\sid\\s*=\\s*)(["'])${q}\\2`, 'g'), `$1$2${next}$2`)
			.replace(new RegExp(`(url\\(\\s*)(['"]?)#${q}\\2(\\s*\\))`, 'g'), `$1$2#${next}$2$3`)
			.replace(new RegExp(`((?:xlink:)?href\\s*=\\s*)(["'])#${q}\\2`, 'g'), `$1$2#${next}$2`);
	}
	return out;
}

/* ────────────────────────────── animation ────────────────────────────── */

/** True if the source contains any SMIL animation element. */
export function isAnimated(raw: string): boolean {
	const src = stripComments(raw);
	return ANIMATION_TAGS.some((tag) => new RegExp(`<${tag}\\b`).test(src));
}

/** Every `dur="..."` value, deduped, in document order. */
export function animationDurations(raw: string): string[] {
	const out = new Set<string>();
	for (const m of stripComments(raw).matchAll(/\sdur\s*=\s*["']([^"']+)["']/g)) out.add(m[1]);
	return [...out];
}

/**
 * Produce the static, fully-drawn form: remove the SMIL animation elements, then set
 * `stroke-dashoffset="0"` on every element that carries a `stroke-dasharray`.
 *
 * Zeroing the offset is what "fully drawn" means *for this construction*: the marks use
 * `stroke-dasharray="L L"` where L is the path length, so offset 0 puts the dash over
 * [0, L] — the whole path — and any multiple of L slides a gap over it instead.
 *
 * The second step is not optional. `bottom-right-mask` is authored at
 * `stroke-dashoffset="21.52..."`, i.e. fully hidden, and only its `<animate>` ever brings it
 * into view. Removing the animation without rewriting the offset silently drops that third of
 * the mark — which is exactly what a favicon or a raster export would then ship.
 */
export function freezeAnimation(raw: string): string {
	let out = raw;

	for (const tag of ANIMATION_TAGS) {
		out = out
			.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'g'), '')
			.replace(new RegExp(`<${tag}\\b(?:"[^"]*"|'[^']*'|[^>"'])*?\\/>`, 'g'), '');
	}

	out = out.replace(OPEN_TAG, (match, tag: string, attrs: string, selfClose: string) => {
		if (!/\sstroke-dasharray\s*=/.test(attrs)) return match;
		const next = /\sstroke-dashoffset\s*=/.test(attrs)
			? attrs.replace(
					/\sstroke-dashoffset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
					' stroke-dashoffset="0"'
				)
			: `${attrs} stroke-dashoffset="0"`;
		return `<${tag}${next}${selfClose}>`;
	});

	return collapseBlankLines(out);
}

/* ────────────────────────────── geometry ────────────────────────────── */

/** Parse the root `viewBox`. Returns null when absent or malformed. */
export function parseViewBox(raw: string): ViewBox | null {
	const m = stripComments(raw).match(/\sviewBox\s*=\s*["']([^"']+)["']/i);
	if (!m) return null;
	const parts = m[1]
		.trim()
		.split(/[\s,]+/)
		.map(Number);
	if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
	const [minX, minY, width, height] = parts;
	if (width <= 0 || height <= 0) return null;
	return { minX, minY, width, height, aspect: width / height };
}

/* ────────────────────────────── audit ────────────────────────────── */

const COLOR_LITERAL =
	/#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(\s*[^)]*\)/gi;

/** Everything the UI needs to know about a file without rendering it. */
export function auditSvg(raw: string): SvgAudit {
	const { svg, hadScript } = stripScripting(stripComments(raw));
	const hasSvgRoot = /<svg\b/i.test(svg);
	const rootAttrs = readRootAttrs(svg) ?? '';
	const ids = collectIds(svg);
	const declared = new Set(ids);

	const colors = new Set<string>();
	for (const m of svg.matchAll(COLOR_LITERAL)) colors.add(m[0].toLowerCase());
	const paintColors = collectPaintColors(svg);

	return {
		hasSvgRoot,
		viewBox: parseViewBox(svg),
		rootWidth: readAttr(rootAttrs, 'width'),
		rootHeight: readAttr(rootAttrs, 'height'),
		currentColorCount: (svg.match(/currentColor/g) ?? []).length,
		hardcodedColors: [...colors],
		paintColors,
		monochrome: paintColors.length === 1,
		rootColorLocked: /(?:^|;)\s*color\s*:/i.test(readAttr(rootAttrs, 'style') ?? ''),
		ids,
		danglingRefs: collectRefs(svg).filter((ref) => !declared.has(ref)),
		animated: isAnimated(svg),
		animationDurations: animationDurations(svg),
		bytes: new TextEncoder().encode(raw).length,
		hadScript
	};
}

/**
 * Is this mark's ink drivable by a CSS `color` on an ancestor?
 *
 * Requires `currentColor` in the paint AND no root `color` declaration to override it — which is
 * why `stripRootPresentation` has to run before the answer is yes for these files.
 */
export function isRecolorable(audit: SvgAudit): boolean {
	return audit.currentColorCount > 0 && !audit.rootColorLocked;
}

/* ────────────────────────────── pipeline ────────────────────────────── */

export interface PrepareOptions {
	/** Unique per variant — becomes the id namespace. Required; ids collide without it. */
	prefix: string;
	/** Produce the static fully-drawn form. Default false. */
	freeze?: boolean;
	/**
	 * Convert a monochrome mark's paint to `currentColor`. Default true, and a no-op on any mark
	 * that is not monochrome. Pass false to inspect a file exactly as authored.
	 */
	recolor?: boolean;
	/** Strip ids nothing references. Default true. Pass false to inspect a file as authored. */
	pruneIds?: boolean;
}

/**
 * The full inline-safe pipeline. This is what `{@html}` renders and what the download blob and
 * the raster export are built from.
 *
 * Order matters: scripting and the prolog go first (they are not valid HTML), then presentation,
 * then the currentColor conversion (before `stripRootColor`'s effect is judged), then freezing
 * (which rewrites `stroke-dashoffset` on mask paths), then id pruning, and namespacing LAST so it
 * sees the final id set.
 *
 * The result is safe to render ONCE per page. For a mark rendered several times, pass each copy
 * through `instantiateSvg` — after pruning, that is a no-op for any mark without internal
 * references.
 */
export function prepareSvg(
	raw: string,
	{ prefix, freeze = false, recolor = true, pruneIds = true }: PrepareOptions
): string {
	let out = stripScripting(stripComments(stripXmlProlog(raw))).svg;
	out = stripRootPresentation(out);
	if (recolor) out = toCurrentColor(out).svg;
	if (freeze) out = freezeAnimation(out);
	if (pruneIds) out = dropUnusedIds(out);
	return namespaceIds(out, prefix);
}

/* ────────────────────────────── internals ────────────────────────────── */

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The root `<svg>` tag's attribute text, or null if there is no root. */
function readRootAttrs(raw: string): string | null {
	const m = raw.match(/<svg\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/i);
	return m ? m[1] : null;
}

function readAttr(attrs: string, name: string): string | null {
	const m = attrs.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
	return m ? (m[1] ?? m[2]) : null;
}

/**
 * Apply a transform to the root `<svg>` tag's attributes only.
 *
 * Removing an attribute from a multi-line tag leaves the blank line it occupied behind, so runs
 * of blank lines inside the attribute text are collapsed. These files get committed; the diff
 * should show the removed attribute and nothing else.
 */
function replaceRootTag(raw: string, transform: (attrs: string) => string): string {
	let done = false;
	return raw.replace(/<svg\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/i, (match, attrs: string) => {
		if (done) return match;
		done = true;
		const next = transform(attrs).replace(/\n[ \t]*(?=\n)/g, '');
		return `<svg${next}>`;
	});
}

/** Removing <animate> leaves runs of empty lines behind; tidy them for the source view. */
function collapseBlankLines(raw: string): string {
	return raw.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}
