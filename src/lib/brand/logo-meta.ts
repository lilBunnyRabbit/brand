/**
 * Filename parsing and variant construction for the logo folder.
 *
 * Pure functions only — no `import.meta.glob` — so this is testable under `bun test` and the
 * glob lives in `./discover.ts`.
 *
 * The governing rule: **config is an override layer, never a gate.** Dropping an SVG into
 * `brand/logos/` must be sufficient to make it appear. If a missing config entry could hide a
 * file, adding a logo would require a code edit, which is the one thing this project forbids.
 * So `parseLogoFilename` never throws, unknown tokens become tags, and every axis has a default.
 */
import { auditSvg, isRecolorable, prepareSvg, toCurrentColor } from '$lib/svg';
import type {
	Diagnostic,
	LogoAxes,
	LogoForm,
	LogoMotion,
	LogoOverride,
	LogoSpeed,
	LogoStatus,
	LogoSurface,
	LogoTone,
	LogoVariant
} from './types';

const FORMS = [
	'mark',
	'wordmark',
	'lockup',
	'icon',
	'favicon',
	'avatar',
	'pattern'
] as const satisfies readonly LogoForm[];

const TONES = ['color', 'mono', 'duo', 'inverse'] as const satisfies readonly LogoTone[];

const SURFACES: Record<string, LogoSurface> = {
	'on-light': 'light',
	'on-dark': 'dark',
	'on-any': 'any'
};

const SPEEDS = ['fast', 'slow'] as const satisfies readonly LogoSpeed[];

const MOTIONS = ['animated', 'static'] as const satisfies readonly LogoMotion[];

const STATUSES = ['wip', 'final'] as const satisfies readonly LogoStatus[];

/** Sort weight per form: the primary mark first, incidental sizes last. */
const FORM_ORDER: Record<LogoForm, number> = {
	mark: 0,
	wordmark: 1,
	lockup: 2,
	icon: 3,
	avatar: 4,
	favicon: 5,
	pattern: 6
};

const DEFAULTS = {
	/** Conservative floor for a detailed mark. Override per variant once each is measured. */
	minSize: 24,
	clearSpace: 0.5,
	clearSpaceUnit: 'height' as const
};

/* ────────────────────────────── filename ────────────────────────────── */

export interface ParsedFilename {
	axes: LogoAxes;
	diagnostics: Diagnostic[];
}

/**
 * Parse `lilbunnyrabbit.mark.v6.wip.svg` into axes.
 *
 * Dot-separated, because axis values are themselves hyphenated (`on-dark`) and dots keep the
 * token boundaries unambiguous. The first segment is a free-form slug; every later segment is
 * matched against the vocabularies above, and anything unrecognised becomes a tag.
 */
