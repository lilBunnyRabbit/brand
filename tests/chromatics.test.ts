/**
 * The Chromatics embed link.
 *
 * The scheme travels in a URL hash — 7000-odd characters of base64url over a raw DEFLATE stream —
 * and nothing about a bad one is visible from here: the page still renders a frame, the frame
 * still loads, and Chromatics quietly falls back to an empty document because `decodeHash`
 * returned null. One character lost to a soft wrap or a truncated paste is enough.
 *
 * So the paste is checked at the only moment it can be: build time. This decodes the shipped link
 * exactly the way the browser does, and a failure here means the link file needs pasting again —
 *
 *     pbpaste > src/lib/brand/config/chromatics-link.txt
 *
 * The format is Chromatics' `persistence/url-hash.ts`: a `~` sentinel, one version digit, then
 * base64url. `~0`/`~1` carry the DSL source alone, `~2`/`~3` a `{ source, settings }` JSON blob;
 * `~1` and `~2` are the deflated two.
 */
import { describe, expect, it } from 'bun:test';
import { inflateRawSync } from 'node:zlib';

import link from '../src/lib/brand/config/chromatics-link.txt?raw';
import { chromatics, hashOf, showcaseUrl } from '../src/lib/brand/config/chromatics';

const hash = hashOf(link);

/** The same steps `decodeHash` takes, with node's zlib standing in for DecompressionStream. */
function decode(payload: string): { source: string; settings?: unknown } {
	const version = payload[1];
	const bytes = Buffer.from(payload.slice(2), 'base64url');
	const text =
		version === '1' || version === '2'
			? inflateRawSync(bytes).toString('utf8')
			: bytes.toString('utf8');
	return version === '2' || version === '3' ? JSON.parse(text) : { source: text };
}

describe('the link file', () => {
	it('holds a share payload', () => {
		expect(hash[0]).toBe('~');
		expect('0123').toContain(hash[1]);
		expect(hash.length).toBeGreaterThan(3);
	});

	it('is base64url and nothing else', () => {
		// The failure mode this catches: a paste that arrived wrapped, quoted or truncated.
		const stray = [
			...new Set(
				hash
					.slice(2)
					.split('')
					.filter((c) => !/[A-Za-z0-9_-]/.test(c))
			)
		];
		expect(stray).toEqual([]);
	});

	it('decodes to a scheme', () => {
		const state = decode(hash);
		expect(typeof state.source).toBe('string');
		expect(state.source.length).toBeGreaterThan(200);
	});
});

describe('the URL', () => {
	it('takes the payload from anything pasted, and only the payload', () => {
		expect(hashOf('https://example.test/showcase?tab=code#~1abc')).toBe('~1abc');
		expect(hashOf('~1abc')).toBe('~1abc');
		// A line the editor wrapped is still one payload.
		expect(hashOf('#~1ab\ncd ef')).toBe('~1abcdef');
		// Export → Embed hands out a tag, and the attributes after the URL are not the scheme.
		expect(
			hashOf(
				'<iframe\n  src="https://x.test/showcase#~2abc-_9"\n  title="Colour scheme"\n></iframe>'
			)
		).toBe('~2abc-_9');
		expect(hashOf('nothing here')).toBe('');
	});

	it('puts the query before the hash, or the payload would swallow it', () => {
		const url = new URL(showcaseUrl('#~1abc'));
		expect(url.origin).toBe(chromatics.origin);
		expect(url.pathname).toBe('/chromatics/showcase');
		expect(url.searchParams.get('theme')).toBe('light');
		expect(url.hash).toBe('#~1abc');
	});

	it('carries the shipped payload whole', () => {
		expect(chromatics.url.endsWith(`#${hash}`)).toBe(true);
	});
});
