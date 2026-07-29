<script lang="ts">
	import { copyText } from '$lib/clipboard.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import type { SwatchView } from '$lib/brand/tokens';
	import type { LogoVariant } from '$lib/brand/types';

	let { swatch, variant }: { swatch: SwatchView; variant?: LogoVariant } = $props();

	let copied = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	async function copy(id: string, value: string, what: string) {
		const ok = await copyText(value, what);
		copied = ok ? id : null;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = null), 1600);
	}

	const hex = $derived(swatch.formats[0]);
	const rest = $derived(swatch.formats.slice(1));
</script>

<!--
	The whole card IS the colour. No border, no chrome around it — the swatch is the object, so it
	fills its own box and the mark sits inside it to show the colour actually carrying something.

	The label colour is a binary rule: shades take `foreground`, everything else takes `background`.
	Nothing else clears AA on both halves of the palette.
-->
<article style="background: {swatch.hex}; color: var({swatch.labelVar});">
	<button
		type="button"
		class="face"
		aria-label="Copy {swatch.name} hex {swatch.hex}"
		onclick={() => copy(hex.id, hex.value, `${swatch.name} hex`)}
	>
		{#if variant}
			<span class="art"
				><Mark {variant} size="1.6rem" ink="currentColor" key="sw-{swatch.name}" /></span
			>
		{/if}
		<span class="meta">
			<span class="name">{swatch.name}</span>
			<span class="hex">{swatch.hex}</span>
		</span>
		<span class="said" aria-hidden="true">{copied === hex.id ? 'Copied' : 'Copy'}</span>
	</button>

	<div class="more">
		{#each rest as format (format.id)}
			<button
				type="button"
				class:is-copied={copied === format.id}
				aria-label="Copy {swatch.name} as {format.label}: {format.value}"
				onclick={() => copy(format.id, format.value, `${swatch.name} ${format.label}`)}
			>
				{copied === format.id ? '✓' : format.label}
			</button>
		{/each}
	</div>
</article>

<style>
	article {
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--radius-lg);
	}

	.face {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
		justify-content: space-between;
		min-height: 8.5rem;
		padding: var(--space-4);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		background: none;
		border: 0;
	}

	.art {
		display: block;
		opacity: 0.9;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.name {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.hex {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		text-transform: uppercase;
		opacity: 0.75;
	}

	.said {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease);
	}

	.face:hover .said,
	.face:focus-visible .said {
		opacity: 0.8;
	}

	.more {
		display: flex;
		gap: 1px;
	}

	.more button {
		flex: 1;
		padding: var(--space-2) var(--space-1);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 700;
		color: inherit;
		cursor: pointer;
		/* A wash of the label colour rather than a border — same hue, no extra line. */
		background: color-mix(in srgb, currentColor 12%, transparent);
		border: 0;
	}

	.more button:hover,
	.more button.is-copied {
		background: color-mix(in srgb, currentColor 26%, transparent);
	}
</style>
