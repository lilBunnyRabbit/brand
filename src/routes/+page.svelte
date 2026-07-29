<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Section from '$lib/components/Section.svelte';
	import LogoRow from '$lib/components/logo/LogoRow.svelte';
	import SwatchBlock from '$lib/components/color/SwatchBlock.svelte';

	import { instantiateSvg } from '$lib/svg';
	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';
	import { exportFormats, groupViews } from '$lib/brand/tokens';

	const variants = logos.variants.filter((v) => !v.hidden);
	const hero = variants[0];
	const anyWip = variants.some((v) => v.axes.status === 'wip');

	// The hero renders the same mark the header and the logo tiles do, so it needs its own
	// id namespace. A no-op for a mark with no internal references.
	const uid = $props.id();

	let format = $state(exportFormats[0].id);
	const active = $derived(exportFormats.find((f) => f.id === format) ?? exportFormats[0]);
	const rendered = $derived(active.render());
</script>

<svelte:head>
	<title>{meta.name} — brand assets</title>
	<meta name="description" content={meta.description} />
	<meta property="og:title" content="{meta.name} — brand assets" />
	<meta property="og:description" content={meta.description} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="hero">
	<div class="copy">
		<p class="eyebrow">Brand assets</p>
		<h1>{meta.tagline}</h1>
		<p class="lede">{meta.description}</p>
		{#if anyWip}
			<p class="notice">
				The mark is still being drawn. Everything here is current but not final — treat it as a work
				in progress rather than a released identity.
			</p>
		{/if}
	</div>

	{#if hero}
		<div class="hero-mark">
			{@html instantiateSvg(hero.inline, `${uid}-hero`)}
		</div>
	{/if}
</div>

<Section
	id="logo"
	title="Logo"
	lede="One file, single-colour, painted with currentColor — so it takes the colour of whatever it sits on instead of shipping a separate version per background."
>
	{#if variants.length === 0}
		<p class="empty">
			No marks yet. Drop an <code>.svg</code> into <code>src/lib/brand/logos/</code> and it appears here
			— no code changes needed.
		</p>
	{:else}
		{#each variants as variant (variant.id)}
			<LogoRow {variant} />
		{/each}
	{/if}
</Section>

<Section
	id="colours"
	title="Colours"
	lede="Every colour derives from one seed — background, oklch(0.255 0.0233 230.47). Change the seed and the whole scheme moves with it."
>
	{#each groupViews as group (group.id)}
		<div class="group" id={group.id}>
			<div class="group-head">
				<h3>{group.label}</h3>
				{#if group.description}<p>{group.description}</p>{/if}
			</div>
			<div class="swatches">
				{#each group.swatches as swatch (swatch.name)}
					<SwatchBlock {swatch} />
				{/each}
			</div>
		</div>
	{/each}
</Section>

<Section id="assets" title="Assets" lede="The palette in the format you need it in.">
	{#snippet actions()}
		<DownloadButton
			filename={active.filename}
			content={() => rendered}
			type={active.id === 'json' ? 'application/json' : 'text/plain'}
			label="Download"
		/>
		<CopyButton
			value={() => rendered}
			label="Copy"
			describe="the palette as {active.label}"
			variant="solid"
		/>
	{/snippet}

	<div class="formats" role="group" aria-label="Export format">
		{#each exportFormats as f (f.id)}
			<label class="chip" class:is-on={format === f.id}>
				<input type="radio" name="format" value={f.id} bind:group={format} />
				{f.label}
			</label>
		{/each}
	</div>

	<!--
		A native <details> rather than a fixed-height scroll box.

		A scrollable region has to be keyboard-scrollable (WCAG 2.1.1), which means a tabindex on a
		non-interactive element — and that is a genuine a11y smell, not just a lint complaint. <details>
		gets focus handling, keyboard operation and expanded state from the platform for nothing, and
		it keeps a 70-line JSON dump from burying the rest of the page. Copy and Download sit outside
		it, so the content is reachable without expanding anything.
	-->
	<details class="code">
		<summary>
			<span>{active.filename}</span>
			<span class="lines">{rendered.trimEnd().split('\n').length} lines</span>
		</summary>
		<pre><code>{rendered}</code></pre>
	</details>

	<p class="sources">
		Source SVGs live in the repo:
		<a href={meta.assetsUrl}>{meta.assetsUrl.replace('https://github.com/', '')}</a>
	</p>
</Section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: clamp(2rem, 5vw, 4rem);
		align-items: center;
		padding-block: clamp(3.5rem, 10vw, 8rem);
	}

	.eyebrow {
		margin: 0 0 1rem;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--page-fg-subtle);
	}

	h1 {
		margin: 0;
		font-size: clamp(2.75rem, 8vw, 5rem);
		font-weight: 800;
		line-height: 0.95;
		letter-spacing: -0.04em;
	}

	.lede {
		max-width: 46ch;
		margin: 1.5rem 0 0;
		font-size: 1.125rem;
		line-height: 1.6;
		color: var(--page-fg-muted);
	}

	.notice {
		max-width: 46ch;
		padding: 0.85rem 1rem;
		margin: 1.75rem 0 0;
		font-size: 0.875rem;
		line-height: 1.55;
		border: 1px solid var(--brand-warning);
		border-radius: 12px;
	}

	.hero-mark {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		padding: clamp(1.5rem, 5vw, 3rem);
		color: var(--brand-foreground);
		background: var(--brand-background);
		border-radius: 24px;
	}

	.hero-mark :global(svg) {
		display: block;
		width: 100%;
		max-width: 14rem;
		height: auto;
	}

	.empty {
		padding: 2rem;
		margin: 0;
		color: var(--page-fg-muted);
		text-align: center;
		border: 1px dashed var(--page-border);
		border-radius: 14px;
	}

	.group + .group {
		margin-top: clamp(2.5rem, 5vw, 4rem);
	}

	.group-head h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.group-head p {
		max-width: 60ch;
		margin: 0.5rem 0 0;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--page-fg-muted);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	/* Real radios, visually hidden: native arrow-key navigation and grouping, no custom a11y JS. */
	.formats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.chip {
		padding: 0.45rem 0.9rem;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid var(--page-border);
		border-radius: 999px;
	}

	.chip input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.chip:hover {
		border-color: var(--page-fg);
	}

	.chip:has(input:focus-visible) {
		outline: 2px solid var(--brand-info);
		outline-offset: 2px;
	}

	.chip.is-on {
		color: var(--page-bg);
		background: var(--page-fg);
		border-color: var(--page-fg);
	}

	.code {
		background: var(--page-surface);
		border: 1px solid var(--page-border);
		border-radius: 14px;
	}

	summary {
		display: flex;
		gap: 0.75rem;
		align-items: baseline;
		justify-content: space-between;
		padding: 0.85rem 1.25rem;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.lines {
		font-size: 0.75rem;
		color: var(--page-fg-subtle);
	}

	pre {
		padding: 0 1.25rem 1.25rem;
		margin: 0;
		overflow-x: auto;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		line-height: 1.65;
	}

	.sources {
		margin: 1.25rem 0 0;
		font-size: 0.875rem;
		color: var(--page-fg-muted);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.875em;
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
		}

		.hero-mark {
			order: -1;
			aspect-ratio: 16 / 10;
		}
	}
</style>
