<script lang="ts">
	import Mark from './Mark.svelte';
	import type { WordmarkLockup } from '$lib/brand/config/wordmarks';
	import type { LogoVariant } from '$lib/brand/types';

	let {
		variant,
		lockup,
		/** The MARK's width. Everything else is a multiple of it, so a lockup scales as one object. */
		size = '3rem',
		ink = 'var(--brand-primary)'
	}: {
		variant: LogoVariant;
		lockup: WordmarkLockup;
		size?: string;
		ink?: string;
	} = $props();

	/*
		The name, set live rather than exported.

		There is no wordmark file, and until one of these is chosen there should not be: the name is set in
		`--font-mono`, which is Hack, which is already loaded for every hex and formula on the page. So a
		lockup costs nothing to add and nothing to change, and what you are judging is the real type at the
		real weight rather than a picture of it.

		Both the gap and the type size are fractions of the mark rather than `--space-*` steps, because a
		lockup has to hold together at 16px and at 400px. A fixed 1rem gap is invisible at one end and a
		canyon at the other.
	*/
	const TONE = {
		ink: 'var(--brand-foreground)',
		quiet: 'var(--fg-muted)',
		brand: 'var(--brand-primary)'
	} as const;

	const textAlign = $derived(lockup.align === 'center' ? 'center' : 'left');
</script>

<div
	class="lockup"
	class:is-stack={lockup.layout === 'stack'}
	class:is-reverse={lockup.layout === 'row-reverse'}
	style="--size: {size}; --scale: {lockup.scale}; --tracking: {lockup.tracking};
		--weight: {lockup.weight}; --leading: {lockup.leading ?? 1.1}; --text-align: {textAlign};
		align-items: {lockup.align};{lockup.transform ? ` text-transform: ${lockup.transform};` : ''}"
>
	<Mark {variant} {size} {ink} key="wm-{lockup.id}" />

	<!--
		One <p>, so the name is a single string to a screen reader and to anyone selecting it. The parts are
		spans inside it — the segmentation is a typographic device, not structure.
	-->
	<p class="name">
		{#each lockup.parts as part, i (i)}{#if part.newline}<br />{/if}<span
				style="color: {TONE[part.tone]};">{part.text}</span
			>{/each}
	</p>
</div>

<style>
	.lockup {
		display: flex;
		gap: calc(var(--size) * 0.28);
		width: fit-content;
	}

	.is-stack {
		flex-direction: column;
		gap: calc(var(--size) * 0.2);
	}

	/*
		`row-reverse` rather than reordering the markup: the mark stays first in the DOM, so the reading
		order is identical in every variation and only the paint order changes.
	*/
	.is-reverse {
		flex-direction: row-reverse;
	}

	.name {
		margin: 0;
		font-family: var(--font-mono);
		/* Sized off the mark, so one number drives the whole lockup. */
		font-size: calc(var(--size) * var(--scale));
		font-weight: var(--weight);
		line-height: var(--leading);
		letter-spacing: var(--tracking);
		text-align: var(--text-align);
		white-space: nowrap;
	}
</style>
