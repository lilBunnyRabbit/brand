<script lang="ts">
	import { instantiateSvg } from '$lib/svg';
	import type { LogoVariant } from '$lib/brand/types';

	let {
		variant,
		/** Disc diameter. */
		size = '8rem',
		disc = 'var(--brand-primary)',
		ink = 'var(--brand-cottontail)',
		key = 'lockup'
	}: {
		variant: LogoVariant;
		size?: string;
		disc?: string;
		ink?: string;
		key?: string;
	} = $props();

	/*
		THE EXTRA CASE, not the default.

		Two-tone: cottontail ears on a primary disc, 1.94:1. The main logo is the single-colour mark
		on a shade (`Mark.svelte`, 7.06:1) — this is the version for places that want a filled badge,
		and it comes with a caveat.

		1.94 is deliberate and correct: WCAG exempts logotypes (SC 1.4.3, 1.4.11), so there is no
		stroke, no shadow and no lighter green. It holds up because the two colours differ in
		LIGHTNESS rather than hue, so it barely moves under greyscale or any dichromacy — which a
		two-hue mark would not. It is a logotype allowance and never a text allowance: no small text in
		cottontail on a primary fill.
	*/
	const uid = $props.id();
	const art = $derived(instantiateSvg(variant.frozen, `${uid}-${key}`));
</script>

<div class="lockup" style="--disc: {disc}; --size: {size}; color: {ink};">
	<span class="ears">{@html art}</span>
</div>

<style>
	.lockup {
		display: grid;
		place-items: center;
		width: var(--size);
		height: var(--size);
		background: var(--disc);
		border-radius: 50%;
	}

	.ears {
		display: block;
		width: 58%;
	}

	.ears :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
