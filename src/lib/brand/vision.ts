/**
 * The lockup under greyscale and the three dichromacies.
 *
 * Worth putting on the page because the result is unusually good, and the reason is instructive:
 * `cottontail` and `primary` differ in LIGHTNESS, not hue, so the mark barely moves under
 * simulation. A two-hue mark would look richer and lose most of its separation.
 *
 * These are computed, not quoted. The scheme cites 1.96 for the pair and 1.95 under greyscale;
 * culori's Machado-based matrices land within 0.01 of that. Numbers can differ by simulation
 * method, so the page shows what this code can actually defend — and the claim that matters
 * (near-zero variation across conditions) holds either way.
 */
import { contrastRatio, simulateVision, type VisionSimulation } from '$lib/color';
import { dark } from './config/palette';

export interface VisionCheck {
	id: VisionSimulation;
	label: string;
	/** cottontail as seen under this condition. */
	inkHex: string;
	/** primary as seen under this condition. */
	discHex: string;
	ratio: number;
	/** Signed difference from normal vision. */
	delta: number;
}

const CONDITIONS: { id: VisionSimulation; label: string }[] = [
	{ id: 'none', label: 'Normal vision' },
	{ id: 'grayscale', label: 'Greyscale' },
	{ id: 'protanopia', label: 'Protanopia' },
	{ id: 'deuteranopia', label: 'Deuteranopia' },
	{ id: 'tritanopia', label: 'Tritanopia' }
];

function ratioUnder(sim: VisionSimulation) {
	const ink = simulateVision(dark.cottontail, sim);
	const disc = simulateVision(dark.primary, sim);
	return { ink, disc, ratio: contrastRatio(ink, disc) };
}

const normal = ratioUnder('none').ratio;

export const lockupVision: VisionCheck[] = CONDITIONS.map(({ id, label }) => {
	const { ink, disc, ratio } = ratioUnder(id);
	return { id, label, inkHex: ink.hex, discHex: disc.hex, ratio, delta: ratio - normal };
});

/** The largest deviation from normal vision across every condition. */
export const lockupVisionSpread = Math.max(...lockupVision.map((v) => Math.abs(v.delta)));
