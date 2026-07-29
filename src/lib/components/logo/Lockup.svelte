<script lang="ts">
	import { instantiateSvg } from '$lib/svg';
	import type { LogoVariant } from '$lib/brand/types';

	let {
		variant,
		/** Disc diameter. */
		size = '8rem',
		/** The disc colour. `primary` on any dark ground; `background` on a light one. */
		disc = 'var(--brand-primary)',
		/** The ear colour. */
		ink = 'var(--brand-cottontail)',
		/** Drop the disc and render the mark alone, inked in `ink`. */
		bare = false,
		key = 'lockup'
	}: {
		variant: LogoVariant;
		size?: string;
		disc?: string;
		ink?: string;
		bare?: boolean;
		key?: string;
	} = $props();

	/*
		The lockup is cottontail ears on a primary disc — 1.94:1, which is deliberate and correct.
		WCAG exempts logotypes (SC 1.4.3, 1.4.11), and the pair holds up under greyscale and all three
		dichromacies because the two colours differ in LIGHTNESS rather than hue. A two-hue mark would
		look richer and vanish in half those conditions. Nothing here adds a stroke or a shadow to
		"fix" the ratio.
	*/
	const uid = $props.id();
	const art = $derived(instantiateSvg(variant.frozen, `${uid}-${key}`));
</script>

<div
	class="lockup"
	class:bare
	style="--disc: {disc}; --ink: {ink}; --size: {size}; --aspect: {variant.viewBox?.aspect ?? 1};"
>
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
		/* The ears read currentColor, so one declaration inks them. */
		color: var(--ink);
	}

	.bare {
		background: none;
		border-radius: 0;
	}

	.ears {
		display: block;
		width: 58%;
	}

	.bare .ears {
		width: 100%;
	}

	.ears :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
