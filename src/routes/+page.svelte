<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Section from '$lib/components/Section.svelte';
	import BusinessCard from '$lib/components/card/BusinessCard.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import Lockup from '$lib/components/logo/Lockup.svelte';
	import LogoRow from '$lib/components/logo/LogoRow.svelte';
	import SwatchBlock from '$lib/components/color/SwatchBlock.svelte';

	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';
	import { swatches } from '$lib/brand/config/palette';
	import { logoCombos, plainInks } from '$lib/brand/config/logo-combos';
	import { logoStory } from '$lib/brand/config/logo-story';
	import { prohibitions } from '$lib/brand/config/prohibitions';
	import { lockupVision, lockupVisionSpread } from '$lib/brand/vision';
	import {
		exportFormats,
		groupViews,
		measureContract,
		modifierRatio,
		varName
	} from '$lib/brand/tokens';
	import { contrastRatio } from '$lib/color';

	const variants = logos.variants.filter((v) => !v.hidden);
	const hero = variants[0];
	const anyWip = variants.some((v) => v.axes.status === 'wip');

	// Measured, not quoted: if the seed ever moves and the contract degrades, the page says so
	// rather than continuing to claim a number that used to be true.
	const contract = measureContract();

	// The sizes the brief says to check, because thin ear strokes at a 1.94:1 margin are the risk.
	const sizes = [16, 24, 32, 48, 64];

	// Ratios measured from the palette rather than written down, so they cannot drift.
	const combos = logoCombos.map((combo) => ({
		...combo,
		groundVar: `var(${varName(combo.ground)})`,
		inkVar: `var(${varName(combo.ink)})`,
		ratio: contrastRatio(swatches[combo.ink], swatches[combo.ground])
	}));

	const inks = plainInks.map((entry) => ({
		...entry,
		inkVar: `var(${varName(entry.ink)})`
	}));

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
		{#if anyWip}
			<p class="notice">Still being drawn — current, not final.</p>
		{/if}
	</div>

	{#if hero}
		<div class="hero-mark">
			<Mark variant={hero} size="min(52vw, 14rem)" key="hero" />
		</div>
	{/if}
</div>

<!-- ─── Colour ─────────────────────────────────────────────────────────── -->

<Section
	id="colours"
	index="01"
	accent="secondary"
	title="Colour"
	lede="Seventeen colours, all grown from a single starting colour."
>
	<div class="seed">
		<div class="seed-copy">
			<p class="seed-eyebrow">One number in, seventeen out</p>
			<h3>
				Everything here comes out of
				<code>oklch(0.255 0.0233 230.47)</code>
			</h3>
			<p>
				Not a mood board. Every other colour is a formula against that one — invert its lightness
				for text, multiply its chroma by three for primary, by six for the states, step its
				lightness up and down for the seven backgrounds. Change the seed and all seventeen move
				together, still in tune.
			</p>
			<p class="seed-proof" class:bad={!contract.holds}>
				{#if contract.holds}
					And they stay readable: {contract.count} colour-on-background combinations, the closest still
					comfortable at {contract.worst.ratio.toFixed(2)}:1. Pick whatever feels right.
				{:else}
					{contract.worst.on} on {contract.worst.shade} is down to {contract.worst.ratio.toFixed(
						2
					)}:1 — the seed has moved and the shades need re-solving.
				{/if}
			</p>
		</div>

		<ol class="chain">
			<li style="background: var(--brand-background); color: var(--brand-foreground);">
				<span class="chain-name">background</span>
				<span class="chain-formula">the seed</span>
			</li>
			<li style="background: var(--brand-foreground); color: var(--brand-background);">
				<span class="chain-name">foreground</span>
				<span class="chain-formula">1 − L, C ÷ 3, H + 180</span>
			</li>
			<li style="background: var(--brand-tertiary); color: var(--brand-background);">
				<span class="chain-name">tertiary</span>
				<span class="chain-formula">C × 1</span>
			</li>
			<li style="background: var(--brand-secondary); color: var(--brand-background);">
				<span class="chain-name">secondary</span>
				<span class="chain-formula">C × 2</span>
			</li>
			<li style="background: var(--brand-primary); color: var(--brand-background);">
				<span class="chain-name">primary</span>
				<span class="chain-formula">C × 3</span>
			</li>
			<li style="background: var(--brand-accent); color: var(--brand-background);">
				<span class="chain-name">accent</span>
				<span class="chain-formula">C × 4</span>
			</li>
			<li style="background: var(--brand-error); color: var(--brand-background);">
				<span class="chain-name">states</span>
				<span class="chain-formula">C × 6</span>
			</li>
		</ol>
	</div>

	{#each groupViews as group (group.id)}
		<div class="group" id={group.id}>
			<div class="group-head">
				<h3>{group.label} <span class="count">{group.swatches.length}</span></h3>
				{#if group.description}<p>{group.description}</p>{/if}
			</div>
			<div class="swatches">
				{#each group.swatches as swatch (swatch.name)}
					<SwatchBlock {swatch} variant={hero} />
				{/each}
			</div>
		</div>
	{/each}

	<!-- The one colour with a single job, on the one ground it is allowed on. -->
	<div class="cotton">
		<div class="cotton-art">
			<Lockup variant={hero} size="7rem" key="cotton" />
		</div>
		<div class="cotton-copy">
			<p class="cotton-eyebrow">The special one</p>
			<h3>cottontail</h3>
			<p>
				The brightest thing in the system, named after the flash of a rabbit's tail. It has exactly
				one job — the mark on a primary badge — and it is never text. On primary it measures 1.94:1,
				which is fine for a logo and nothing else.
			</p>
			<p class="cotton-hex"><code>#e0f9ab</code> · <code>oklch(0.945 0.10332 122.47)</code></p>
		</div>
	</div>

	<div class="group">
		<div class="group-head">
			<h3>Modifiers</h3>
			<p>
				Need something quieter, or a hover state? Turn one of these down rather than reaching for a
				new colour.
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

<!-- ─── The idea ───────────────────────────────────────────────────────── -->

{#if hero}
	<Section
		id="idea"
		index="02"
		accent="tertiary"
		title="The idea"
		lede="It is a rabbit nose, not a rabbit head."
	>
		<div class="idea">
			<div class="idea-art">
				<Mark variant={hero} size="min(38vw, 8.5rem)" key="idea" />
			</div>
			<div class="idea-copy">
				<p>
					The Y of a rabbit's philtrum is the whole logic. Reduce it, mirror it, thicken it into an
					inner curve, then let a lower curl carry the whisker pad.
				</p>
				<p class="idea-rule">{logoStory.rule}</p>
			</div>
		</div>

		<ol class="steps">
			{#each logoStory.steps as step (step.n)}
				<li>
					<span class="step-n">{step.n}</span>
					<span class="step-title">{step.title}</span>
					<span class="step-body">{step.body}</span>
				</li>
			{/each}
		</ol>
	</Section>
{/if}

<!-- ─── Logo ───────────────────────────────────────────────────────────── -->

<Section
	id="logo"
	index="03"
	accent="primary"
	title="Logo"
	lede="Most of the time it is just the mark, in one colour, on whatever it is sitting on."
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
					<h3>Which colour</h3>
					<p>Three combinations. The first is the one you want almost every time.</p>
				</div>

				<div class="combos">
					{#each combos as combo (combo.id)}
						<figure style="background: {combo.kind === 'plain' ? combo.groundVar : 'transparent'};">
							{#if combo.kind === 'plain'}
								<Mark variant={hero} size="4rem" ink={combo.inkVar} key="combo-{combo.id}" />
							{:else}
								<Lockup
									variant={hero}
									size="5rem"
									disc={combo.groundVar}
									ink={combo.inkVar}
									key="combo-{combo.id}"
								/>
							{/if}
							<figcaption>
								<span class="combo-label">{combo.label}</span>
								<span class="combo-ratio">
									{combo.ratio.toFixed(2)}:1{combo.exempt ? ' · logo only' : ''}
								</span>
								<span class="combo-note">{combo.note}</span>
							</figcaption>
						</figure>
					{/each}
				</div>

				<ul class="inks">
					{#each inks as entry (entry.id)}
						<li>
							<span class="dot" style="background: {entry.inkVar};"></span>
							<code>{entry.ink}</code>
							<span>{entry.note}</span>
						</li>
					{/each}
				</ul>
			</div>

			<div class="group">
				<div class="group-head">
					<h3>Small sizes</h3>
					<p>It is a thin mark. Worth a look before it ends up in a favicon.</p>
				</div>
				<div class="ladder">
					{#each sizes as size (size)}
						<div class="rung">
							<Mark variant={hero} size="{size}px" key="size-{size}" />
							<span>{size}px</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="group">
				<div class="group-head">
					<h3>It holds up</h3>
					<p>
						In greyscale and all three kinds of colour blindness, the badge shifts by at most {lockupVisionSpread.toFixed(
							2
						)} — because the two colours differ in brightness, not hue.
					</p>
				</div>
				<div class="vision">
					{#each lockupVision as v (v.id)}
						<figure>
							<Lockup
								variant={hero}
								size="4rem"
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
		index="04"
		accent="accent"
		title="Business card"
		lede="Front and back. Nothing fancy."
	>
		<BusinessCard variant={hero} />
	</Section>
{/if}

<!-- ─── Don't ──────────────────────────────────────────────────────────── -->

<Section
	id="rules"
	index="05"
	accent="tertiary"
	title="Don't"
	lede="A short list, and most of it comes down to one thing: the brand colours are all the same brightness, so they disappear against each other."
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

<Section
	id="assets"
	index="06"
	accent="secondary"
	title="Assets"
	lede="Grab the palette however you need it."
>
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
		<a href={meta.assetsUrl}>{meta.assetsUrl.replace('https://github.com/', '')}</a>.
	</p>
</Section>

<style>
	/* ── hero ── */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: clamp(var(--space-6), 5vw, var(--space-8));
		align-items: center;
		padding-block: clamp(var(--space-6), 6vw, 4.5rem) clamp(var(--space-6), 6vw, 4rem);
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
		/* primary, not cottontail: cottontail is ink on a primary ground and never text. */
		color: var(--brand-primary);
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

	/* Between the two extremes: a rule in warning, and full-strength text. */
	.notice {
		padding-left: var(--space-3);
		margin: var(--space-5) 0 0;
		font-size: var(--text-base);
		color: var(--brand-foreground);
		border-left: 2px solid var(--brand-warning);
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
		margin-top: clamp(var(--space-6), 4vw, var(--space-8));
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
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.mods {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: var(--space-1) var(--space-6);
		padding: 0;
		margin: var(--space-5) 0 0;
		font-size: var(--text-base);
		list-style: none;
	}

	.mods li {
		display: grid;
		grid-template-columns: 6.5rem minmax(0, 1fr);
		gap: var(--space-3);
		align-items: baseline;
		padding: var(--space-2) 0;
		border-top: 1px solid var(--hairline);
	}

	.mods code {
		font-weight: 700;
		color: var(--brand-secondary);
	}

	.warn {
		max-width: 68ch;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--brand-warning);
	}

	/* ── the seed / maths ── */
	.seed {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-8));
		align-items: center;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-bottom: clamp(var(--space-6), 5vw, var(--space-8));
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.seed-eyebrow {
		margin: 0 0 var(--space-2);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--brand-secondary);
	}

	.seed h3 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.seed h3 code {
		color: var(--brand-primary);
		/* The oklch() literal is longer than a phone is wide. */
		overflow-wrap: anywhere;
	}

	.seed-copy p {
		max-width: 52ch;
		margin: var(--space-3) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.seed-proof {
		color: var(--brand-primary) !important;
	}

	.seed-proof.bad {
		color: var(--brand-error) !important;
	}

	/*
		Gaps, not a solid stack. tertiary, secondary, primary and accent are all the same lightness, so
		butted together their edges vanish — the page shade between them is what makes this readable at
		all. It is the rule this very section is explaining.
	*/
	.chain {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.chain li {
		border-radius: var(--radius-sm);
	}

	.chain li {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-3);
		align-items: baseline;
		justify-content: space-between;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
	}

	.chain-name {
		font-family: var(--font-mono);
		font-weight: 700;
	}

	.chain-formula {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		opacity: 0.85;
	}

	/* ── cottontail feature ── */
	/* Followed by a .group, which only spaces itself after another .group. */
	.cotton + .group {
		margin-top: clamp(var(--space-6), 5vw, var(--space-8));
	}

	.cotton {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-6));
		align-items: center;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-top: clamp(var(--space-6), 5vw, var(--space-8));
		background: var(--brand-bg_lighter);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.cotton-eyebrow {
		margin: 0 0 var(--space-2);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--brand-accent);
	}

	.cotton h3 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--brand-cottontail);
	}

	.cotton-copy p {
		max-width: 62ch;
		margin: var(--space-3) 0 0;
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	.cotton-hex {
		font-size: var(--text-sm) !important;
	}

	.cotton-hex code {
		font-family: var(--font-mono);
	}

	/* ── the idea ── */

	.idea {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(var(--space-5), 5vw, var(--space-8));
		align-items: center;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-bottom: var(--space-5);
		/* The darkest shade — the panel that made the mark read, kept. */
		background: var(--brand-bg_darkest);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.idea-art {
		color: var(--brand-primary);
	}

	.idea-copy p {
		max-width: 56ch;
		margin: 0;
		font-size: var(--text-lg);
		line-height: 1.55;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
		gap: var(--space-3);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.idea-rule {
		margin: var(--space-4) 0 0 !important;
		font-size: var(--text-base) !important;
		color: var(--brand-tertiary);
	}

	.steps li {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-md);
	}

	.step-n {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--brand-tertiary);
	}

	.step-title {
		font-weight: 700;
	}

	.step-body {
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	/* ── logo combos ── */
	.combos {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.combos figure {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
		padding: var(--space-5);
		margin: 0;
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.combos figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.combo-label {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.combo-ratio {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.combo-note {
		max-width: 34ch;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.inks {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: var(--space-5) 0 0;
		font-size: var(--text-sm);
		list-style: none;
	}

	.inks li {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		color: var(--fg-muted);
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
	}

	.quiet {
		color: var(--fg-muted);
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
		border: 1px solid var(--hairline);
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
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
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
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
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
		padding: clamp(var(--space-3), 4vw, var(--space-5));
		background: var(--surface-well);
		border: 1px solid var(--hairline);
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
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-align: center;
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
		padding: var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-md);
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
		color: var(--fg-muted);
		cursor: pointer;
		background: var(--surface-raised);
		border-radius: var(--radius-pill);
	}

	.fchip input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.fchip:hover {
		color: var(--brand-foreground);
		background: var(--surface-edge);
	}

	.fchip:has(input:focus-visible) {
		outline: 2px solid var(--brand-primary);
		outline-offset: 2px;
	}

	.fchip.is-on {
		color: var(--on-brand);
		background: var(--brand-primary);
		border-color: var(--brand-primary);
	}

	.code {
		background: var(--surface-well);
		border: 1px solid var(--hairline);
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
		background: var(--surface-raised);
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

		/* Both of these were two-column at every width, including 360px. */
		.seed,
		.cotton,
		.idea {
			grid-template-columns: minmax(0, 1fr);
		}

		.cotton-art {
			justify-self: start;
		}
	}

	@media (max-width: 560px) {
		.ladder {
			gap: var(--space-4);
			padding: var(--space-4);
		}

		.rules li {
			grid-template-columns: 1.25rem minmax(0, 1fr);
			padding: var(--space-3);
		}

		summary {
			flex-wrap: wrap;
		}
	}
</style>
