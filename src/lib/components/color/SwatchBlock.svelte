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

	const hex = $derived(swatch.primary[0]);
	const rest = $derived(swatch.primary.slice(1));

	/*
		"More" holds every remaining notation culori can produce, CSS-valid ones first and the
		library-only spaces after a divider. A native <details> rather than a custom dropdown: it gets
		focus, keyboard operation and expanded state from the platform, and each row is its own copy
		button rather than a <select> that could only report one value at a time.
	*/
	const cssExtra = $derived(swatch.extra.filter((n) => n.css));
	const libExtra = $derived(swatch.extra.filter((n) => !n.css));
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
		aria-label="Copy {swatch.token} hex {swatch.hex}"
		onclick={() => copy(hex.id, hex.value, `${swatch.token} hex`)}
	>
		{#if variant}
			<span class="art"
				><Mark {variant} size="1.6rem" ink="currentColor" key="sw-{swatch.token}" /></span
			>
		{/if}
		<span class="meta">
			<span class="name">{swatch.label}</span>
			<span class="hex">{swatch.hex}</span>
		</span>
		<span class="said" aria-hidden="true">{copied === hex.id ? 'Copied' : 'Copy'}</span>
	</button>

	<div class="more">
		{#each rest as format (format.id)}
			<button
				type="button"
				class:is-copied={copied === format.id}
				aria-label="Copy {swatch.token} as {format.label}: {format.value}"
				onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
			>
				{copied === format.id ? '✓' : format.label}
			</button>
		{/each}

		<details class="pick">
			<summary aria-label="More notations for {swatch.token}">More</summary>
			<div class="sheet">
				{#each cssExtra as format (format.id)}
					<button
						type="button"
						class="row"
						class:is-copied={copied === format.id}
						aria-label="Copy {swatch.token} as {format.label}: {format.value}"
						onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
					>
						<span class="rl">{format.label}</span>
						<span class="rv">{copied === format.id ? 'Copied' : format.value}</span>
					</button>
				{/each}

				{#if libExtra.length}
					<p class="divider">Not valid CSS — culori spaces</p>
					{#each libExtra as format (format.id)}
						<button
							type="button"
							class="row is-lib"
							class:is-copied={copied === format.id}
							aria-label="Copy {swatch.token} as {format.label}: {format.value}"
							onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
						>
							<span class="rl">{format.label}</span>
							<span class="rv">{copied === format.id ? 'Copied' : format.value}</span>
						</button>
					{/each}
				{/if}
			</div>
		</details>
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
		flex-wrap: wrap;
		gap: 1px;
	}

	.more > button,
	.pick > summary {
		flex: 1;
		padding: var(--space-2) var(--space-1);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 700;
		color: inherit;
		text-align: center;
		cursor: pointer;
		/* A wash of the label colour rather than a border — same hue, no extra line. */
		background: color-mix(in srgb, currentColor 12%, transparent);
		border: 0;
	}

	.more > button:hover,
	.more > button.is-copied,
	.pick > summary:hover,
	.pick[open] > summary {
		background: color-mix(in srgb, currentColor 26%, transparent);
	}

	.pick {
		flex: 1 0 100%;
	}

	.pick > summary {
		display: block;
		list-style: none;
	}

	.pick > summary::-webkit-details-marker {
		display: none;
	}

	/*
		The sheet scrolls, because there are twenty notations and the card is not tall. Capped in `em` so
		it tracks the type size rather than a fixed pixel guess.
	*/
	.sheet {
		display: grid;
		max-height: 16em;
		overflow-y: auto;
		background: color-mix(in srgb, currentColor 8%, transparent);
	}

	.row {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		justify-content: space-between;
		padding: var(--space-2) var(--space-3);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		background: none;
		border: 0;
	}

	.row:hover,
	.row.is-copied {
		background: color-mix(in srgb, currentColor 18%, transparent);
	}

	.rl {
		flex: 0 0 auto;
		font-size: var(--text-xs);
		font-weight: 700;
	}

	.rv {
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.75;
	}

	.row.is-lib .rl {
		font-weight: 600;
		opacity: 0.8;
	}

	.divider {
		padding: var(--space-3) var(--space-3) var(--space-1);
		margin: 0;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.55;
	}
</style>