export function parseLogoFilename(file: string): ParsedFilename {
	const base = file.replace(/\.svg$/i, '');
	const [slug = base, ...tokens] = base.split('.');
	const diagnostics: Diagnostic[] = [];

	const axes: LogoAxes = {
		slug,
		form: 'mark',
		tone: 'color',
		surface: 'any',
		version: null,
		speed: 'normal',
		status: 'final',
		declaredMotion: null,
		size: null,
		tags: []
	};

	const claimed = new Set<string>();
	const claim = (axis: string, token: string) => {
		if (claimed.has(axis)) {
			diagnostics.push({
				severity: 'warn',
				code: 'logo-conflicting-token',
				message: `"${token}" conflicts with an earlier ${axis} token; the first one wins.`,
				where: file
			});
			return false;
		}
		claimed.add(axis);
		return true;
	};

	for (const token of tokens) {
		const lower = token.toLowerCase();

		if ((FORMS as readonly string[]).includes(lower)) {
			if (claim('form', token)) axes.form = lower as LogoForm;
		} else if ((TONES as readonly string[]).includes(lower)) {
			if (claim('tone', token)) axes.tone = lower as LogoTone;
		} else if (lower in SURFACES) {
			if (claim('surface', token)) axes.surface = SURFACES[lower];
		} else if ((SPEEDS as readonly string[]).includes(lower)) {
			if (claim('speed', token)) axes.speed = lower as LogoSpeed;
		} else if ((STATUSES as readonly string[]).includes(lower)) {
			if (claim('status', token)) axes.status = lower as LogoStatus;
		} else if ((MOTIONS as readonly string[]).includes(lower)) {
			if (claim('motion', token)) axes.declaredMotion = lower as LogoMotion;
		} else if (/^v\d+$/.test(lower)) {
			if (claim('version', token)) axes.version = lower;
		} else if (/^\d+$/.test(lower)) {
			if (claim('size', token)) axes.size = Number(lower);
		} else {
			axes.tags.push(token);
		}
	}

	if (tokens.length === 0) {
		diagnostics.push({
			severity: 'info',
			code: 'logo-no-metadata',
			message: `"${file}" declares no axes, so it is treated as a colour mark.`,
			where: file,
			hint: `Rename to e.g. "${slug}.mark.color.svg" to describe it, or set a label in config/logos.ts.`
		});
	}

	for (const tag of axes.tags) {
		diagnostics.push({
			severity: 'info',
			code: 'logo-unknown-token',
			message: `"${tag}" matched no known axis and became a tag.`,
			where: file
		});
	}

	return { axes, diagnostics };
}

/**
 * Human label from the axes, when config supplies none.
 *
 * `status` is deliberately excluded — it is rendered as a badge next to the label rather than
 * folded into it, so "Mark v6" does not read as "Mark v6 wip".
 */
export function labelFromAxes(axes: LogoAxes): string {
	const parts = [capitalize(axes.form)];
	if (axes.version) parts.push(axes.version);
	if (axes.tone !== 'color') parts.push(axes.tone);
	if (axes.surface !== 'any') parts.push(`on ${axes.surface}`);
	if (axes.size) parts.push(`${axes.size}px`);
	if (axes.speed !== 'normal') parts.push(axes.speed);
	for (const tag of axes.tags) parts.push(tag);
	return parts.join(' ');
}

/* ────────────────────────────── variant ────────────────────────────── */

export interface BuildInput {
	file: string;
	raw: string;
	url: string;
	override?: LogoOverride;
}

/**
 * Build a variant from a file's contents. Returns null when the file has no `<svg>` root — the
 * caller lists it as unreadable rather than failing the build, because one bad export must not
 * block deploying the others.
 */
