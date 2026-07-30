<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();
</script>

<article>
	<!-- Two grounds, not five. The mark on the page, and the one case that changes its ink. -->
	<div class="grounds">
		<figure class="dark">
			<Mark {variant} size="5.5rem" key="on-dark" />
			<figcaption>primary on background</figcaption>
		</figure>
		<figure class="light">
			<Mark {variant} size="5.5rem" ink="var(--brand-background)" key="on-light" />
			<figcaption>background on a light ground</figcaption>
		</figure>
	</div>

	<div class="detail">
		<div class="heading">
			<h3>{variant.label}</h3>
			{#if variant.axes.status === 'wip'}<span class="badge">Work in progress</span>{/if}
		</div>
		{#if variant.description}<p class="desc">{variant.description}</p>{/if}
		<p class="file"><code>{variant.file}</code></p>
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
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-8));
		align-items: center;
	}

	.grounds {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}

	figure {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		justify-content: center;
		padding: var(--space-6) var(--space-4) var(--space-4);
		margin: 0;
		border-radius: var(--radius-lg);
	}

	.dark {
		background: var(--brand-background);
		border: 1px solid var(--hairline);
	}

	.light {
		background: #ffffff;
		color: var(--brand-bg_light);
	}

	figcaption {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.light figcaption {
		color: inherit;
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
		color: var(--fg-muted);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-pill);
	}

	.desc {
		max-width: 44ch;
		margin: var(--space-3) 0 0;
		color: var(--fg-muted);
	}

	.file {
		margin: var(--space-3) 0 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	code {
		font-family: inherit;
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
	}

	@media (max-width: 720px) {
		.detail {
			text-align: center;
		}

		.heading,
		.actions {
			justify-content: center;
		}

		.desc,
		.file {
			margin-inline: auto;
		}
	}

	@media (max-width: 440px) {
		/* Two tiles at 200px each crowd the mark; one per row instead. */
		.grounds {
			grid-template-columns: minmax(0, 1fr);
		}

		figure {
			padding: var(--space-5) var(--space-3) var(--space-3);
		}
	}
</style>
