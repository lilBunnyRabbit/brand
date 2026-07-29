<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Section from '$lib/components/Section.svelte';
	import BusinessCard from '$lib/components/card/BusinessCard.svelte';
	import Lockup from '$lib/components/logo/Lockup.svelte';
	import LogoRow from '$lib/components/logo/LogoRow.svelte';
	import SwatchBlock from '$lib/components/color/SwatchBlock.svelte';

	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';
	import { ladderSpan } from '$lib/brand/config/palette';
	import { prohibitions } from '$lib/brand/config/prohibitions';
	import { lockupVision, lockupVisionSpread } from '$lib/brand/vision';
	import { exportFormats, groupViews, measureContract, modifierRatio } from '$lib/brand/tokens';

	const variants = logos.variants.filter((v) => !v.hidden);
	const hero = variants[0];
	const anyWip = variants.some((v) => v.axes.status === 'wip');

	// Measured, not quoted: if the seed ever moves and the contract degrades, the page says so
	// rather than continuing to claim a number that used to be true.
	const contract = measureContract();

	const swatchCount = groupViews.reduce((n, g) => n + g.swatches.length, 0);

	// The sizes the brief says to check, because thin ear strokes at a 1.94:1 margin are the risk.
	const sizes = [16, 24, 32, 48, 64];

	const mutedOnPage = modifierRatio('foreground', 'background', 'muted');
	const mutedOnLightest = modifierRatio('foreground', 'bg_lightest', 'muted');

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
		<p class="claim">
			{swatchCount} colours, all generated from one seed —
			<code>oklch(0.255 0.0233 230.47)</code>. Nothing was hand-picked.
		</p>
		{#if anyWip}
			<p class="notice">The mark is still being drawn. Everything here is current but not final.</p>
		{/if}
	</div>

	{#if hero}
		<div class="hero-mark">
			<Lockup variant={hero} size="min(60vw, 17rem)" key="hero" />
		</div>
	{/if}
</div>

<!-- ─── Colour ─────────────────────────────────────────────────────────── -->

<Section
	id="colours"
	title="Colour"
	lede="Seven surface shades, one foreground, four brand colours, one identity colour and four states. Every one derives from the seed by formula."
>
	<div class="contract" class:holds={contract.holds}>
		<p>
			<strong>The contract.</strong> Every non-shade colour clears WCAG AA against every one of the
			seven shades — {contract.count} pairs, worst case
			<strong>{contract.worst.ratio.toFixed(2)}:1</strong>
			({contract.worst.on} on {contract.worst.shade}).
			{#if contract.holds}
				So any shade can back any section, and changing a section background never needs a contrast
				re-check.
			{:else}
				<strong>The contract is currently broken.</strong> The seed or the states have moved and the ladder
				needs re-solving.
			{/if}
		</p>
	</div>

	{#each groupViews as group (group.id)}
		<div class="group" id={group.id}>
			<div class="group-head">
				<h3>{group.label} <span class="count">{group.swatches.length}</span></h3>
				{#if group.description}<p>{group.description}</p>{/if}
			</div>
			<div class="swatches">
				{#each group.swatches as swatch (swatch.name)}
					<SwatchBlock {swatch} />
				{/each}
			</div>
		</div>
	{/each}

	<div class="group">
		<div class="group-head">
			<h3>Modifiers</h3>
			<p>
				Interaction and de-emphasis are opacity on an existing colour, never a new colour.
				Composited in gamma sRGB, which is what a browser paints.
			</p>
		</div>
		<ul class="mods">
			<li><code>hover</code> 85%</li>
			<li><code>active</code> 70%</li>
			<li>
				<code>muted</code> 65% — {mutedOnPage.toFixed(2)}:1 here, {mutedOnLightest.toFixed(2)}:1 on
				the lightest shade
			</li>
			<li><code>disabled</code> 38%</li>
			<li><code>border</code> 67% — the lowest alpha clearing 3:1 on every shade</li>
		</ul>
		<p class="warn">
			Muted text is the one place the contract does not hold: AA-large at best. Captions and
			metadata only, and keep it off the lightest two shades.
		</p>
	</div>
</Section>

<!-- ─── Logo ───────────────────────────────────────────────────────────── -->

<Section
	id="logo"
	title="Logo"
	lede="Cottontail ears on a primary disc. The two differ in lightness rather than hue, which is why the mark survives greyscale and colour blindness almost unchanged."
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

		{#if hero}
			<div class="group">
				<div class="group-head">
					<h3>Minimum size</h3>
					<p>
						The ear strokes are thin and the lockup runs at 1.94:1, a narrow margin. If they mush at
						favicon size the fix is a heavier stroke, not a different colour.
					</p>
				</div>
				<div class="ladder">
					{#each sizes as size (size)}
						<div class="rung">
							<Lockup variant={hero} size="{size}px" key="size-{size}" />
							<span>{size}px</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="group">
				<div class="group-head">
					<h3>Under simulation</h3>
					<p>
						Measured with culori's Machado matrices. The spread across every condition is {lockupVisionSpread.toFixed(
							2
						)} — the mark barely moves, because the separation is carried by lightness.
					</p>
				</div>
				<div class="vision">
					{#each lockupVision as v (v.id)}
						<figure>
							<Lockup
								variant={hero}
								size="4.5rem"
								disc={v.discHex}
								ink={v.inkHex}
								key="vision-{v.id}"
							/>
							<figcaption>
								<span>{v.label}</span>
								<span class="mono">{v.ratio.toFixed(2)}:1</span>
							</figcaption>
						</figure>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</Section>

<!-- ─── Business card ──────────────────────────────────────────────────── -->

{#if hero}
	<Section
		id="card"
		title="Business card"
		lede="Front carries a small mark and the wordmark; back is the lockup alone, centred. Both faces are shades — never a brand fill, since the disc is already primary."
	>
		<BusinessCard variant={hero} />
	</Section>
{/if}

<!-- ─── Don't ──────────────────────────────────────────────────────────── -->

<Section
	id="rules"
	title="Don't"
	lede="Most of these exist because equal lightness makes two colours invisible against each other. The measured ratio is given for each."
>
	<div class="dont-demo">
		<div class="demo">
			<div class="bad">
				<span class="chip primary">primary</span><span class="chip accent">accent</span><span
					class="chip secondary">secondary</span
				>
			</div>
			<p><strong>Don't.</strong> Brand colours touching — roughly 1:1, so the edges vanish.</p>
		</div>
		<div class="demo">
			<div class="good">
				<span class="chip primary">primary</span><span class="chip accent">accent</span><span
					class="chip secondary">secondary</span
				>
			</div>
			<p><strong>Do.</strong> Separated by a gap of the page shade.</p>
		</div>
	</div>

	<ul class="rules">
		{#each prohibitions as rule (rule.id)}
			<li class={rule.severity}>
				<span class="mark" aria-hidden="true">{rule.severity === 'never' ? '✕' : '!'}</span>
				<div>
					<p class="rule">{rule.rule}</p>
					<p class="why">{rule.why}</p>
				</div>
			</li>
		{/each}
	</ul>
</Section>

<!-- ─── Assets ─────────────────────────────────────────────────────────── -->

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
			<label class="fchip" class:is-on={format === f.id}>
				<input type="radio" name="format" value={f.id} bind:group={format} />
				{f.label}
			</label>
		{/each}
	</div>

	<!--
		A native <details> rather than a fixed-height scroll box. A scrollable region has to be
		keyboard-scrollable (WCAG 2.1.1), which means a tabindex on a non-interactive element — a
		genuine a11y smell, not just a lint complaint. <details> gets focus, keyboard operation and
		expanded state from the platform, and keeps a long dump from burying the page. Copy and
		Download sit outside it, so nothing has to be expanded to be reachable.
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
		<a href={meta.assetsUrl}>{meta.assetsUrl.replace('https://github.com/', '')}</a>. The ladder
		reaches ±{ladderSpan} in lightness either side of the seed.
	</p>
</Section>

<style>
	/* ── hero ── */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: clamp(var(--space-6), 5vw, var(--space-8));
		align-items: center;
		padding-block: clamp(var(--space-8), 10vw, 7rem);
	}

	.eyebrow {
		margin: 0 0 var(--space-4);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	h1 {
		margin: 0;
		font-size: var(--text-hero);
		font-weight: 800;
		line-height: 0.92;
		letter-spacing: -0.04em;
		/* Display-scale text on any shade is cottontail's second job. */
		color: var(--brand-cottontail);
	}

	.lede {
		max-width: 46ch;
		margin: var(--space-5) 0 0;
		font-size: var(--text-lg);
		line-height: 1.55;
	}

	.claim {
		max-width: 46ch;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.notice {
		max-width: 46ch;
		padding: var(--space-3) var(--space-4);
		margin: var(--space-5) 0 0;
		font-size: var(--text-sm);
		border: 1px solid var(--brand-warning);
		border-radius: var(--radius-md);
	}

	.hero-mark {
		display: grid;
		place-items: center;
	}

	/* ── contract banner ── */
	.contract {
		padding: var(--space-4) var(--space-5);
		margin-bottom: var(--space-8);
		border: 1px solid var(--brand-error);
		border-radius: var(--radius-md);
	}

	.contract.holds {
		border-color: var(--brand-success);
	}

	.contract p {
		max-width: 78ch;
		margin: 0;
		font-size: var(--text-sm);
	}

	/* ── groups ── */
	.group + .group {
		margin-top: clamp(var(--space-6), 5vw, var(--space-8));
	}

	.group-head h3 {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.count {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--fg-muted);
	}

	.group-head p {
		max-width: 68ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.mods {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-2) var(--space-5);
		padding: 0;
		margin: var(--space-5) 0 0;
		font-size: var(--text-sm);
		list-style: none;
	}

	.warn {
		max-width: 68ch;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--brand-warning);
	}

	/* ── size ladder ── */
	.ladder {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		align-items: flex-end;
		padding: var(--space-5);
		margin-top: var(--space-5);
		background: var(--surface-well);
		border-radius: var(--radius-lg);
	}

	.rung {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: center;
	}

	.rung span {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	/* ── vision ── */
	.vision {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.vision figure {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: center;
		padding: var(--space-4);
		margin: 0;
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-lg);
	}

	.vision figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: var(--text-xs);
		text-align: center;
	}

	.mono {
		font-family: var(--font-mono);
		color: var(--fg-muted);
	}

	/* ── don't ── */
	.dont-demo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: var(--space-5);
		margin-bottom: var(--space-8);
	}

	.demo p {
		margin: var(--space-3) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.bad,
	.good {
		display: flex;
		padding: var(--space-5);
		background: var(--surface-well);
		border-radius: var(--radius-lg);
	}

	/* No gap: the whole point is that the boundaries disappear. */
	.bad {
		gap: 0;
	}

	.good {
		gap: var(--space-3);
	}

	.chip {
		padding: var(--space-2) var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		/* Text on a brand fill is always the page shade. Never white. */
		color: var(--on-brand);
	}

	.good .chip {
		border-radius: var(--radius-sm);
	}

	.primary {
		background: var(--brand-primary);
	}

	.accent {
		background: var(--brand-accent);
	}

	.secondary {
		background: var(--brand-secondary);
	}

	.rules {
		display: grid;
		gap: var(--space-4);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.rules li {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr);
		gap: var(--space-3);
		padding-top: var(--space-4);
		border-top: 1px solid var(--fg-border);
	}

	/* Severity is carried by the glyph as well as by the colour. */
	.rules .mark {
		font-family: var(--font-mono);
		font-weight: 700;
		text-align: center;
	}

	.never .mark {
		color: var(--brand-error);
	}

	.care .mark {
		color: var(--brand-warning);
	}

	.rule {
		margin: 0;
		font-weight: 600;
	}

	.why {
		max-width: 78ch;
		margin: var(--space-1) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* ── assets ── */
	.formats {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.fchip {
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-pill);
	}

	.fchip input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.fchip:hover {
		border-color: var(--brand-foreground);
	}

	.fchip:has(input:focus-visible) {
		outline: 2px solid var(--brand-info);
		outline-offset: 2px;
	}

	.fchip.is-on {
		color: var(--on-brand);
		background: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.code {
		background: var(--surface-well);
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-lg);
	}

	summary {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.lines {
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	pre {
		padding: 0 var(--space-4) var(--space-4);
		margin: 0;
		overflow-x: auto;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.sources {
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.empty {
		padding: var(--space-6);
		margin: 0;
		color: var(--fg-muted);
		text-align: center;
		border: 1px dashed var(--fg-border);
		border-radius: var(--radius-lg);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	@media (max-width: 900px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
		}

		.hero-mark {
			order: -1;
			justify-items: start;
		}
	}
</style>
