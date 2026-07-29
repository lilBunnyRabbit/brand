/**
 * Brand config types.
 *
 * Phase 1 covers logos and diagnostics. Palette, roles, typography and usage types land in
 * Phase 2 and get appended here.
 */
import type { SvgAudit, ViewBox } from '$lib/svg';

/* ────────────────────────────── diagnostics ────────────────────────────── */

export type Severity = 'error' | 'warn' | 'info';

export interface Diagnostic {
	severity: Severity;
	/** Stable, greppable identifier. */
	code: string;
	message: string;
	/** Where the problem is — a filename or a dotted config path. */
	where: string;
	hint?: string;
}

/* ────────────────────────────── logos ────────────────────────────── */

export type LogoForm = 'mark' | 'wordmark' | 'lockup' | 'icon' | 'favicon' | 'avatar' | 'pattern';

export type LogoTone = 'color' | 'mono' | 'duo' | 'inverse';
export type LogoSurface = 'light' | 'dark' | 'any';
export type LogoSpeed = 'normal' | 'fast' | 'slow';
export type LogoMotion = 'animated' | 'static';

/**
 * Whether the mark is settled. A real axis rather than a tag, because the guide is being written
 * while the logo is still being designed, and a variant that is not final has to say so on the
 * page — otherwise someone downloads a draft and ships it.
 */
export type LogoStatus = 'wip' | 'final';

/** What the filename declares. Every field has a default; parsing never throws. */
export interface LogoAxes {
	/** First filename segment, e.g. `lilbunnyrabbit`. */
	slug: string;
	form: LogoForm;
	tone: LogoTone;
	surface: LogoSurface;
	/** Design iteration, e.g. `v6`. Null when unversioned. */
	version: string | null;
	speed: LogoSpeed;
	status: LogoStatus;
	/** What the filename CLAIMS about motion. The audit is the authority. */
	declaredMotion: LogoMotion | null;
	/** A bare integer in the filename, e.g. `lilbunnyrabbit.favicon.32.svg`. */
	size: number | null;
	/** Filename tokens that matched no known axis. Never an error. */
	tags: string[];
}

/** Per-file overrides. Purely additive — a file with no entry still renders. */
export interface LogoOverride {
	label?: string;
	description?: string;
	form?: LogoForm;
	tone?: LogoTone;
	surface?: LogoSurface;
	status?: LogoStatus;
	/** Smallest width in px at which the mark stays legible. */
	minSize?: number;
	/** Clear space as a multiple of `clearSpaceUnit`. */
	clearSpace?: number;
	clearSpaceUnit?: 'height' | 'width' | 'cap';
	/** Backgrounds this variant is intended for / must never appear on, by background id. */
	preferredBackgrounds?: string[];
	forbiddenBackgrounds?: string[];
	/** Lower sorts earlier. Overrides the default ordering. */
	order?: number;
	/** Keep out of the showcase but still downloadable — for work-in-progress iterations. */
	hidden?: boolean;
}

export interface LogoVariant {
	/** Filename without extension. Unique, and used as the SVG id namespace. */
	id: string;
	/** Filename with extension, as committed. */
	file: string;
	label: string;
	description?: string;
	axes: LogoAxes;
	/** Verbatim file contents — what the source view and the download blob use. */
	raw: string;
	/** Vite-resolved URL, base-path correct — for `<img>`, the favicon link, hotlinks. */
	url: string;
	/** Inline-safe, id-namespaced, CSS-sizable, themeable. What `{@html}` renders. */
	inline: string;
	/** Same, but with the animation frozen fully drawn — raster, print, reduced motion. */
	frozen: string;
	audit: SvgAudit;
	viewBox: ViewBox | null;
	/**
	 * Ink follows a CSS `color` on an ancestor. Judged on the PREPARED form, not the raw file —
	 * a monochrome Inkscape export arrives as `fill:#ffffff` and becomes recolorable only after
	 * the pipeline converts it.
	 */
	recolorable: boolean;
	/** True when the pipeline rewrote a single flat paint colour to `currentColor`. */
	recolorConverted: boolean;
	/** Detected from the file. Disagreement with the filename raises a diagnostic. */
	motion: LogoMotion;
	minSize: number;
	clearSpace: number;
	clearSpaceUnit: 'height' | 'width' | 'cap';
	preferredBackgrounds: string[];
	forbiddenBackgrounds: string[];
	order: number;
	hidden: boolean;
	diagnostics: Diagnostic[];
}

/** A file in the folder that could not be read as an SVG. Listed, never fatal. */
export interface UnreadableLogo {
	file: string;
	reason: string;
	bytes: number;
}

export interface LogoInventory {
	variants: LogoVariant[];
	unreadable: UnreadableLogo[];
	diagnostics: Diagnostic[];
}
