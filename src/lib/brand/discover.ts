/**
 * Logo auto-discovery.
 *
 * The `import.meta.glob` calls are the mechanism behind "drop an SVG in and it appears" — the
 * pattern is a compile-time literal, so Vite resolves the folder at build time and every file in
 * it becomes part of the bundle. There is no list to maintain.
 *
 * Two globs over the same folder, because the site needs both forms of each file:
 *   ?raw — the source text, for inlining, the source view, and the download blob
 *   ?url — the emitted asset URL, base-path correct, for <img>, the favicon and hotlinks
 * With `assetsInlineLimit: 0` in `vite.config.ts` the `?url` form is always a real file, never a
 * data URI, so `<a download>` gets a proper filename.
 *
 * This module cannot be exercised under `bun test` (the glob is Vite-only), which is why all the
 * logic lives in `./logo-meta.ts` and this file is a thin assembly step.
 */
import { buildLogoVariant, sortLogoVariants } from './logo-meta';
import { logoOverrides } from './config/logos';
import type { Diagnostic, LogoInventory, UnreadableLogo } from './types';

const raws = import.meta.glob<string>('./logos/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
});

const urls = import.meta.glob<string>('./logos/*.svg', {
	query: '?url',
	import: 'default',
	eager: true
});

function basename(path: string): string {
	return path.split('/').pop() ?? path;
}

export function discoverLogos(): LogoInventory {
	const diagnostics: Diagnostic[] = [];
	const unreadable: UnreadableLogo[] = [];
	const variants = [];
	const seen = new Set<string>();

	// Sorted so the inventory is deterministic regardless of glob enumeration order.
	for (const path of Object.keys(raws).sort()) {
		const file = basename(path);
		const raw = raws[path];
		const url = urls[path];

		seen.add(file);

		if (!url) {
			diagnostics.push({
				severity: 'error',
				code: 'logo-no-url',
				message: 'Resolved as text but not as an asset URL.',
				where: file,
				hint: 'Both globs in discover.ts must cover the same pattern.'
			});
		}

		const variant = buildLogoVariant({ file, raw, url: url ?? '', override: logoOverrides[file] });

		if (!variant) {
			unreadable.push({
				file,
				reason: 'No <svg> root element.',
				bytes: new TextEncoder().encode(raw).length
			});
			diagnostics.push({
				severity: 'warn',
				code: 'logo-unreadable',
				message: 'Skipped: no <svg> root element.',
				where: file,
				hint: 'Re-export it. The other variants still deploy.'
			});
			continue;
		}

		variants.push(variant);
		diagnostics.push(...variant.diagnostics);
	}

	// An override keyed to a file that no longer exists is a stale entry, not a failure.
	for (const key of Object.keys(logoOverrides)) {
		if (!seen.has(key)) {
			diagnostics.push({
				severity: 'warn',
				code: 'logo-orphan-override',
				message: `config/logos.ts has an entry for "${key}", but no such file exists.`,
				where: `config/logos.ts.${key}`,
				hint: 'Remove the entry, or restore the file.'
			});
		}
	}

	if (variants.length === 0) {
		diagnostics.push({
			severity: 'error',
			code: 'logo-none',
			message: 'No readable SVGs in src/lib/brand/logos/.',
			where: 'brand/logos'
		});
	}

	return { variants: sortLogoVariants(variants), unreadable, diagnostics };
}

export const logos: LogoInventory = discoverLogos();
