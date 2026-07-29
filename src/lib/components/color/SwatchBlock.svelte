<script lang="ts">
	import { copyText } from '$lib/clipboard.svelte';
	import type { SwatchView } from '$lib/brand/tokens';

	let { swatch }: { swatch: SwatchView } = $props();

	let copied = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	async function copy(format: { id: string; label: string; value: string }) {
		const ok = await copyText(format.value, `${swatch.name} ${format.label}`);
		copied = ok ? format.id : null;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = null), 1600);
	}
</script>

<article>
	<!--
		The colour plate itself. It is a plain div rather than a button: the plate carries four
		copyable formats, and one click target cannot mean four things. Each format below is its own
		real button, which is also what makes the whole card keyboard-reachable without any custom
		key handling.
	-->
	<div class="plate" class:on-light={swatch.needsDarkText} style="background: {swatch.hex};">
		<span class="name">{swatch.name}</span>
		{#if swatch.outOfGamut}
			<span class="gamut" title="Marginally outside sRGB; clamps to {swatch.color.gamutMapped.hex}">
				outside sRGB
			</span>
		{/if}
	</div>

	<div class="values">
		{#each swatch.formats as format (format.id)}
			<button
				type="button"
				class="value"
				class:is-copied={copied === format.id}
				aria-label="Copy {swatch.name} as {format.label}: {format.value}"
				onclick={() => copy(format)}
			>
				<span class="key">{format.label}</span>
				<span class="val">{format.value}</span>
				<span class="hint" aria-hidden="true">{copied === format.id ? 'Copied' : 'Copy'}</span>
			</button>
		{/each}
	</div>

	{#if swatch.formula}
		<p class="formula" title="How this colour is derived from the seed">{swatch.formula}</p>
	{/if}
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--page-border);
		border-radius: 14px;
	}

	.plate {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		align-items: flex-start;
		justify-content: flex-end;
		min-height: 7.5rem;
		padding: 1rem;
		/* Default assumption is a dark swatch, so light text. */
		color: #ffffff;
	}

	.plate.on-light {
		color: var(--brand-background-darkest);
	}

	.name {
		font-size: 0.9375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.gamut {
		padding: 0.15rem 0.45rem;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: rgb(255 255 255 / 0.22);
		border-radius: 999px;
	}

	.values {
		display: flex;
		flex-direction: column;
	}

	.value {
		display: grid;
		grid-template-columns: 3.75rem minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.55rem 0.85rem;
		font: inherit;
		text-align: left;
		cursor: pointer;
		background: transparent;
		border: 0;
		border-top: 1px solid var(--page-border);
	}

	.value:hover {
		background: var(--page-surface);
	}

	.key {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--page-fg-subtle);
	}

	.val {
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hint {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--page-fg-subtle);
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease);
	}

	.value:hover .hint,
	.value:focus-visible .hint {
		opacity: 1;
	}

	.is-copied .hint {
		color: var(--brand-success);
		opacity: 1;
	}

	.formula {
		padding: 0.6rem 0.85rem;
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		line-height: 1.5;
		color: var(--page-fg-subtle);
		border-top: 1px solid var(--page-border);
	}
</style>
