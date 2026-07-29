import { describe, expect, it } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { collectIds, collectRefs, isAnimated } from '../src/lib/svg';
import {
	buildLogoVariant,
	labelFromAxes,
	parseLogoFilename,
	sortLogoVariants
} from '../src/lib/brand/logo-meta';
import { logoOverrides } from '../src/lib/brand/config/logos';
import type { LogoVariant } from '../src/lib/brand/types';

const LOGO_DIR = join(import.meta.dir, '..', 'src', 'lib', 'brand', 'logos');
const FIXTURE_DIR = join(import.meta.dir, 'fixtures');

const files = readdirSync(LOGO_DIR)
	.filter((f) => f.endsWith('.svg'))
	.sort();

const MASKED = readFileSync(join(FIXTURE_DIR, 'animated-masked.svg'), 'utf8');

/** A minimal valid mark, for tests about metadata rather than about SVG content. */
const STUB = '<svg viewBox="0 0 100 40"><path fill="currentColor" d="M0 0h10v10H0z"/></svg>';

/** Mirrors what discover.ts does, minus the Vite glob. */
function build(file: string, raw?: string): LogoVariant {
	const variant = buildLogoVariant({
		file,
		raw: raw ?? readFileSync(join(LOGO_DIR, file), 'utf8'),
		url: `/assets/${file}`,
		override: logoOverrides[file]
	});
	if (!variant) throw new Error(`${file} failed to build`);
	return variant;
}

const all = sortLogoVariants(files.map((f) => build(f)));

// ─── parseLogoFilename ──────────────────────────────────────────────────────

describe('parseLogoFilename', () => {
	it('reads the current placeholder filename', () => {
		expect(parseLogoFilename('lilbunnyrabbit.mark.v6.wip.svg').axes).toMatchObject({
			slug: 'lilbunnyrabbit',
			form: 'mark',
			tone: 'color',
			surface: 'any',
			version: 'v6',
			speed: 'normal',
			status: 'wip',
			size: null,
			tags: []
		});
	});

	it('reads every axis', () => {
		expect(
			parseLogoFilename('brand.wordmark.mono.on-dark.static.final.180.svg').axes
		).toMatchObject({
			slug: 'brand',
			form: 'wordmark',
			tone: 'mono',
			surface: 'dark',
			declaredMotion: 'static',
			status: 'final',
			size: 180
		});
	});

	it('defaults status to final, so only drafts have to say so', () => {
		expect(parseLogoFilename('x.mark.svg').axes.status).toBe('final');
		expect(parseLogoFilename('x.mark.wip.svg').axes.status).toBe('wip');
	});

	it('is case-insensitive on tokens but preserves the slug', () => {
		expect(parseLogoFilename('LilBunnyRabbit.MARK.V6.svg').axes).toMatchObject({
			slug: 'LilBunnyRabbit',
			form: 'mark',
			version: 'v6'
		});
	});

	it('defaults a bare filename to a colour mark, with an info diagnostic', () => {
		const { axes, diagnostics } = parseLogoFilename('whatever.svg');
		expect(axes).toMatchObject({ slug: 'whatever', form: 'mark', tone: 'color', surface: 'any' });
		expect(diagnostics.map((d) => d.code)).toEqual(['logo-no-metadata']);
		expect(diagnostics[0].severity).toBe('info');
	});

	it('turns unknown tokens into tags rather than erroring', () => {
		const { axes, diagnostics } = parseLogoFilename('x.mark.chonky.experimental.svg');
		expect(axes.tags).toEqual(['chonky', 'experimental']);
		expect(diagnostics.every((d) => d.severity === 'info')).toBe(true);
	});

	it('takes the first value per axis and warns about the conflict', () => {
		const { axes, diagnostics } = parseLogoFilename('x.mark.wordmark.svg');
		expect(axes.form).toBe('mark');
		expect(diagnostics.map((d) => d.code)).toContain('logo-conflicting-token');
	});

	it('never throws on hostile filenames', () => {
		for (const name of ['.svg', '..svg', 'a..b.svg', '....svg', 'ünïcødé.svg']) {
			expect(() => parseLogoFilename(name)).not.toThrow();
		}
	});
});

