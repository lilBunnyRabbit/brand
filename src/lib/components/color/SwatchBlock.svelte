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
		The label colour is a binary rule, not a luminance heuristic: shades take `foreground`,
		everything else takes `background`. Nothing else works — on the light swatches, `foreground`,
		`cottontail` and white all land between 1.0 and 2.4:1, and on `cottontail` only `background`
		is legible. The measured ratio is printed so the rule is checkable rather than asserted.

		The plate is a div, not a button: it carries four copyable formats and one click target cannot
		mean four things. Each format below is its own real button.
	-->
	<div class="plate" style="background: {swatch.hex}; color: var({swatch.labelVar});">
		<span class="name">{swatch.name}</span>
		<span class="ratio">{swatch.labelRatio.toFixed(2)}:1</span>
		{#if swatch.outOfGamut}
			<span class="gamut">outside sRGB</span>
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
		<p class="formula">{swatch.formula}</p>
	{/if}
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--surface-raised);
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-lg);
	}

	.plate {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		align-items: baseline;
		min-height: 6.5rem;
		padding: var(--space-4);
		align-content: flex-end;
	}

	.name {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.ratio {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		opacity: 0.75;
	}

	.gamut {
		padding: 0.1rem 0.4rem;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid currentColor;
		border-radius: var(--radius-pill);
	}

	.values {
		display: flex;
		flex-direction: column;
	}

	.value {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr) auto;
		gap: var(--space-3);
		align-items: center;
		padding: var(--space-2) var(--space-4);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		background: transparent;
		border: 0;
		border-top: 1px solid var(--fg-border);
	}

	.value:hover {
		background: var(--surface-edge);
	}

	.key {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	.val {
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hint {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--fg-muted);
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
		padding: var(--space-2) var(--space-4);
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: 1.5;
		color: var(--fg-muted);
		border-top: 1px solid var(--fg-border);
	}
</style>
