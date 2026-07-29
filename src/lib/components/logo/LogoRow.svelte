<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import { instantiateSvg } from '$lib/svg';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();

	/*
		One row per variant, as the reference does — but with a difference worth being explicit
		about. The reference ships three files (colour, black, white) because its mark has baked
		colours. This mark is single-colour and its paint has been converted to `currentColor`, so
		one file covers every surface: each tile below is the SAME asset under a different CSS
		`color`. There is nothing to keep in sync.
	*/
	const tiles = [
		{ id: 'light', label: 'On light', surface: 'var(--page-bg)', ink: 'var(--brand-background)' },
		{
			id: 'dark',
			label: 'On dark',
			surface: 'var(--brand-background)',
			ink: 'var(--brand-foreground)'
		},
		{
			id: 'brand',
			label: 'On brand',
			surface: 'var(--brand-primary)',
			ink: 'var(--brand-background-darkest)'
		}
	];

	// The frozen form for a static mark is identical to the inline one; using it for animated marks
	// keeps three copies from drawing out of sync in the same row.
	const art = $derived(variant.motion === 'animated' ? variant.frozen : variant.inline);
	const aspect = $derived(variant.viewBox?.aspect ?? 1);

	/*
		Three tiles render the SAME asset, so `prepareSvg`'s per-file namespacing is not enough — it
		stops two different variants colliding, not one variant colliding with itself. Each copy gets
		a per-instance, per-tile id namespace. For a mark with no internal references (most of them,
		after id pruning) this is a no-op.
	*/
	const uid = $props.id();
	const tileArt = (slot: string) => instantiateSvg(art, `${uid}-${slot}`);

	/** Drop trailing zeros from a viewBox dimension: 174.10244 → 174.1. */
	const trim = (value: number) => String(Number(value.toFixed(1)));
</script>

<article>
	<div class="preview">
		{#each tiles as tile (tile.id)}
			<figure style="background: {tile.surface}; color: {tile.ink};">
				<div class="art" style="aspect-ratio: {aspect};">
					{@html tileArt(tile.id)}
				</div>
				<figcaption>{tile.label}</figcaption>
			</figure>
		{/each}
	</div>

	<div class="detail">
		<div class="heading">
			<h3>{variant.label}</h3>
			{#if variant.axes.status === 'wip'}
				<span class="badge">Work in progress</span>
			{/if}
		</div>

		{#if variant.description}
			<p class="desc">{variant.description}</p>
		{/if}

		<dl>
			<div>
				<dt>File</dt>
				<dd><code>{variant.file}</code></dd>
			</div>
			<div>
				<dt>Format</dt>
				<dd>
					SVG, {variant.viewBox
						? `${trim(variant.viewBox.width)}×${trim(variant.viewBox.height)}`
						: 'no viewBox'}
				</dd>
			</div>
			<div>
				<dt>Ink</dt>
				<dd>{variant.recolorable ? 'Follows CSS colour' : 'Fixed'}</dd>
			</div>
			<div>
				<dt>Minimum size</dt>
				<dd>{variant.minSize}px wide</dd>
			</div>
		</dl>

		<div class="actions">
			<CopyButton
				value={() => variant.raw}
				label="Copy SVG"
				describe={`SVG source for ${variant.label}`}
				variant="solid"
			/>
			<DownloadButton filename={variant.file} href={variant.url} label="Download" />
		</div>
	</div>
</article>

<style>
	article {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: clamp(1.5rem, 4vw, 3.5rem);
		align-items: center;
		padding-block: clamp(2rem, 4vw, 3rem);
		/*
			Always a top rule, not `article + article`. Each row is its own component instance, so a
			sibling selector never matches inside the scoped stylesheet — svelte-check flags it as
			unused, correctly. On the first row the rule simply reads as a divider under the section
			heading, which is what it should look like anyway.
		*/
		border-top: 1px solid var(--page-border);
	}

	.preview {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	figure {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
		padding: clamp(1.25rem, 3vw, 2.25rem) 1rem 0.85rem;
		margin: 0;
		border: 1px solid var(--page-border);
		border-radius: 14px;
	}

	.art {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 7rem;
	}

	.art :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}

	figcaption {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.65;
	}

	.heading {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.badge {
		padding: 0.2rem 0.6rem;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--brand-background-darkest);
		background: var(--brand-warning);
		border-radius: 999px;
	}

	.desc {
		max-width: 44ch;
		margin: 0.85rem 0 0;
		line-height: 1.6;
		color: var(--page-fg-muted);
	}

	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 1rem 1.5rem;
		margin: 1.75rem 0 0;
	}

	dt {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--page-fg-subtle);
	}

	dd {
		margin: 0.3rem 0 0;
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.75rem;
	}

	@media (max-width: 860px) {
		article {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.75rem;
		}
	}
</style>