export function buildLogoVariant({
	file,
	raw,
	url,
	override = {}
}: BuildInput): LogoVariant | null {
	const id = file.replace(/\.svg$/i, '');
	const { axes, diagnostics } = parseLogoFilename(file);

	if (!auditSvg(raw).hasSvgRoot) return null;

	const inline = prepareSvg(raw, { prefix: id });
	// A distinct prefix: the animated and frozen forms of one variant can appear on the same page
	// (a size ladder beside a reduced-motion note), and they must not share ids.
	const frozen = prepareSvg(raw, { prefix: `${id}-frozen`, freeze: true });

	// Audit the PREPARED form. Judging the raw file would be wrong twice over: its root `color`
	// would report as not recolorable even though the pipeline strips it, and a monochrome
	// Inkscape export arrives as `fill:#ffffff` and only becomes recolorable after conversion.
	const audit = auditSvg(inline);
	const rawAudit = auditSvg(raw);

	const form = override.form ?? axes.form;
	const tone = override.tone ?? axes.tone;
	const surface = override.surface ?? axes.surface;
	const status = override.status ?? axes.status;
	const resolvedAxes: LogoAxes = { ...axes, form, tone, surface, status };

	const motion: LogoMotion = audit.animated ? 'animated' : 'static';
	const recolorable = isRecolorable(audit);
	const recolorConverted = toCurrentColor(raw).converted;

	if (!recolorable && rawAudit.paintColors.length > 1) {
		diagnostics.push({
			severity: 'info',
			code: 'logo-multicolour',
			message: `Paints in ${rawAudit.paintColors.length} colours, so its ink is fixed.`,
			where: file,
			hint: 'Only single-colour marks can follow the surrounding CSS colour.'
		});
	}

	if (axes.declaredMotion && axes.declaredMotion !== motion) {
		diagnostics.push({
			severity: 'warn',
			code: 'logo-motion-mismatch',
			message: `Filename says "${axes.declaredMotion}" but the file is ${motion}.`,
			where: file,
			hint: 'The file is the authority; rename it to match.'
		});
	}

	if (tone === 'mono' && !recolorable) {
		diagnostics.push({
			severity: 'warn',
			code: 'logo-not-recolorable',
			message: `Declared mono but paints in ${rawAudit.paintColors.length} colours.`,
			where: file,
			hint: 'A single-colour export is converted to currentColor automatically; this one is not.'
		});
	}

	if (!audit.viewBox) {
		diagnostics.push({
			severity: 'warn',
			code: 'logo-no-viewbox',
			message: 'No viewBox, so the mark has no intrinsic aspect ratio and cannot scale.',
			where: file,
			hint: 'Add viewBox to the root <svg>.'
		});
	}

	if (audit.danglingRefs.length > 0) {
		diagnostics.push({
			severity: 'error',
			code: 'logo-dangling-ref',
			message: `References ids that do not exist: ${audit.danglingRefs.join(', ')}.`,
			where: file,
			hint: 'The export is incomplete — part of the mark will not render.'
		});
	}

	// `rawAudit`, not `audit`: the prepared form has already had scripting stripped, so asking it
	// whether there was any always answers no.
	if (rawAudit.hadScript) {
		diagnostics.push({
			severity: 'error',
			code: 'logo-script-stripped',
			message: 'Contained a <script> or on* handler, which was removed.',
			where: file,
			hint: 'These files are inlined as source. Do not commit SVGs from untrusted sources.'
		});
	}

	return {
		id,
		file,
		label: override.label ?? labelFromAxes(resolvedAxes),
		description: override.description,
		axes: resolvedAxes,
		raw,
		url,
		inline,
		frozen,
		audit,
		viewBox: audit.viewBox,
		recolorable,
		recolorConverted,
		motion,
		minSize: override.minSize ?? DEFAULTS.minSize,
		clearSpace: override.clearSpace ?? DEFAULTS.clearSpace,
		clearSpaceUnit: override.clearSpaceUnit ?? DEFAULTS.clearSpaceUnit,
		preferredBackgrounds: override.preferredBackgrounds ?? [],
		forbiddenBackgrounds: override.forbiddenBackgrounds ?? [],
		order: override.order ?? 0,
		hidden: override.hidden ?? false,
		diagnostics
	};
}

/**
 * Stable display order: explicit `order`, then form, then version DESCENDING (the newest
 * iteration is the one being evaluated, so it leads), then normal speed before fast, then
 * filename as the tiebreak so the order never depends on filesystem enumeration.
 */
export function sortLogoVariants(variants: LogoVariant[]): LogoVariant[] {
	const speedRank: Record<LogoSpeed, number> = { normal: 0, fast: 1, slow: 2 };
	return [...variants].sort(
		(a, b) =>
			a.order - b.order ||
			FORM_ORDER[a.axes.form] - FORM_ORDER[b.axes.form] ||
			versionNumber(b.axes.version) - versionNumber(a.axes.version) ||
			speedRank[a.axes.speed] - speedRank[b.axes.speed] ||
			a.file.localeCompare(b.file)
	);
}

function versionNumber(version: string | null): number {
	return version ? Number(version.slice(1)) : -1;
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export { DEFAULTS as LOGO_DEFAULTS, FORMS as LOGO_FORMS, TONES as LOGO_TONES };
