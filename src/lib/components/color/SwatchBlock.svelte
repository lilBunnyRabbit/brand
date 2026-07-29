<script lang="ts">
	import { copyText } from '$lib/clipboard.svelte';
	import type { SwatchView } from '$lib/brand/tokens';

	let { swatch }: { swatch: SwatchView } = $props();

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

<article>
	<!--
		Name and hex on the plate, and that is deliberately all — the derivation formula and the
		contrast ratio were more interesting to write than to read.

		The label colour is a binary rule rather than a luminance heuristic: shades take `foreground`,
		everything else takes `background`. Nothing else works — on the light swatches, `foreground`,
		`cottontail` and white all land between 1.0 and 2.4:1.

		The plate is a button because clicking a colour should give you its hex; the other formats are
		their own smaller buttons underneath, so one target never means four things.
	-->
	<button
		type="button"
		class="plate"
		class:is-copied={copied === hex.id}
		style="background: {swatch.hex}; color: var({swatch.labelVar});"
		aria-label="Copy {swatch.name} hex {swatch.hex}"
		onclick={() => copy(hex.id, hex.value, `${swatch.name} hex`)}
	>
		<span class="name">{swatch.name}</span>
		<span class="hex">{swatch.hex}</span>
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
				{copied === format.id ? 'Copied' : format.label}
			</button>
		{/each}
	</div>
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-lg);
	}

	.plate {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		align-items: flex-start;
		justify-content: flex-end;
		min-height: 8rem;
		padding: var(--space-4);
		font: inherit;
		text-align: left;
		cursor: pointer;
		border: 0;
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
		opacity: 0.8;
	}

	.said {
		margin-top: var(--space-2);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease);
	}

	.plate:hover .said,
	.plate:focus-visible .said,
	.plate.is-copied .said {
		opacity: 0.85;
	}

	.more {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-2);
		background: var(--surface-raised);
		border-top: 1px solid var(--fg-border);
	}

	.more button {
		flex: 1;
		padding: var(--space-2) var(--space-1);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--fg-muted);
		cursor: pointer;
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
	}

	.more button:hover {
		color: var(--brand-foreground);
		background: var(--surface-edge);
	}

	.more button.is-copied {
		color: var(--brand-success);
	}
</style>
