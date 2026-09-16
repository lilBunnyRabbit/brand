<script lang="ts">
	import CopyButton from '$lib/components/CopyButton.svelte';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import Section from '$lib/components/Section.svelte';
	import BusinessCard from '$lib/components/card/BusinessCard.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import Lockup from '$lib/components/logo/Lockup.svelte';
	import LogoRow from '$lib/components/logo/LogoRow.svelte';
	import Wordmark from '$lib/components/logo/Wordmark.svelte';
	import Chromatics from '$lib/components/color/Chromatics.svelte';
	import SeedTree from '$lib/components/color/SeedTree.svelte';
	import SwatchBlock from '$lib/components/color/SwatchBlock.svelte';

	import Footer from '$lib/components/Footer.svelte';
	import ThemeScope from '$lib/components/ThemeScope.svelte';

	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';
	import {
		dark,
		light,
		markEars,
		modifiers,
		themes,
		type ThemeName
	} from '$lib/brand/config/palette';
	import { logoCombos, plainInks } from '$lib/brand/config/logo-combos';
	import { logoStory } from '$lib/brand/config/logo-story';
	import { wordmarks } from '$lib/brand/config/wordmarks';
	import { sectionIndex } from '$lib/brand/nav';
	import { faces } from '$lib/brand/config/typography';
	import { hueEvidence, hueMoves, lightUsage } from '$lib/brand/config/light-story';
	import { prohibitions } from '$lib/brand/config/prohibitions';
	import { misuses } from '$lib/brand/config/misuse';
	import { lockupVision, lockupVisionSpread } from '$lib/brand/vision';
	import {
		cottontailOnShades,
		exportFormats,
		formatOklch,
		groupViews,
		measureContract,
		modifierRatio,
		varName
	} from '$lib/brand/tokens';
	import { contrastRatio } from '$lib/color';

	const variants = logos.variants.filter((v) => !v.hidden);
	const hero = variants[0];

	// First is the answer; the rest are the record of the choice. See `wordmarks.ts`.
	const [lockup, ...alternates] = wordmarks;
	const anyWip = variants.some((v) => v.axes.status === 'wip');

	// Measured, not quoted: if the seed ever moves and the contract degrades, the page says so
	// rather than continuing to claim a number that used to be true.
	const contract = measureContract('dark');

	// The sizes the brief says to check, because thin ear strokes at a 1.96:1 margin are the risk.
	const sizes = [16, 24, 32, 48, 64];

	/*
		The derivation, as seven rows: what it is called and the move that produced it.

		No hex. Every one of these colours has a swatch card of its own a screen further down, with its hex
		as the card's own label and four ways to copy it — repeating the value here made the row a data
		table when its whole job is the arithmetic.

		`C × 1` on its own was not enough either: every brand colour is a chroma multiple AND a hue turn,
		and showing only the first half made the rows look interchangeable.

		No states row. Every other row is one named colour rendered in itself; "4 states" was four colours
		standing in one row wearing `error`, which is the only row you could not read literally. The four
		have their own group in the palette below, formula included.
	*/
	const chain = [
		{ name: 'background', on: 'background', ink: 'foreground', op: 'the seed' },
		{ name: 'foreground', on: 'foreground', ink: 'background', op: '1 − L · C ÷ 3 · H + 180°' },
		{ name: 'tertiary', on: 'tertiary', ink: 'background', op: 'C × 1 · H + 54°' },
		{ name: 'secondary', on: 'secondary', ink: 'background', op: 'C × 2 · H + 180°' },
		{ name: 'primary', on: 'primary', ink: 'background', op: 'C × 3 · H + 72°' },
		{ name: 'accent', on: 'accent', ink: 'background', op: 'C × 4 · H = foreground' }
	] as const;

	/*
		Ratios measured from the palette rather than written down, so they cannot drift.

		Built per mode from the SAME combo list, which is what makes the light section show the same
		five pairs on the light palette without a second config: the combo names a role, and the
		palette in scope decides what that role is. Only `mark_ears` does not theme — the pale ears
		are one fixed colour on either disc.
	*/
	const comboViews = (theme: ThemeName) =>
		logoCombos.map((combo) => ({
			...combo,
			key: `${theme}-${combo.id}`,
			groundVar: `var(${varName(combo.ground)})`,
			inkVar: `var(${varName(combo.ink)})`,
			ratio: contrastRatio(
				combo.ink === 'mark_ears' ? markEars : themes[theme][combo.ink],
				themes[theme][combo.ground]
			)
		}));

	const combos = comboViews('dark');
	const lightCombos = comboViews('light');

	type ComboView = (typeof combos)[number];

	const inks = plainInks.map((entry) => ({
		...entry,
		inkVar: `var(${varName(entry.ink)})`
	}));

	/*
		The modifiers as things you can see: a bar and a line of text at each alpha, with the measured
		ratio on the page beside it. A five-row table of percentages said nothing about what turning a
		colour down actually costs.
	*/
	const modifierSteps = (
		[
			['hover', 'a pointer resting on it'],
			['active', 'held down'],
			['muted', 'captions and metadata, nothing you need to read'],
			['disabled', 'exempt from contrast, so never informational'],
			['border', 'the lowest alpha still clearing 3:1 on every shade']
		] as const
	).map(([id, note]) => ({
		id,
		alpha: modifiers[id],
		pct: Math.round(modifiers[id] * 100),
		ratio: modifierRatio('foreground', 'background', id),
		note
	}));

	let format = $state(exportFormats[0].id);
	const active = $derived(exportFormats.find((f) => f.id === format) ?? exportFormats[0]);
	const rendered = $derived(active.render());

	/* ── the light region ── */

	const lightContract = measureContract('light');

	const asWord = ['none', 'one', 'two', 'three', 'four'];
	const keptMoves = hueMoves.filter((move) => move.kept).length;
	const kept = asWord[keptMoves];
	const moved = asWord[hueMoves.length - keptMoves];

	/*
		How `cottontail` is actually used, per mode, so the panel can demonstrate the jobs rather than
		describe them. The ring and the callout are measured; the badge is a story rule — the ears on
		the light disc are the fixed colour, never this token — so light loses that one by decision.
	*/
	const cottontailJobs = (theme: ThemeName) => {
		const palette = themes[theme];
		const ring = cottontailOnShades(theme);
		const badge = contrastRatio(palette.cottontail, palette.primary);
		const pop = contrastRatio(palette.background, palette.cottontail);
		return [
			{
				id: 'ring',
				label: 'Focus ring',
				detail: `${ring.min.toFixed(2)}–${ring.max.toFixed(2)} on the seven shades`,
				ok: ring.min >= 3
			},
			{
				id: 'badge',
				label: 'The mark on a primary badge',
				detail:
					theme === 'dark'
						? `${badge.toFixed(2)}: a logotype allowance, never text`
						: `${badge.toFixed(2)}: the ears stay the fixed colour instead`,
				ok: theme === 'dark'
			},
			{
				id: 'pop',
				label: 'A loud callout, sparingly',
				detail: `${pop.toFixed(2)} with the page shade as its text`,
				ok: pop >= 4.5
			}
		];
	};
