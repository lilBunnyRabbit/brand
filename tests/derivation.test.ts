import { describe, expect, it } from 'bun:test';

import {
	allNodes,
	generations,
	lastStage,
	stages,
	waveDuration,
	growSteps,
	ladderGamutFractions,
	pipRanks,
	recipe,
	wall
} from '../src/lib/brand/derivation';
import { swatches } from '../src/lib/brand/config/palette';

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
		expect(allNodes.find((n) => n.name === 'background')!.seeds).toBe(1);
	});

	it('the recipe covers every colour exactly once, and only the seed has no parent', () => {
		expect(recipe.length).toBe(17);
		expect(new Set(recipe.map((s) => s.name)).size).toBe(17);
		expect(recipe.filter((s) => s.parent === null).map((s) => s.name)).toEqual(['background']);
	});

	it('every parent is a real swatch and never the colour itself', () => {
		const names = new Set(recipe.map((s) => s.name));
		for (const step of recipe) {
			if (!step.parent) continue;
			expect(names.has(step.parent)).toBe(true);
			expect(step.parent).not.toBe(step.name);
		}
	});

	it('generations partition the recipe in order', () => {
		expect(generations.map((g) => g.gen)).toEqual([0, 1, 2, 3]);
		expect(generations.reduce((n, g) => n + g.steps.length, 0)).toBe(17);
	});

	it('a parent always comes from an earlier generation, so the recipe reads downward', () => {
		const genOf = new Map(recipe.map((s) => [s.name, s.gen]));
		for (const step of recipe) {
			if (!step.parent) continue;
			expect(genOf.get(step.parent)!).toBeLessThan(step.gen);
		}
	});

	it('the pip ranks that exist are 1, 2, 3, 4, 6 — nothing at 5', () => {
		expect(pipRanks).toEqual([1, 2, 3, 4, 6]);
		expect(pipRanks).not.toContain(5);
	});

	it('every step states its move', () => {
		for (const step of recipe) expect(step.op.length).toBeGreaterThan(3);
	});

	it('and every shade sits at the same fraction of the sRGB boundary', () => {
		// This is what makes the ray meaningful rather than a coincidence of the axes.
		for (const f of ladderGamutFractions) expect(f).toBeCloseTo(ladderGamutFractions[0], 3);
	});

	it('sRGB runs out just past 6c, so there is no 7c to have', () => {
		// 6c already spends nearly all the chroma available at info's hue and lightness.
		expect(wall.use).toBeGreaterThan(0.9);
		expect(wall.use).toBeLessThan(1);
		// A seventh seed would not fit.
		expect(swatches.background.c * 7).toBeGreaterThan(
			swatches.info.atLightness(swatches.info.l).maxChroma
		);
	});

	it('every node carries a one-line explanation', () => {
		for (const n of allNodes) {
			expect(n.how.length).toBeGreaterThan(10);
			expect(n.how.endsWith('.')).toBe(true);
		}
	});
});

describe('the grow animation', () => {
	it('every chip has a channel target matching its swatch', () => {
		for (const step of growSteps) {
			const c = swatches[step.name];
			expect(step.l).toBeCloseTo(c.l, 9);
			expect(step.c).toBeCloseTo(c.c, 9);
			expect(step.h).toBeCloseTo(c.h, 9);
			expect(step.hex).toBe(c.hex);
		}
	});

	it('a colour is never revealed before its parent', () => {
		const genOf = new Map(growSteps.map((s) => [s.name, s.gen]));
		for (const step of growSteps) {
			if (!step.parent) continue;
			expect(genOf.get(step.parent)!).toBeLessThan(step.gen);
		}
	});

	it('a wave lands in about a second, so the sequence is watchable', () => {
		expect(waveDuration).toBeGreaterThan(0.8);
		expect(waveDuration).toBeLessThan(2.5);
	});

	it('delays are clean numbers, not float noise', () => {
		for (const step of growSteps) {
			expect(String(step.delay).length).toBeLessThan(6);
		}
	});

	it('there is one narrated stage per generation', () => {
		expect(stages.length).toBe(4);
		expect(lastStage).toBe(3);
		expect(stages.map((s) => s.gen)).toEqual([0, 1, 2, 3]);
		for (const s of stages) {
			expect(s.kicker.length).toBeGreaterThan(3);
			expect(s.line.endsWith('.')).toBe(true);
		}
		// Every colour belongs to a stage that exists.
		const gens = new Set(stages.map((s) => s.gen));
		for (const step of growSteps) expect(gens.has(step.gen)).toBe(true);
	});

	it('the seed is stage zero and has nowhere to travel', () => {
		const seed = growSteps.find((s) => s.name === 'background')!;
		expect(seed.gen).toBe(0);
		expect(seed.delay).toBe(0);
		expect(seed.l).toBeCloseTo(swatches.background.l, 9);
		expect(seed.c).toBeCloseTo(swatches.background.c, 9);
		expect(seed.h).toBeCloseTo(swatches.background.h, 9);
	});
});