describe('labelFromAxes', () => {
	it('builds a readable label from the axes', () => {
		expect(labelFromAxes(parseLogoFilename('x.mark.v6.svg').axes)).toBe('Mark v6');
		expect(labelFromAxes(parseLogoFilename('x.wordmark.mono.on-dark.svg').axes)).toBe(
			'Wordmark mono on dark'
		);
		expect(labelFromAxes(parseLogoFilename('x.favicon.32.svg').axes)).toBe('Favicon 32px');
	});

	it('excludes status — it is a badge, not part of the name', () => {
		expect(labelFromAxes(parseLogoFilename('x.mark.v6.wip.svg').axes)).toBe('Mark v6');
	});
});

// ─── buildLogoVariant ───────────────────────────────────────────────────────

describe('buildLogoVariant', () => {
	it('builds every file in the folder', () => {
		expect(all.length).toBe(files.length);
		expect(all.length).toBeGreaterThan(0);
	});

	it('judges recolorability on the PREPARED form, not the raw file', () => {
		// The placeholder arrives as a flat `fill:#ffffff` with no currentColor at all. Judging the
		// raw file would report it unusable; the pipeline converts it, so it is recolorable.
		for (const v of all) {
			expect(v.recolorable).toBe(true);
		}
		const converted = all.filter((v) => v.recolorConverted);
		expect(converted.length).toBeGreaterThan(0);
	});

	it('detects motion from the file', () => {
		for (const v of all) {
			expect(v.motion).toBe(isAnimated(v.raw) ? 'animated' : 'static');
		}
	});

	it('produces inline and frozen forms with disjoint ids', () => {
		for (const v of all) {
			const inlineIds = new Set(collectIds(v.inline));
			expect(collectIds(v.frozen).some((id) => inlineIds.has(id))).toBe(false);
		}
	});

	it('THE REGRESSION: every variant on one page, animated and frozen, shares no id', () => {
		const forms = all.flatMap((v) => [v.inline, v.frozen]);
		const ids = collectIds(forms.join(''));
		expect(new Set(ids).size).toBe(ids.length);

		// Page-wide uniqueness is necessary but NOT sufficient: the actual invariant is that each
		// svg's url(#…) resolves to an id inside THAT svg. A page where every id is unique can
		// still have a fragment whose mask ref points into a different fragment.
		for (const svg of forms) {
			const local = new Set(collectIds(svg));
			for (const ref of collectRefs(svg)) expect(local.has(ref)).toBe(true);
		}
	});

	it('keeps raw verbatim so downloads ship the committed file', () => {
		for (const v of all) {
			expect(v.raw).toBe(readFileSync(join(LOGO_DIR, v.file), 'utf8'));
			expect(v.inline).not.toContain('<?xml');
		}
	});

	it('applies config overrides', () => {
		const mark = all.find((v) => v.file === 'lilbunnyrabbit.mark.v6.wip.svg');
		if (mark) {
			expect(mark.label).toBe('Mark');
			expect(mark.axes.status).toBe('wip');
			expect(mark.axes.tone).toBe('mono');
			expect(mark.order).toBe(-1);
		}
	});

	it('falls back to derived metadata with no config entry at all', () => {
		const file = 'brand.lockup.v2.svg';
		expect(logoOverrides[file]).toBeUndefined();
		const v = build(file, STUB);
		expect(v.label).toBe('Lockup v2');
		expect(v.minSize).toBe(24);
		expect(v.clearSpace).toBe(0.5);
		expect(v.hidden).toBe(false);
		expect(v.axes.status).toBe('final');
	});

	it('returns null for a file with no svg root, so the caller can list it', () => {
		expect(buildLogoVariant({ file: 'broken.svg', raw: 'not an svg', url: '/x' })).toBeNull();
	});

	it('warns when a mono variant genuinely cannot be recoloured', () => {
		// Multi-colour: conversion would be destructive, so it is refused and reported.
		const v = build(
			'x.mark.mono.svg',
			'<svg viewBox="0 0 10 10"><path fill="#f00" d="M0 0"/><path fill="#0f0" d="M1 1"/></svg>'
		);
		expect(v.recolorable).toBe(false);
		expect(v.recolorConverted).toBe(false);
		expect(v.diagnostics.map((d) => d.code)).toContain('logo-not-recolorable');
		expect(v.diagnostics.map((d) => d.code)).toContain('logo-multicolour');
	});

	it('warns when the filename disagrees with the file about motion', () => {
		const v = build('x.mark.static.svg', MASKED);
		expect(v.motion).toBe('animated');
		const d = v.diagnostics.find((d) => d.code === 'logo-motion-mismatch')!;
		expect(d.severity).toBe('warn');
		expect(d.message).toContain('the file is animated');
	});

	it('warns about a missing viewBox and errors on a dangling ref', () => {
		const noBox = build('x.svg', '<svg><path fill="currentColor" d="M0 0"/></svg>');
		expect(noBox.diagnostics.map((d) => d.code)).toContain('logo-no-viewbox');
		expect(noBox.viewBox).toBeNull();

		const dangling = build('y.svg', '<svg viewBox="0 0 1 1"><g mask="url(#gone)"/></svg>');
		expect(dangling.diagnostics.find((d) => d.code === 'logo-dangling-ref')!.severity).toBe(
			'error'
		);
	});

	it('flags a file carrying script', () => {
		const v = build('z.svg', '<svg viewBox="0 0 1 1" onload="x()"><path d="M0 0"/></svg>');
		expect(v.diagnostics.map((d) => d.code)).toContain('logo-script-stripped');
		expect(v.inline).not.toContain('onload');
	});

	it('has no error-level diagnostics for any committed file', () => {
		for (const v of all) {
			expect(v.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
		}
	});
});

// ─── ordering ───────────────────────────────────────────────────────────────

describe('sortLogoVariants', () => {
	it('groups by form, marks before wordmarks before lockups', () => {
		const order = sortLogoVariants([
			build('a.pattern.svg', STUB),
			build('a.lockup.svg', STUB),
			build('a.mark.svg', STUB),
			build('a.wordmark.svg', STUB)
		]).map((v) => v.axes.form);
		expect(order).toEqual(['mark', 'wordmark', 'lockup', 'pattern']);
	});

	it('leads with the newest version, normal speed before fast', () => {
		const order = sortLogoVariants([
			build('a.mark.v1.svg', STUB),
			build('a.mark.v6.fast.svg', STUB),
			build('a.mark.v6.svg', STUB)
		]).map((v) => v.file);
		expect(order).toEqual(['a.mark.v6.svg', 'a.mark.v6.fast.svg', 'a.mark.v1.svg']);
	});

	it('honours an explicit order override above everything else', () => {
		const pinned = buildLogoVariant({
			file: 'a.pattern.svg',
			raw: STUB,
			url: '/x',
			override: { order: -10 }
		})!;
		const order = sortLogoVariants([build('a.mark.svg', STUB), pinned]).map((v) => v.axes.form);
		expect(order).toEqual(['pattern', 'mark']);
	});

	it('is stable — same input, same output', () => {
		const once = sortLogoVariants(all).map((v) => v.file);
		expect(sortLogoVariants([...all].reverse()).map((v) => v.file)).toEqual(once);
	});
});

// ─── the acceptance test for the whole requirement ──────────────────────────

describe('ACCEPTANCE: an unlisted SVG appears with zero code edits', () => {
	it('renders a brand-new file that no config mentions', () => {
		const file = 'brand.wordmark.mono.svg';
		expect(logoOverrides[file]).toBeUndefined();

		const v = build(
			file,
			'<svg viewBox="0 0 120 32"><path id="w" fill="currentColor" d="M0 0h10v10H0z"/>' +
				'<use href="#w" x="20"/></svg>'
		);

		expect(v.label).toBe('Wordmark mono');
		expect(v.axes.form).toBe('wordmark');
		expect(v.recolorable).toBe(true);
		expect(v.viewBox?.aspect).toBe(3.75);
		expect(v.minSize).toBe(24);
		expect(v.diagnostics.filter((d) => d.severity !== 'info')).toEqual([]);

		// Namespaced, so it can sit next to the committed marks without stealing their ids.
		expect(collectIds(v.inline)).toEqual(['brand-wordmark-mono__w']);
		expect(v.inline).toContain('href="#brand-wordmark-mono__w"');

		const ids = collectIds(all.map((m) => m.inline).join('') + v.inline);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