</script>

<!--
	`summary_large_image` was declared here for months with no image to go with it, so every share of
	this link produced a blank card. `static/og.png` is now a real 1200×630 plate, and it is generated
	from this repo's own palette and mark rather than drawn by hand.

	Absolute URLs, from `meta.siteUrl`: a scraper does not resolve a relative path against the page it
	fetched, so `base` alone is not enough for these two.
-->
<svelte:head>
	<title>{meta.name} · brand assets</title>
	<meta name="description" content={meta.description} />
	<meta property="og:title" content="{meta.name} · brand assets" />
	<meta property="og:description" content={meta.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{meta.siteUrl}/" />
	<meta property="og:image" content="{meta.siteUrl}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="The {meta.name} mark and name" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="{meta.siteUrl}/og.png" />
</svelte:head>

<!--
	One logo card, used by both modes.

	A snippet rather than duplicated markup, because the two sections drifted into different designs the
	last time they were written out twice. The whole card is the ground and the mark sits in it — no
	disc, because the card IS the colour, which is the only way a pair like "primary + background" reads
	as a pair.

	Two children, and only two: the mark, and the caption. The figure's `space-between` puts the mark at
	the top and the whole caption at the foot, and the caption's three lines stay tight together as one
	block. Every attempt to be cleverer than that — the title beside the mark, or the note pinned to the
	bottom on its own — broke either the label or the spacing.
-->
{#snippet comboCard(combo: ComboView)}
	<figure
		style="background: {combo.groundVar}; color: var(--brand-{combo.ground === 'background'
			? 'foreground'
			: 'background'});"
	>
		<Mark variant={hero} size="3.5rem" ink={combo.inkVar} key="combo-{combo.key}" />
		<figcaption>
			<span class="combo-label">{combo.label}</span>
			<span class="combo-ratio">
				{combo.ratio.toFixed(2)}:1{combo.exempt ? ' · logo only' : ''}
			</span>
			<span class="combo-note">{combo.note}</span>
		</figcaption>
	</figure>
{/snippet}

<!--
	`cottontail`, in whichever mode is asking. One design for both, because it is one token with one
	story — the light half of the page previously restated it in a completely different panel.

	It DEMONSTRATES rather than describes: an actual focus ring, an actual badge, an actual callout, each
	with the measured number underneath. The jobs the light twin cannot do are shown struck out, which is
	the whole point of the section — same token, fewer jobs on paper.
