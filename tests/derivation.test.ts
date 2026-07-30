import { describe, expect, it } from 'bun:test';

import {
	allNodes,
	arcs,
	ladder,
	ladderGamutFractions,
	rail,
	railNames,
	stateNodes,
	vacancy,
	wall,
	xOf,
	yOf
} from '../src/lib/brand/derivation';
import { swatches, type SwatchName } from '../src/lib/brand/config/palette';

/**
 * The plot claims things visually. These assert the geometry actually says them, so the figure
 * cannot start lying if the seed moves.
 */
describe('the derivation plot', () => {
	it('plots all 17 colours', () => {
		expect(allNodes.length).toBe(17);
		expect(new Set(allNodes.map((n) => n.name)).size).toBe(17);
	});

	it('the seed sits at exactly one seed of chroma', () => {
		const seed = allNodes.find((n) => n.name === 'background')!;
		expect(seed.seeds).toBe(1);
	});

	it('the brand four land on integers 1, 2, 3, 4 — which is why they are evenly spaced', () => {
		const by = (n: SwatchName) => allNodes.find((x) => x.name === n)!;
		expect(
			[by('tertiary'), by('secondary'), by('primary'), by('accent')].map((n) => n.seeds)
		).toEqual([1, 2, 3, 4]);
		// Evenly spaced in x, so the picture cannot imply anything was hand-picked.
		const xs = [by('tertiary').x, by('secondary').x, by('primary').x, by('accent').x];
		const gaps = xs.slice(1).map((x, i) => x - xs[i]);
		for (const g of gaps) expect(g).toBeCloseTo(gaps[0], 6);
	});

	it('the four states share one coordinate exactly, so they are one node cut in four', () => {
		for (const n of stateNodes) {
			expect(n.seeds).toBe(6);
			expect(n.x).toBeCloseTo(stateNodes[0].x, 9);
			expect(n.y).toBeCloseTo(stateNodes[0].y, 9);
		}
		// Four distinct hues at that one point.
		expect(new Set(stateNodes.map((n) => Math.round(n.hue))).size).toBe(4);
	});

	it('nine colours share the rail', () => {
		expect(railNames.length).toBe(9);
		for (const name of railNames) {
			expect(allNodes.find((n) => n.name === name)!.y).toBeCloseTo(rail.y, 9);
		}
	});

	it('the seven shades are collinear through the origin', () => {
		// x and y are both affine in C and L, and C is proportional to L, so the ladder is a ray from
		// the origin. Check it by slope between consecutive rungs.
		const slopes = ladder.slice(1).map((n, i) => (n.y - ladder[i].y) / (n.x - ladder[i].x));
		for (const s of slopes) expect(s).toBeCloseTo(slopes[0], 6);
	});

	it('and every shade sits at the same fraction of the sRGB boundary', () => {
		// This is what makes the ray meaningful rather than a coincidence of the axes.
		for (const f of ladderGamutFractions) expect(f).toBeCloseTo(ladderGamutFractions[0], 3);
	});

	it('5c is genuinely empty, and the hole is twice any other interval', () => {
		expect(allNodes.some((n) => Math.round(n.seeds) === 5)).toBe(false);
		const accent = allNodes.find((n) => n.name === 'accent')!;
		const state = stateNodes[0];
		const unit = xOf(swatches.background.c * 2) - xOf(swatches.background.c);
		expect(state.x - accent.x).toBeCloseTo(unit * 2, 6);
		expect(vacancy.x).toBeGreaterThan(accent.x);
		expect(vacancy.x).toBeLessThan(state.x);
	});

	it('sRGB runs out just past 6c, so there is no 7c to have', () => {
		expect(wall.x).toBeGreaterThan(stateNodes[0].x);
		expect(xOf(swatches.background.c * 7)).toBeGreaterThan(wall.x);
		// 6c already spends nearly all of it.
		expect(wall.use).toBeGreaterThan(0.9);
		expect(wall.use).toBeLessThan(1);
	});

	it('tertiary sits directly above the seed — same chroma, to the digit', () => {
		const t = allNodes.find((n) => n.name === 'tertiary')!;
		const seed = allNodes.find((n) => n.name === 'background')!;
		expect(swatches.tertiary.c).toBeCloseTo(swatches.background.c, 9);
		expect(t.x).toBeCloseTo(seed.x, 9);
		expect(t.sameChroma).toContain('background');
	});

	it('cottontail is the only colour off the rail and above it', () => {
		const c = allNodes.find((n) => n.name === 'cottontail')!;
		expect(c.y).toBeLessThan(rail.y);
		expect(allNodes.filter((n) => n.y < rail.y).map((n) => n.name)).toEqual(['cottontail']);
	});

	it('every arc names real swatches and springs from or lands on primary', () => {
		for (const arc of arcs) {
			expect(Object.keys(swatches)).toContain(arc.from);
			expect(Object.keys(swatches)).toContain(arc.to);
			expect([arc.from, arc.to]).toContain('primary');
		}
		// Nested depths, so no two arcs cross.
		const depths = arcs.map((a) => a.depth);
		expect([...depths].sort((a, b) => a - b)).toEqual(depths);
	});

	it('the axes are monotonic in chroma and lightness', () => {
		expect(xOf(0)).toBeLessThan(xOf(0.05));
		expect(yOf(0.9)).toBeLessThan(yOf(0.2));
	});

	it('every node carries a one-line explanation', () => {
		for (const n of allNodes) {
			expect(n.how.length).toBeGreaterThan(10);
			expect(n.how.endsWith('.')).toBe(true);
		}
	});
});
