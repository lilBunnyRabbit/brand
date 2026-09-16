/**
 * Structural tests for the logo combo config — which pairings exist, which one claims the
 * logotype exemption, and the cottontail rule.
 *
 * No contrast maths: the ratios behind these choices are solved and verified in Chromatics. What
 * cannot rot silently here is the STRUCTURE — a combo added with cottontail on the wrong ground,
 * or the exemption spreading past the one badge it belongs to.
 */
import { describe, expect, it } from 'bun:test';

import { logoCombos, plainInks } from '../src/lib/brand/config/logo-combos';

describe('logo combos', () => {
	it('are the three brand pairs plus the neutral pair', () => {
		expect(logoCombos.map((c) => c.id)).toEqual([
			'bg-primary',
			'primary-bg',
			'primary-cottontail',
			'fg-bg',
			'bg-fg'
		]);
	});

	it('the neutral pair uses no brand colour at all', () => {
		const neutral = logoCombos.filter((c) => c.id === 'fg-bg' || c.id === 'bg-fg');
		expect(neutral).toHaveLength(2);
		for (const combo of neutral) {
			expect(['foreground', 'background']).toContain(combo.ground);
			expect(['foreground', 'background']).toContain(combo.ink);
			expect(combo.exempt).toBeUndefined();
		}
	});

	it('the default is the bare mark in primary on a shade', () => {
		const main = logoCombos[0];
		expect(main.kind).toBe('plain');
		expect(main.ground).toBe('background');
		expect(main.ink).toBe('primary');
		expect(main.exempt).toBeUndefined();
	});

	it('the flipped badge is the same pair the other way round', () => {
		const flipped = logoCombos[1];
		expect(flipped.kind).toBe('disc');
		expect(flipped.ground).toBe('primary');
		expect(flipped.ink).toBe('background');
	});

	it('only the cottontail badge relies on the logotype exemption', () => {
		const exempt = logoCombos.filter((c) => c.exempt);
		expect(exempt.map((c) => c.id)).toEqual(['primary-cottontail']);
	});

	it('COTTONTAIL IS NEVER USED EXCEPT ON PRIMARY', () => {
		// The rule that is easiest to break by accident — a bright colour is tempting for a headline.
		// Every combo that inks with cottontail, or with the ears it is pinned as, must sit on primary.
		for (const combo of logoCombos) {
			if (combo.ink === 'cottontail' || combo.ink === 'mark_ears') {
				expect(combo.ground).toBe('primary');
			}
		}
		expect(logoCombos.some((c) => c.ink === 'mark_ears')).toBe(true);
		for (const entry of plainInks) {
			expect(entry.ink).not.toBe('cottontail');
		}
	});

	it('the bare-mark inks are the three that actually work', () => {
		expect(plainInks.map((i) => i.ink)).toEqual(['foreground', 'primary', 'background']);
	});
});