-->
{#snippet cottontailPanel(theme: ThemeName)}
	<!--
		The panel wears the ring it is describing: 2px of cottontail, offset by a gap of the page shade.
		That is WCAG 2.4.11's own two-sided technique at panel scale, so the section's first exhibit is the
		section's own frame.
	-->
	<div class="cotton">
		<div class="cotton-head">
			<h3>cottontail</h3>
			<p class="cotton-what">
				{theme === 'dark'
					? 'The brightest thing in the system, named after the flash of a rabbit’s tail. The ring around this panel is it.'
					: 'The same token on paper. It pops by chroma here rather than brightness, and it lost one job on the way over. The ring around this panel is it.'}
			</p>
		</div>

		<ul class="cotton-jobs">
			{#each cottontailJobs(theme) as job (job.id)}
				<li class:is-off={!job.ok}>
					<span class="job-demo">
						{#if job.id === 'ring'}
							<!-- The real thing, at the size it is used: ring, page-shade gap, then the component. -->
							<span class="demo-ring">Save changes</span>
						{:else if job.id === 'badge'}
							<span class="demo-badge">
								<Mark
									variant={hero}
									size="2.75rem"
									ink="var(--brand-cottontail)"
									key="ct-{theme}"
								/>
							</span>
						{:else}
							<span class="demo-pop">New</span>
						{/if}
					</span>
					<span class="job-copy">
						<span class="job-label">{job.label}</span>
						<span class="job-detail">{job.detail}</span>
						{#if !job.ok}<span class="job-no">not on paper</span>{/if}
					</span>
				</li>
			{/each}
		</ul>

		<p class="cotton-rule">
			{theme === 'dark'
				? 'Never text. On a primary fill it is a logotype allowance and nothing more.'
				: 'A UI colour only. Never text, and never the mark.'}
		</p>
	</div>
{/snippet}

<!--
	The dark guide. Wrapped in its own `.measure` because the light region below has to run edge to
	edge, which nothing inside a width-constrained parent can do.
-->
<div class="measure">
	<div class="hero">
		<div class="copy">
			<p class="eyebrow">Brand assets</p>
			<h1>{meta.tagline}</h1>
			<p class="lede">{meta.description}</p>
			{#if anyWip}
				<p class="notice">Still being drawn. Current, not final.</p>
			{/if}
			<!-- The tagline is a promise; these are the two things it most often means. -->
			<div class="hero-actions">
				{#if hero}
					<DownloadButton
						filename={hero.file}
						href={hero.url}
						label="Download the mark"
						variant="solid"
					/>
				{/if}
				<CopyButton
					value={() => exportFormats[0].render()}
					label="Copy the palette"
					describe="the palette as {exportFormats[0].label}"
				/>
			</div>
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
		index={sectionIndex('colours')}
		accent="secondary"
		title="Colour"
		lede="Seventeen colours, all grown from one seed."
	>
		<!-- Measured cells beside the title, not clauses in a sentence. -->
		{#snippet actions()}
			<ul class="contract" aria-label="The contract, measured">
				<li><span>pairs</span><strong>{contract.count}</strong></li>
				<li><span>worst</span><strong>{contract.worst.ratio.toFixed(2)}:1</strong></li>
				<li>
					<span>{contract.allAA ? 'every pair' : 'floor'}</span><strong
						>{contract.allAA ? 'AA' : `${contract.floor.ratio.toFixed(2)}:1`}</strong
					>
				</li>
			</ul>
		{/snippet}
		<div class="seed">
			<div class="seed-copy">
				<!--
					The value on its own line, and read off the palette rather than typed out — it was a literal
					in the markup that happened to agree with `background`, which is exactly the kind of pair
					that stops agreeing.
				-->
				<h3>
					Everything here comes out of
					<code>{formatOklch(dark.background)}</code>
				</h3>
				<p>
					Every other colour is a formula against that one. Change the seed and all seventeen move
					with it, and the cells beside the title say whether they still read.
				</p>
			</div>

			<!-- Name and move. The row IS the colour, so it does not also have to print it. -->
			<ol class="chain">
				{#each chain as row (row.name)}
					<li style="background: var(--brand-{row.on}); color: var(--brand-{row.ink});">
						<span class="chain-name">{row.name}</span>
						<span class="chain-formula">{row.op}</span>
					</li>
				{/each}
			</ol>
		</div>

		{#each groupViews('dark') as group (group.id)}
			<div class="group" class:is-single={group.swatches.length === 1} id={group.id}>
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

		{@render cottontailPanel('dark')}

		<div class="group">
			<div class="group-head">
				<h3>Modifiers</h3>
				<p>
					Need something quieter, or a hover state? Turn one of these down rather than reaching for
					a new colour.
				</p>
			</div>
			<!--
				Shown rather than listed. Each step renders the actual composite — a bar at that alpha and a
				line of text at it — so you can read where `muted` starts costing you and why `disabled` is
				not allowed to carry information. The percentages come from `modifiers`, so the demo cannot
				drift from the token.
			-->
			<ul class="mods">
				{#each modifierSteps as step (step.id)}
					<li>
						<span
							class="mod-bar"
							style="background: color-mix(in srgb, var(--brand-foreground) {step.pct}%, transparent);"
						></span>
						<span class="mod-sample" style="opacity: {step.alpha};">Aa</span>
						<span class="mod-meta">
							<code>{step.id}</code>
							<span class="mod-pct">{step.pct}%</span>
							<span class="mod-note">{step.note}</span>
						</span>
					</li>
				{/each}
			</ul>
			<p class="warn">
				Muted is the one place the contract does not hold: AA-large at best. Captions and metadata
				only, and keep it off the lightest two shades.
			</p>
		</div>

		<!--
			The derivation as a family tree, one colour at a time: the same six moves as the `.chain` list at
			the top, with the colours actually moving. Folded, because it is a screen and a half that restates
			the list, and the figure only plays once it is looked at, so opening it is what starts it.
		-->
		<div class="group">
			<div class="group-head">
				<h3>One seed, in order</h3>
				<p>Every colour, and the move that made it, drawn as it happens.</p>
			</div>
			<details class="fold">
				<summary>Watch it build</summary>
				<SeedTree theme="dark" />
			</details>
		</div>
	</Section>

	<!-- ─── The idea ───────────────────────────────────────────────────────── -->

	{#if hero}
		<Section
			id="idea"
			index={sectionIndex('idea')}
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
						The Y of a rabbit's philtrum is the whole logic. Reduce it, mirror it, thicken it into
						an inner curve, then let a lower curl carry the whisker pad.
					</p>
					<!-- A rule, not an action. It was a filled pill, which read as a button nobody could press. -->
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
		index={sectionIndex('logo')}
		accent="primary"
		title="Logo"
		lede="Most of the time it is just the mark, one colour, on whatever it sits on."
	>
		{#if variants.length === 0}
			<p class="empty">
				No marks yet. Drop an <code>.svg</code> into <code>src/lib/brand/logos/</code> and it appears
				here. No code changes needed.
			</p>
		{:else}
			{#each variants as variant (variant.id)}
				<LogoRow {variant} />
			{/each}

			{#if hero}
				<div class="group">
					<div class="group-head">
						<h3>Which colour</h3>
						<p>Five combinations. The first is the one you want almost every time.</p>
					</div>

					<div class="combos">
						{#each combos as combo (combo.id)}
							{@render comboCard(combo)}
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
					<!--
						The floor is drawn on the ladder rather than written under it. A rung below `minSize` is
						struck and labelled, so "how small can it go" is answered by looking at it.
					-->
					<div class="ladder">
						{#each sizes as size (size)}
							<div class="rung" class:is-under={size < hero.minSize}>
								<Mark variant={hero} size="{size}px" key="size-{size}" />
								<span>{size}px</span>
							</div>
						{/each}
					</div>
				</div>

				<!--
					Room and floor. Both numbers come from `logo-meta.ts` and both are still the conservative
					defaults rather than measured values, hence the note. When they are set, this follows.
				-->
				<div class="group">
					<div class="group-head">
						<h3>Room and floor</h3>
						<p>
							How much space it needs around it, and how small it may go. Provisional: these are the
							defaults, not measured.
						</p>
					</div>

					<div class="room">
						<!--
							The band IS the rule, drawn. `--pad` is the clear space expressed in the mark's own
							units, so the overlay is the number rather than a picture of it.
						-->
						<div class="room-demo">
							<div class="clear" style="--pad: calc(6rem * {hero.clearSpace});">
								<Mark variant={hero} size="6rem" key="clear" />
							</div>
						</div>

						<dl class="room-facts">
							<div>
								<dt>Clear space</dt>
								<dd>
									<strong>×{hero.clearSpace}</strong>
									<span
										>of the mark’s {hero.clearSpaceUnit}, all four sides. Nothing inside it.</span
									>
								</dd>
							</div>
							<div>
								<dt>Minimum size</dt>
								<dd>
									<strong>{hero.minSize}px</strong>
									<span>wide. Below this the ear strokes close up.</span>
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<div class="group">
					<div class="group-head">
						<h3>It holds up</h3>
						<p>
							In greyscale and all three kinds of colour blindness, the badge shifts by at most {lockupVisionSpread.toFixed(
								2
							)}. The two colours differ in brightness, not hue.
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

	<!-- ─── The name beside the mark ───────────────────────────────────────── -->

	{#if hero}
		<Section
			id="wordmark"
			index={sectionIndex('wordmark')}
			accent="secondary"
			title="The name"
			lede="No wordmark asset. The name is set in Hack, the face every value on this page is set in, so the lockup is a layout rule, not a drawing."
		>
			<div class="wm-hero">
				<Wordmark variant={hero} {lockup} size="4.5rem" />
			</div>
			<p class="decided">
				<strong>{lockup.label}.</strong> Mark, gap, name, centred on the mark. The name at {Math.round(
					lockup.scale * 100
				)}% of the mark's height, Hack {lockup.weight}, tracked {lockup.tracking}. Both parts are
				the foreground, so it goes on every shade unchanged.
			</p>

			<!--
				The same lockup at the sizes it has to survive. Whichever one wins, this is the check that
				decides whether it can be used small — the name is set in a mono face at 42% of a 16px mark,
				which is 6.7px.
			-->
			<div class="group">
				<div class="group-head">
					<h3>How small it goes</h3>
					<p>
						The horizontal lockup at four sizes. Below about 32px the name stops being readable
						before the mark stops being recognisable, so that is where the mark goes on alone.
					</p>
				</div>
				<div class="wm-sizes">
					{#each ['1rem', '1.5rem', '2.25rem', '3.25rem'] as size (size)}
						<Wordmark variant={hero} {lockup} {size} />
					{/each}
				</div>
			</div>

			<!-- The record of the choice, folded: same size, same shade, same mark, so only the arrangement differs. -->
			<div class="group">
				<div class="group-head">
					<h3>What it was judged against</h3>
					<p>
						{alternates.length} other arrangements of the same two objects. The only difference between
						any two is the thing being compared.
					</p>
				</div>
				<details class="fold">
					<summary>Show them</summary>
					<div class="marks">
						{#each alternates as other (other.id)}
							<figure class="wm">
								<div class="wm-stage">
									<Wordmark variant={hero} lockup={other} size="3.25rem" />
								</div>
								<figcaption>
									<span class="wm-label">{other.label}</span>
									<span class="wm-note">{other.note}</span>
								</figcaption>
							</figure>
						{/each}
					</div>
				</details>
			</div>
		</Section>
	{/if}

	<!-- ─── Type ───────────────────────────────────────────────────────────── -->

	<Section
		id="type"
		index={sectionIndex('type')}
		accent="tertiary"
		title="Type"
		lede="Two faces. One for reading, one for values."
	>
		<div class="faces">
			{#each faces as face (face.id)}
				<div class="face-card">
					<p class="face-specimen" style="font-family: var({face.cssVar});">Aa</p>
					<div class="face-body">
						<h3>{face.name}</h3>
						<p class="face-role">{face.role}</p>
						<p class="face-line is-display" style="font-family: var({face.cssVar});">
							{face.specimen[0]}
						</p>
						<p class="face-line" style="font-family: var({face.cssVar});">{face.specimen[1]}</p>
						<!-- Set in the face itself, so the row is a specimen rather than a list of numbers. -->
						<ul class="face-weights" style="font-family: var({face.cssVar});">
							{#each face.weights as weight (weight)}
								<li style="font-weight: {weight};">{weight}</li>
							{/each}
						</ul>
						<p class="face-meta">
							<code>{face.cssVar}</code>
							<span>{face.source}</span>
							<span>{face.licence}</span>
						</p>
					</div>
				</div>
			{/each}
		</div>
	</Section>

	<!-- ─── Business card ──────────────────────────────────────────────────── -->

	{#if hero}
		<Section
			id="card"
			index={sectionIndex('card')}
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
		index={sectionIndex('rules')}
		accent="tertiary"
		title="Don't"
		lede="A short list. Most of it comes down to one thing: the brand colours are all the same brightness, so they disappear against each other."
	>
		<div class="dont-demo">
			<div class="demo">
				<div class="bad">
					<span class="chip primary">primary</span><span class="chip accent">accent</span><span
						class="chip secondary">secondary</span
					>
				</div>
				<p><strong>Don't.</strong> Brand colours touching. Roughly 1:1, so the edges vanish.</p>
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

		{#if hero}
			<div class="group">
				<div class="group-head">
					<h3>Not to the mark</h3>
					<p>
						Every tile below is the real SVG with one CSS declaration on it. No broken copy of the
						logo exists in this repo, so none of these can go stale when the mark changes.
					</p>
				</div>
				<div class="misuses">
					{#each misuses as bad (bad.id)}
						<figure class="misuse">
							<div class="misuse-plate">
								<!--
									`overflow: hidden` on the plate, so a stretched or rotated mark is clipped by its own
									tile rather than colliding with the one beside it.
								-->
								<span class="misuse-art" style={bad.css}>
									<Mark variant={hero} size="3.5rem" key="bad-{bad.id}" />
								</span>
								<span class="misuse-x" aria-hidden="true">✕</span>
							</div>
							<figcaption>
								<span class="misuse-label">{bad.label}</span>
								<span class="misuse-why">{bad.why}</span>
							</figcaption>
						</figure>
					{/each}
				</div>
			</div>
		{/if}
	</Section>
</div>

<!-- ─── The threshold ──────────────────────────────────────────────────── -->

<!--
	The bottom of the dark half. No button and no toggle: keep scrolling and it gets light. The chevron
	is a shortcut for anyone who would not think to try.
-->
<div class="threshold">
	<div class="measure">
		<p class="end">You’ve reached the end,</p>
		<p class="still">but you’re still in the dark.</p>
		<a class="onward" href="#light">Keep going <span aria-hidden="true">↓</span></a>
	</div>
</div>

<!-- ─── Light mode ─────────────────────────────────────────────────────── -->

<!--
	One scope, and everything inside it re-themes from the same rules — no component here takes a light
	variant, because both palettes carry the same 17 keys.
-->
<ThemeScope theme="light" id="light-region">
	<div class="measure">
		<Section
			id="light"
			index={sectionIndex('light')}
			accent="primary"
			title="Light mode"
			lede="It exists because interfaces need it. It is not the brand."
		>
			<div class="statement">
				<p>
					Every dark token has a twin here: same name, same job, same position. Nothing rebinds and
					no component gets a variant. <strong>That does not make them interchangeable.</strong> Dark
					is the brand. Light is what you reach for when a product surface needs it. If someone will recognise
					the mark from it, it should be dark.
				</p>
			</div>

			<!-- Same marker treatment as the dark "Don't" list — one design for one idea. -->
			<div class="verdicts">
				<ul class="verdict-list">
					{#each lightUsage.yes as line (line)}
						<li class="is-yes"><span class="tick" aria-hidden="true">✓</span>{line}</li>
					{/each}
				</ul>
				<ul class="verdict-list">
					{#each lightUsage.no as line (line)}
						<li class="is-no"><span class="tick" aria-hidden="true">✕</span>{line}</li>
					{/each}
				</ul>
			</div>
		</Section>

		<!-- ─── The twins ──────────────────────────────────────────────────── -->

		<!--
			The split is the only new part of the contract, so the lede says the split and the header's cells
			carry the three measured numbers, the same way the dark half does it.
		-->
		<Section
			id="light-colour"
			index={sectionIndex('light-colour')}
			accent="secondary"
			title="Seventeen twins"
			lede="Same names, same groups, same order. Only the guarantee splits on paper: text clears AA on every shade, brand and states clear AA on the page and the surface and 3:1 on the rungs below."
		>
			{#snippet actions()}
				<ul class="contract" aria-label="The light contract, measured">
					<li><span>text</span><strong>{lightContract.text.ratio.toFixed(2)}:1</strong></li>
					<li>
						<span>page + surface</span><strong>{lightContract.legible.ratio.toFixed(2)}:1</strong>
					</li>
					<li><span>below</span><strong>{lightContract.floor.ratio.toFixed(2)}:1</strong></li>
				</ul>
			{/snippet}
			{#each groupViews('light') as group (group.id)}
				<div class="group" class:is-single={group.swatches.length === 1} id="light-{group.id}">
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

			{@render cottontailPanel('light')}
		</Section>

		<!-- ─── The hue that moved ─────────────────────────────────────────── -->

		<Section
			id="light-orange"
			index={sectionIndex('light-orange')}
			accent="accent"
			title="The orange one"
			lede="Everything else is a twin. The primary changed hue. That was measured, not chosen."
		>
			<!--
				The comparison, on the ground it was decided on: both candidates set as text and as a fill on
				the actual light page, at the brand's own lightness and chroma, so hue is the only variable.
				Two identical plates, so the only difference on screen is the thing being tested — which is
				what makes the number underneath mean something.
			-->
			<div class="tryout">
				{#each [{ id: 'green', hex: light.primary.derive( 'green', { h: dark.primary.h } ).hex, delta: hueEvidence.green, verdict: 'Dark’s green hue: sinks into the paper', reject: true }, { id: 'orange', hex: light.primary.hex, delta: hueEvidence.orange, verdict: 'Orange: sits on it', reject: false }] as probe (probe.id)}
					<figure class="try" class:is-reject={probe.reject}>
						<div class="try-plate">
							<span class="try-text" style="color: {probe.hex};">Aa the quick brown fox</span>
							<span class="try-fill" style="background: {probe.hex};"></span>
						</div>
						<figcaption>
							<span class="try-delta">{probe.delta} {hueEvidence.unit}</span>
							<span class="try-verdict">{probe.verdict}</span>
						</figcaption>
					</figure>
				{/each}
			</div>

			<p class="lm-why">{hueEvidence.note}</p>

			<p class="closing">
				So the light mode is fitted to its own ground rather than inheriting dark's wheel. Of dark's
				four brand relationships, {kept} came along unchanged. {moved.charAt(0).toUpperCase() +
					moved.slice(1)} could not.
			</p>

			<div class="moves">
				{#each hueMoves as move (move.id)}
					<div class="move" class:is-broken={!move.kept}>
						<span class="move-chip" style="background: var(--brand-{move.id});"></span>
						<div class="move-body">
							<p class="move-head">
								<strong>{move.token}</strong>
								<code>{move.rule}</code>
								<span class="move-tag">{move.kept ? 'kept' : 'moved'}</span>
							</p>
							<p class="move-out">{move.outcome}</p>
						</div>
					</div>
				{/each}
			</div>
		</Section>

		<!-- ─── The mark ───────────────────────────────────────────────────── -->

		<Section
			id="light-logo"
			index={sectionIndex('light-logo')}
			accent="tertiary"
			title="The mark on paper"
			lede="The same five combinations, in the light palette."
		>
			<!--
				Identical cards to the dark section — same snippet, same rules. Only the palette in scope
				differs, so the discs and the neutral pair re-theme; the ears of the bright badge do not,
				because `mark_ears` is the fixed colour.
			-->
			<div class="combos">
				{#each lightCombos as combo (combo.id)}
					{@render comboCard(combo)}
				{/each}
			</div>

			<p class="closing">
				The bright badge is the one that reads better here: the same pale ears measure
				{lightCombos.find((c) => c.id === 'primary-cottontail')?.ratio.toFixed(2)}:1 on the orange
				disc against
				{combos.find((c) => c.id === 'primary-cottontail')?.ratio.toFixed(2)}:1 in dark, so on paper
				it needs no exemption. Do not swap the ears for the light cottontail — that pair is
				invisible. When you cannot control the reproduction, use the neutral pair.
			</p>
		</Section>

		<!-- ─── The scheme, live ───────────────────────────────────────────── -->

		<!--
			The last thing before the exports, and the only interactive thing on the page: everything
			above is this guide's account of the palette, and this is the palette itself, in the tool
			that solved it. It goes here rather than beside the swatches in the dark half because it
			would have pre-empted them — the derivation reads as arithmetic you can follow, not as a
			widget you poke, and there is no reading the frame before you know what a rung is.

			`Chromatics` owns the frame's height. Nothing else on the page has to know.
		-->
		<Section
			id="live"
			index={sectionIndex('live')}
			accent="primary"
			title="Live"
			lede="Every number above is transcribed from a Chromatics scheme. This is that scheme, running."
		>
			<Chromatics />
		</Section>

		<!-- ─── Assets ─────────────────────────────────────────────────────── -->

		<!--
			Last, after both halves, because every export carries both palettes — downloading before
			seeing the light half meant taking home tokens the page had not shown yet.
		-->
		<Section
			id="assets"
			index={sectionIndex('assets')}
			accent="secondary"
			title="Assets"
			lede="Grab the palette however you need it. Every format carries both modes."
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
	</div>

	<Footer />
</ThemeScope>

<style>
	/* ── hero ── */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
		gap: clamp(var(--space-6), 5vw, var(--space-8));
		align-items: center;
		padding-block: var(--stack-section);
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

	/* Between the two extremes: a rule in warning, and full-strength text. */
	.notice {
		padding-left: var(--space-3);
		margin: var(--space-5) 0 0;
		font-size: var(--text-base);
		color: var(--brand-foreground);
		border-left: 2px solid var(--brand-warning);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-top: var(--space-5);
	}

	.hero-mark {
		display: grid;
		place-items: center;
	}

	/*
		The contract's numbers as cells in the section head rather than clauses in the lede. They are
		measured, so they belong where a measurement reads: beside the title, in mono, not mid-sentence.
	*/
	.contract {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.contract li {
		display: inline-flex;
		gap: var(--space-2);
		align-items: baseline;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		color: var(--fg-muted);
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-pill);
	}

	.contract strong {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--brand-foreground);
	}

	/* ── groups ── */

	/*
		A group gets its top gap from whatever precedes it, except a section head.

		This was a list of pairs — `.group + .group`, then `.cotton + .group` when Modifiers turned up
		flush against the cottontail panel, and it would have needed `.rules + .group` next, then the one
		after that. Enumerating the predecessors is the bug: every new block above a group is another
		missing rule, and the symptom is always a heading welded to the thing above it.

		`header` is the exclusion because `Section` renders one, and the head-to-content gap is
		`--stack-sm` and belongs to the header. Adjacent margins collapse, so a predecessor that already
		carries its own bottom gap does not double up.

		`:global()` on the predecessor because Svelte scopes BOTH compounds of a sibling pair, and a
		child component's root element (`LogoRow`'s `<article>`) never carries this file's scope class —
		so "whatever precedes it" quietly excluded every component, and Which colour sat welded to the
		logo row's buttons.
	*/
	:global(:not(header)) + .group {
		margin-top: var(--stack);
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

	/*
		A one-colour group is a strip, not a stack: head on the left, the card on the right. Stacked,
		Content and Identity each spent a full row on one card and the air around it.
	*/
	.group.is-single {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
		gap: var(--space-5) clamp(var(--space-5), 4vw, var(--space-8));
		align-items: start;
	}

	.group.is-single .swatches {
		margin-top: 0;
	}

	.warn {
		max-width: 68ch;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--brand-warning);
	}

	/* ── the threshold, and the dawn into light ── */

	/*
		The last of the dark half. Sits on the darkest shade because the page's own descent has already
		arrived there — this is the bottom, and then it gets light.
	*/
	/*
		Fades IN from transparent rather than sitting on a flat shade.

		The page gradient is `background-attachment: fixed`, so a solid block here had a visible seam along
		its top edge wherever the fixed ramp happened to be a different shade. Fading out of whatever is
		behind removes that edge, and the block still lands on exactly `background_darkest` at its foot —
		which is where the dawn picks up, so there is no seam at the bottom either.
	*/
	/*
		A full screen of it. The line is the whole point of the section — it is the last thing in the dark
		half and it should be the only thing on screen when you reach it, with nothing of the light half
		showing until you scroll past.

		`dvh`, not `vh`: on mobile `vh` is the tallest form of the viewport, so with the toolbar showing the
		block overflows by its height and the sentence sits off-centre.

		`align-content` rather than `place-items`, so the row centres vertically while the `.measure` inside
		still spans the column instead of shrinking to its text.
	*/
	.threshold {
		display: grid;
		align-content: center;
		min-height: 100dvh;
		padding-block: clamp(var(--space-8), 12vw, 8rem);
		text-align: center;
		background: linear-gradient(
			180deg,
			transparent 0%,
			var(--brand-background-darkest) 62%,
			var(--brand-background-darkest) 100%
		);
	}

	.threshold .end {
		margin: 0;
		font-size: var(--text-lg);
		color: var(--fg-muted);
	}

	.threshold .still {
		max-width: 24ch;
		margin: var(--space-3) auto 0;
		font-size: var(--text-display);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.onward {
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		margin-top: var(--stack-sm);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--brand-primary);
		text-decoration: none;
	}

	.onward span {
		transition: transform var(--dur) var(--ease);
	}

	.onward:hover span {
		transform: translateY(3px);
	}

	/*
		The light half's descent.

		`fixed`, exactly like `body`'s. Region-mapped over a region four screens tall, a viewport only ever
		saw a quarter of the ramp, which is why it read as flat and why it darkened as you scrolled while
		the dark half held still. Viewport-mapped, every screenful shows the same ramp.

		ONE rung either side of the page, not the full ladder. Dark's whole descent, page to
		`background_darkest`, measures 1.25:1 with the chroma falling as it goes. Light's ladder gets its
		depth from chroma: one rung down is already 1.20:1, the bottom 1.76:1 at three times the page's
		chroma. Running the full ladder here spent three quarters of every screen on saturated sand and the
		region read as orange, not paper. White to the page is 1.16:1 and the page to `background_dark`
		1.20:1 — dark's depth, in both directions.

		It has to be the REGION's own background, not a child's: the scope paints itself opaque cream, so a
		child would sit on cream rather than on the page.

		`:global` because the element belongs to `ThemeScope`. The id also gives it the specificity to beat
		the flat `[data-theme='light']` ground, whichever order they land in.
	*/
	:global(#light-region) {
		background-image: linear-gradient(
			180deg,
			var(--brand-background-lightest) 0%,
			var(--brand-background) 25%,
			var(--brand-background-dark) 100%
		);
		background-attachment: fixed;
	}

	/* ── light: the statement ── */

	.statement p {
		max-width: 62ch;
		margin: 0 0 var(--space-4);
		font-size: var(--text-lg);
		line-height: 1.6;
	}

	.statement strong {
		color: var(--brand-primary);
	}

	/* ── the seed / maths ── */
	/*
		`start`, not `center`. The copy is three lines and the ladder is seven rows, so centring left the
		heading floating in the middle of the panel with nothing beside its first line.
	*/
	.seed {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-8));
		align-items: start;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-bottom: var(--stack);
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.seed h3 {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	/*
		Its own line, in primary, a step up in size and tracked out a little.

		Inline it competed with the sentence for the same line and wrapped mid-literal on a phone —
		`oklch(0.255 0.0233` / `230.47)`. On its own line it reads as the thing being named, which is what it
		is: everything else on the page is a formula against it.
	*/
	.seed h3 code {
		display: block;
		margin-top: var(--space-3);
		font-size: var(--text-2xl);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
		color: var(--brand-primary);
		/* Still longer than a narrow phone. */
		overflow-wrap: anywhere;
	}

	.seed-copy p {
		max-width: 52ch;
		margin: var(--space-3) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* ── the idea ── */

	.idea {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(var(--space-5), 5vw, var(--space-8));
		align-items: center;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-bottom: var(--stack);
		/* The darkest shade — the panel that made the mark read, kept. */
		background: var(--brand-background-darkest);
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

	/*
		A rule, not an action.

		This was a filled cottontail pill, which read as a button — and on a phone it wrapped to two lines
		inside a rounded shape and looked broken. A rule on the left edge says "this is the point" without
		pretending to be pressable, and it wraps like the prose it is.

		In primary rather than cottontail. Cottontail is the loudest thing in the palette and a UI token —
		using it for a line of body copy on the darkest panel made the sentence shout, and it is a rule, not
		an alert. Primary is the brand voice and clears 7.06:1 on this shade.
	*/
	.idea-rule {
		max-width: 46ch;
		padding-left: var(--space-4) !important;
		margin: var(--space-5) 0 0 !important;
		font-size: var(--text-lg) !important;
		font-weight: 600;
		line-height: 1.5;
		color: var(--brand-primary);
		border-left: 2px solid var(--brand-primary);
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

	/* Five combos. Four across left the fifth alone on a row of its own wherever the measure allowed four. */
	@media (min-width: 1100px) {
		.combos {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	/*
		Content pushed up under the mark, not distributed.

		`space-between` tied the caption to the bottom edge, so a card with a two-line note and a card with
		a four-line note put their labels in different places and the row read as ragged. Packed to the top,
		the label sits the same distance below the mark on all five, whatever the note does. `min-height`
		still equalises the boxes; the slack just falls at the bottom where nothing is looking.
	*/
	.combos figure {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		align-items: flex-start;
		justify-content: flex-start;
		min-height: 15rem;
		padding: var(--space-5);
		margin: 0;
		border-radius: var(--radius-lg);
	}

	/* One tight block, directly under the mark. */
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
		opacity: 0.7;
	}

	.combo-note {
		max-width: 34ch;
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		opacity: 0.85;
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

	/* ── room and floor ── */

	.room {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(var(--space-5), 4vw, var(--space-8));
		align-items: center;
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-top: var(--space-5);
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	/*
		The clear-space band, as padding of exactly `--pad` with a dashed edge on it. Padding rather than an
		absolutely positioned overlay, so the box IS the rule: whatever `clearSpace` says, that is the gap
		you can measure on screen.
	*/
	.clear {
		display: grid;
		place-items: center;
		padding: var(--pad);
		border: 1px dashed var(--fg-border);
		border-radius: var(--radius-sm);
	}

	.room-facts {
		display: grid;
		gap: var(--space-4);
		margin: 0;
	}

	.room-facts dt {
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	.room-facts dd {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
		align-items: baseline;
		margin: var(--space-2) 0 0;
	}

	.room-facts strong {
		font-family: var(--font-mono);
		font-size: var(--text-xl);
		font-variant-numeric: tabular-nums;
		color: var(--brand-primary);
	}

	.room-facts dd span {
		max-width: 42ch;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* A rung under the minimum. Struck and dimmed, never colour alone. */
	.rung.is-under {
		opacity: 0.45;
	}

	.rung.is-under span {
		text-decoration: line-through;
	}

	/* ── misuse ── */

	.misuses {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
		gap: var(--space-4);
		margin-top: var(--space-5);
	}

	.misuse {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
	}

	/* `overflow: hidden`, so a stretched or rotated mark is clipped by its own tile. */
	.misuse-plate {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 7.5rem;
		overflow: hidden;
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-md);
	}

	.misuse-art {
		display: block;
		color: var(--brand-primary);
	}

	.misuse-x {
		position: absolute;
		top: var(--space-2);
		right: var(--space-3);
		font-family: var(--font-mono);
		font-weight: 700;
		color: var(--brand-error);
	}

	.misuse figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.misuse-label {
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.misuse-why {
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* ── type ── */

	.faces {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: var(--space-4);
	}

	/* `min-width: 0`, so a long licence line wraps instead of setting the card's floor. */
	.face-card {
		display: grid;
		min-width: 0;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(var(--space-4), 3vw, var(--space-5));
		align-items: start;
		padding: clamp(var(--space-4), 3vw, var(--space-5));
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	/*
		One glyph pair at a size where the face is actually identifiable. Smaller than this and Inter and
		Hack are two grey blobs, which is the opposite of a specimen.
	*/
	.face-specimen {
		margin: 0;
		font-size: clamp(3rem, 9vw, 4.5rem);
		font-weight: 700;
		line-height: 0.9;
		letter-spacing: -0.03em;
		color: var(--brand-primary);
	}

	.face-card h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 700;
	}

	.face-role {
		max-width: 40ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* A line of the face as the page sets it, not only a glyph pair and a list of numbers. */
	.face-line {
		max-width: 34ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-base);
		line-height: 1.5;
	}

	.face-line.is-display {
		margin-top: var(--space-4);
		font-size: var(--text-xl);
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	/* Each number set at its own weight. The list IS the weight ladder. */
	.face-weights {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		padding: 0;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		list-style: none;
	}

	.face-meta {
		display: grid;
		gap: 0.15rem;
		margin: var(--space-4) 0 0;
		font-size: var(--text-xs);
		color: var(--fg-muted);
		overflow-wrap: anywhere;
	}

	.face-meta code {
		font-family: var(--font-mono);
		color: var(--brand-secondary);
	}

	/* ── the name beside the mark ── */

	.wm-hero {
		display: grid;
		place-items: center;
		padding: clamp(var(--space-6), 7vw, 5rem) var(--space-5);
		overflow-x: auto;
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.decided {
		max-width: 66ch;
		margin: var(--stack-sm) 0 0;
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	.decided strong {
		color: var(--brand-foreground);
	}

	/*
		Wide cells, and every stage the same height.

		A lockup is only judged against the others, so the comparison means nothing unless everything else
		is held still: same shade, same mark size, same box. `19rem` is what the three-line variant needs
		without scaling down, and that sets the floor for all of them.
	*/
	.marks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
		gap: var(--space-4);
	}

	.wm {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin: 0;
	}

	.wm-stage {
		display: grid;
		place-items: center;
		min-height: 9rem;
		padding: var(--space-5);
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.wm figcaption {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.wm-label {
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.wm-note {
		max-width: 40ch;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* Bottom-aligned, so the four sizes read as one object growing rather than as four objects. */
	.wm-sizes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5) clamp(var(--space-5), 4vw, var(--space-8));
		align-items: flex-end;
		width: fit-content;
		max-width: 100%;
		padding: var(--space-5) var(--space-6);
		margin-top: var(--space-5);
		background: var(--surface-well);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	/*
		── size ladder ──

		`fit-content`, because five marks topping out at 64px in a full-width panel is mostly empty panel.
		It hugs the rungs instead, which also stops it competing with the swatch grids above it for
		attention it does not need.
	*/
	.ladder {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		align-items: flex-end;
		width: fit-content;
		max-width: 100%;
		padding: var(--space-5) var(--space-6);
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
		margin-bottom: var(--stack);
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
		padding: 0;
		margin: 0;
		list-style: none;
	}

	/* Rows on hairlines, not ten cards: a rule is a line in a list, and the card chrome outweighed it. */
	.rules li {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr);
		gap: var(--space-3);
		padding: var(--space-4) 0;
	}

	.rules li + li {
		border-top: 1px solid var(--hairline);
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
		outline: 2px solid var(--brand-cottontail);
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

	/*
		A figure that opens on request: the seed tree, and the lockups the chosen one was judged against.
		Closed, each is one line; open, it is the whole figure. <details> for the reasons above. The bare
		`summary` rule is the code dump's, so everything it sets is set again here.
	*/
	.fold > summary {
		display: inline-flex;
		gap: var(--space-2);
		align-items: center;
		justify-content: flex-start;
		padding: var(--space-2) var(--space-4);
		margin-top: var(--space-5);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 600;
		list-style: none;
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-pill);
	}

	.fold > summary::-webkit-details-marker {
		display: none;
	}

	.fold > summary::before {
		font-family: var(--font-mono);
		color: var(--brand-primary);
		content: '+';
	}

	.fold[open] > summary {
		margin-bottom: var(--space-5);
	}

	.fold[open] > summary::before {
		content: '−';
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

		/* Both of these were two-column at every width, including 360px. */
		.seed,
		.idea {
			grid-template-columns: minmax(0, 1fr);
		}

		.idea-art {
			justify-self: start;
		}
	}

	/*
		Phones: centre the hero, and let the panels that were side-by-side breathe as single columns.
		The mark leads, then the words — which is the order it reads in anyway once it is stacked.
	*/
	@media (max-width: 720px) {
		.hero {
			gap: var(--space-5);
			text-align: center;
			padding-block: var(--space-6) var(--space-8);
		}

		.hero-mark {
			order: -1;
		}

		.lede {
			margin-inline: auto;
		}

		.notice {
			margin-inline: auto;
			text-align: left;
		}

		.hero-actions {
			justify-content: center;
		}

		.group.is-single {
			grid-template-columns: minmax(0, 1fr);
		}

		.eyebrow {
			margin-bottom: var(--space-3);
		}

		/* The one panel that is mostly one object plus a line of text. */
		.idea {
			justify-items: center;
			text-align: center;
		}

		.idea-art {
			justify-self: center;
		}

		.idea-copy p {
			margin-inline: auto;
		}

		.seed {
			gap: var(--space-5);
		}

		.ladder {
			justify-content: center;
			gap: var(--space-4);
		}

		/*
			`.vision` used to be centred alongside the ladder here, which shrank each card to its caption
			and left dead space either side. Default stretch is the fix: the cards read as the grid they
			are, and the orphan fifth keeps its track width and the page's left edge.
		*/

		/*
			Four sizes across one phone row wrapped 2-1-1, which is three objects and a stray rather than
			one object growing. A column keeps the reading: smallest to largest, top to bottom.
		*/
		.wm-sizes {
			flex-direction: column;
			gap: var(--space-4);
			align-items: flex-start;
		}

		.steps li {
			padding: var(--space-3);
		}

		/* Chips stack rather than squeezing three mono labels onto one line. */
		.bad,
		.good {
			flex-direction: column;
			padding: var(--space-4);
		}

		.bad {
			gap: 0;
		}

		.good {
			gap: var(--space-2);
		}

		.chip {
			flex: none;
		}

		.formats {
			gap: var(--space-2);
		}

		summary {
			flex-wrap: wrap;
			gap: var(--space-2);
		}
	}

	@media (max-width: 560px) {
		.swatches {
			gap: var(--space-3);
		}

		.combos {
			gap: var(--space-3);
		}

		.combos figure {
			min-height: 0;
			padding: var(--space-4);
		}

		pre {
			font-size: var(--text-xs);
		}
	}
	/* ── the derivation chain ── */

	.chain {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.chain li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-3) var(--space-4);
		align-items: baseline;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-sm);
	}

	.chain-name {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.chain-formula {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		opacity: 0.75;
	}

	/* ── modifiers, demonstrated ── */

	.mods {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: var(--space-5) 0 var(--space-5);
		list-style: none;
	}

	.mods li {
		display: grid;
		grid-template-columns: 4rem 2.5rem 1fr;
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--hairline);
	}

	/* The alpha, as an actual composite rather than a number. */
	.mod-bar {
		height: 1.25rem;
		border-radius: var(--radius-sm);
	}

	.mod-sample {
		font-size: var(--text-lg);
		font-weight: 700;
	}

	.mod-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
		align-items: baseline;
	}

	.mod-meta code {
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.mod-pct {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
		color: var(--brand-secondary);
	}

	.mod-note {
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	/* ── cottontail, one panel for both modes ── */

	/*
		The outline is the point, not decoration: this is the ring-plus-offset pattern at panel scale, so
		the panel demonstrates its own subject before you read a word of it. `outline` rather than `border`
		because only outline can sit OUTSIDE the box with a gap of page shade between — which is the half of
		the technique that makes a 1.96:1 ring legal.

		The margin below carries the outline plus its offset clear of whatever follows.
	*/
	.cotton {
		display: grid;
		gap: clamp(var(--space-4), 3vw, var(--space-5));
		padding: clamp(var(--space-5), 4vw, var(--space-6));
		margin-block: var(--stack);
		background: var(--surface-well);
		border-radius: var(--radius-lg);
		outline: 2px solid var(--brand-cottontail);
		outline-offset: 4px;
	}

	.cotton h3 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--brand-cottontail);
	}

	.cotton-what {
		max-width: 60ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	.cotton-jobs {
		display: grid;
		gap: 0;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	/*
		Two halves, alternating. Every demo used to live in a 7rem gutter, which capped all three at chip
		size — the thing being shown was the smallest thing in the row. At half the panel each one can be
		the size it is actually used at, and swapping sides row to row keeps three of them from reading as
		a table.
	*/
	.cotton-jobs li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: clamp(var(--space-4), 4vw, var(--space-6));
		align-items: center;
		padding-block: clamp(var(--space-4), 3vw, var(--space-5));
	}

	.cotton-jobs li + li {
		border-top: 1px solid var(--hairline);
	}

	.cotton-jobs li:nth-child(even) .job-demo {
		order: 2;
	}

	/* A job the light twin cannot do. Struck through AND labelled, never colour alone. */
	.cotton-jobs li.is-off {
		opacity: 0.55;
	}

	.cotton-jobs li.is-off .job-label {
		text-decoration: line-through;
	}

	/*
		Each demo gets a plate of the page shade, so it reads as the thing in situ rather than floating on
		the panel — and the ring's offset gap has a real surface to be.
	*/
	.job-demo {
		display: grid;
		place-items: center;
		min-height: 8rem;
		padding: var(--space-5);
		background: var(--surface-page);
		border-radius: var(--radius-md);
	}

	/* The ring-plus-offset pattern, live, on something button-sized. */
	.demo-ring {
		padding: var(--space-3) var(--space-5);
		font-size: var(--text-base);
		font-weight: 600;
		background: var(--surface-raised);
		border-radius: var(--radius-sm);
		outline: 2px solid var(--brand-cottontail);
		outline-offset: 3px;
	}

	.demo-badge {
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		background: var(--brand-primary);
		border-radius: 50%;
	}

	.demo-pop {
		padding: var(--space-2) var(--space-5);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--brand-background);
		background: var(--brand-cottontail);
		border-radius: var(--radius-pill);
	}

	.job-copy {
		display: grid;
		gap: var(--space-2);
		justify-items: start;
	}

	.job-label {
		font-size: var(--text-lg);
		font-weight: 700;
	}

	.job-detail {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.job-no {
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--brand-warning);
	}

	.cotton-rule {
		max-width: 56ch;
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
	}

	/* ── do / never, one design ── */

	.verdicts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
		gap: var(--space-4) clamp(var(--space-5), 4vw, var(--space-8));
		margin-top: var(--stack-sm);
	}

	.verdict-list {
		display: grid;
		gap: var(--space-3);
		align-content: start;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.verdict-list li {
		display: grid;
		grid-template-columns: 1.25rem 1fr;
		gap: var(--space-3);
		align-items: baseline;
		font-size: var(--text-base);
		line-height: 1.5;
	}

	.tick {
		font-weight: 700;
	}

	.verdict-list li.is-yes .tick {
		color: var(--brand-success);
	}

	.verdict-list li.is-no .tick {
		color: var(--brand-error);
	}

	.verdict-list li.is-no {
		color: var(--fg-muted);
	}

	/* ── the orange one ── */

	.tryout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
		gap: var(--space-4);
	}

	.try {
		margin: 0;
	}

	/*
		Both plates are the actual page colour, so the only difference on screen is the candidate. That is
		what makes the number underneath mean anything.
	*/
	.try-plate {
		display: grid;
		gap: var(--space-4);
		padding: clamp(var(--space-4), 3vw, var(--space-5));
		background: var(--brand-background);
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-md);
	}

	.try-text {
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.try-fill {
		height: 2.25rem;
		border-radius: var(--radius-sm);
	}

	.try figcaption {
		display: grid;
		gap: 0.15rem;
		padding-top: var(--space-3);
	}

	.try-delta {
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.try-verdict {
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.try.is-reject .try-delta,
	.try.is-reject .try-verdict {
		opacity: 0.65;
	}

	.lm-why {
		max-width: 62ch;
		margin: var(--space-4) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.moves {
		display: grid;
		gap: var(--space-3);
		margin-top: var(--stack-sm);
	}

	.move {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-4);
		align-items: start;
		padding: var(--space-4);
		background: var(--surface-raised);
		border-radius: var(--radius-md);
	}

	.move-chip {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-sm);
	}

	.move-head {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
		align-items: baseline;
		margin: 0;
	}

	.move-head strong {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}

	.move-head code {
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.move-tag {
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--brand-secondary);
	}

	.move.is-broken .move-tag {
		color: var(--brand-accent);
	}

	.move-out {
		max-width: 70ch;
		margin: var(--space-2) 0 0;
		font-size: var(--text-sm);
		line-height: 1.5;
		color: var(--fg-muted);
	}

	/* ── shared bits ── */

	.closing {
		max-width: 66ch;
		margin: var(--stack-sm) 0 0;
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--fg-muted);
	}

	@media (max-width: 720px) {
		/* The formula gets its own line rather than being squeezed beside the name. */
		.chain li {
			grid-template-columns: minmax(0, 1fr);
		}

		.mods li {
			grid-template-columns: 3rem 2rem 1fr;
			gap: var(--space-3);
		}

		/* One column, and the demo always leads — the alternating sides have nothing left to alternate. */
		.cotton-jobs li {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-4);
		}

		.cotton-jobs li:nth-child(even) .job-demo {
			order: 0;
		}

		.move {
			grid-template-columns: 1fr;
		}
	}
</style>
