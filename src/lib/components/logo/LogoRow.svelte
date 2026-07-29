<script lang="ts" module>
	/** Drop trailing zeros from an artboard dimension: 174.10244 → 174.1. */
	function trim(value: number): string {
		return String(Number(value.toFixed(1)));
	}
</script>

<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();

	/*
		The main logo is the plain mark on a shade — no disc, one colour. `primary` on any of the seven
		shades, since primary is part of the AA contract; `background` on a light ground.

		Three shades, not seven: adjacent shades are about 1.1:1 apart, so more than three in a
		viewport reads as noise rather than as a demonstration. These three span the ladder's reach.
	*/
	const grounds = [
		{ id: 'lightest', label: 'bg_lightest', bg: 'var(--brand-bg_lightest)' },
		{ id: 'page', label: 'background', bg: 'var(--brand-background)' },
		{ id: 'darkest', label: 'bg_darkest', bg: 'var(--brand-bg_darkest)' }
	];
</script>

<article>
	<div class="grounds">
		{#each grounds as ground (ground.id)}
			<figure style="background: {ground.bg};">
				<Mark {variant} size="4.5rem" key={ground.id} />
				<figcaption>{ground.label}</figcaption>
			</figure>
		{/each}

		<!-- Light ground: the ink becomes `background`, 15.70:1. `primary` here would be 2.23. -->
		<figure style="background: #ffffff;">
			<Mark {variant} size="4.5rem" ink="var(--brand-background)" key="onlight" />
			<figcaption class="on-light">light ground</figcaption>
		</figure>
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
				<dt>Artboard</dt>
				<dd>
					{variant.viewBox
						? `${trim(variant.viewBox.width)} × ${trim(variant.viewBox.height)}`
						: 'no viewBox'}
				</dd>
			</div>
			<div>
				<dt>On any shade</dt>
				<dd>primary — 7.06:1 on the page</dd>
			</div>
			<div>
				<dt>On a light ground</dt>
				<dd>background — 15.70:1</dd>
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
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-8));
		align-items: center;
	}

	.grounds {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-3);
	}

	figure {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: center;
		justify-content: center;
		padding: var(--space-5) var(--space-3) var(--space-3);
		margin: 0;
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-lg);
	}

	figcaption {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	/* The one light ground on the page, so the caption cannot use --fg-muted. */
	.on-light {
		color: var(--brand-background);
	}

	.heading {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}

	h3 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.badge {
		padding: 0.15rem 0.55rem;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--on-brand);
		background: var(--brand-warning);
		border-radius: var(--radius-pill);
	}

	.desc {
		max-width: 44ch;
		margin: var(--space-3) 0 0;
		color: var(--fg-muted);
	}

	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-4) var(--space-5);
		margin: var(--space-5) 0 0;
	}

	dt {
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	dd {
		margin: var(--space-1) 0 0;
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-5);
	}

	@media (max-width: 900px) {
		article {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-5);
		}

		.grounds {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
