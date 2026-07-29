<script lang="ts">
	import { instantiateSvg } from '$lib/svg';
	import type { LogoVariant } from '$lib/brand/types';

	let {
		variant,
		/** Rendered width. Height follows the artboard aspect. */
		size = '8rem',
		/**
		 * The ink. `primary` on any of the seven shades — 7.06:1 on the page shade, and AA on all of
		 * them, because primary is part of the contract. On a light ground it becomes `background`.
		 */
		ink = 'var(--brand-primary)',
		key = 'mark'
	}: {
		variant: LogoVariant;
		size?: string;
		ink?: string;
		key?: string;
	} = $props();

	/*
		THE MAIN LOGO: the mark in one colour, straight on a shade. No disc.

		A brand palette is built outward from the accent and a product palette upward from the ground,
		and this mark needs no colour of its own — picking the right existing one per ground beats any
		single compromise colour. A mid-lightness mark that cleared both grounds would score about
		4.30 and 3.65; choosing per ground gives 7.06 and 15.70.

		The two-tone cottontail-on-primary lockup is a separate, narrower case — see `Lockup.svelte`.
	*/
	const uid = $props.id();
	const art = $derived(instantiateSvg(variant.frozen, `${uid}-${key}`));
</script>

<span class="mark" style="--size: {size}; color: {ink};">
	{@html art}
</span>

<style>
	.mark {
		display: block;
		width: var(--size);
		/* The ears read currentColor, so `color` alone inks them. */
	}

	.mark :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
