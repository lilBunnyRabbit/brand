<script lang="ts">
	import { themes, type ThemeName } from '$lib/brand/config/palette';
	import { beats, END, layouts, stripsFor, trees, wirePath } from '$lib/brand/config/seed-tree';
	import { labelFor } from '$lib/brand/tokens';
	import { travelAxes } from '$lib/color';

	let { theme }: { theme: ThemeName } = $props();

	/*
		One seed, drawn as a family tree.

		THE PALETTE IS IMPORTED, NEVER RE-DERIVED. The prototype this came from computed dark from four
		numbers and then asserted eleven hexes against the published values at runtime. Here every colour
		is read from `themes[theme]` and every node's key is typed `SwatchName`, so a renamed token is a
		`bun run check` failure instead of a console warning in a browser nobody has open — the same
		guarantee, structurally, which is strictly stronger. Light needs no special handling for the same
		reason: both palettes carry the same 17 keys.

		The tree colours are HEXES, not `var(--brand-*)`. Those re-resolve per scope, and a card halfway
		between two palette values has no token to name anyway. So the figure takes its palette from the
		prop; only the chrome around it — caption, Replay, the wires — re-themes with its scope.

		The travel is phased ONE AXIS AT A TIME, lightness then chroma then hue (`travelAxes`). Nine of
		these colours share a lightness, so a straight blend between two of them spends its middle in
		grey. Phasing is what makes each move read as a move.

		The markup's initial state is the FINISHED tree: `clock` starts at the end, so the prerendered
		page has every card, name, hex, move and wire already in place. The sequence is an enhancement
		that rewinds the clock, and it is skipped outright under reduced motion.
	*/

	/*
		Both layout tables render, and CSS picks one. That is what keeps the reflow working with
		JavaScript off — a ResizeObserver choosing a viewBox could not. The hidden one is `display: none`,
		so it is out of the accessibility tree as well as off the screen.
	*/
	const uid = $props.id();

	const palette = $derived(themes[theme]);
	const nodes = $derived(trees[theme]);
	const script = $derived(beats[theme]);
	const strips = $derived(stripsFor(theme));

	/** Where the sequence is, in ms. Starts at the end, which is what SSR renders. */
	let clock = $state(END);

	let figure: HTMLElement | undefined;
	let frame = 0;
	let origin = 0;

	/* Cubic out: a card leaves its parent quickly and settles, rather than arriving at full speed. */
	const easeOut = (t: number) => 1 - (1 - t) ** 3;
	const clamp = (t: number) => Math.min(1, Math.max(0, t));

	/* Two decimals is finer than a viewBox unit renders, and keeps the DOM readable. */
	const between = (a: number, b: number, u: number) => Math.round((a + (b - a) * u) * 100) / 100;

	const cards = $derived(
		nodes.map((node) => {
			/* The seed does not travel: it is either there or it is not yet. */
			const raw =
				node.parent === null
					? Number(clock >= node.from)
					: clamp((clock - node.from) / (node.to - node.from));
			const u = easeOut(raw);
			const parent = node.parent;

			return {
				...node,
				u,
				present: raw > 0,
				/* Name, hex and move appear only once the card has landed. */
				landed: raw >= 1,
				fill:
					parent === null
						? palette[node.name].hex
						: travelAxes(palette[parent], palette[node.name], node.phases, u).hex,
				hex: palette[node.name].hex,
				/* The site's own binary label rule: shades take foreground, everything else background. */
				ink: palette[labelFor(node.name)].hex
			};
		})
	);

	const beat = $derived(
		script.find((b) => clock >= b.from && clock < b.to) ?? script[script.length - 1]
	);

	/* The figure as text, for anyone who gets it read to them rather than drawn. */
	const summary = $derived(
		nodes
			.map((node) =>
				node.parent === null
					? `${node.name} ${palette[node.name].hex}, ${node.move}.`
					: `${node.name} ${palette[node.name].hex}, from ${node.parent}, ${node.move}.`
			)
			.join(' ')
	);

	const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function tick(stamp: number) {
		origin ||= stamp;
		clock = Math.min(END, stamp - origin);
		if (clock < END) frame = requestAnimationFrame(tick);
	}

	function play() {
		cancelAnimationFrame(frame);
		if (reduced()) {
			clock = END;
			return;
		}
		origin = 0;
		clock = 0;
		frame = requestAnimationFrame(tick);
	}

	/*
		Plays when it is looked at, once. There are two of these on the page and the light one is several
		screens down, so playing on mount would mean both had finished before either was on screen.

		Nothing is gated on this: the observer only rewinds a figure that is already complete.
	*/
	$effect(() => {
		if (!figure || reduced()) return;

		const watcher = new IntersectionObserver(
			(entries) => {
				if (!entries[0].isIntersecting) return;
				watcher.disconnect();
				play();
			},
			{ threshold: 0.25 }
		);
		watcher.observe(figure);

		return () => {
			watcher.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<div class="tree" bind:this={figure}>
	{#each layouts as layout (layout.key)}
		<div class="stage is-{layout.key}">
			<!--
				Named and described through ids rather than trusting `<title>`/`<desc>` to be picked up on
				their own, which VoiceOver does not do for `role="img"`. Both ids carry `$props.id()` and the
				layout key: two instances on one page would otherwise leave the light figure describing
				itself with the dark one's text.
			-->
			<svg
				viewBox="0 0 {layout.viewBox[0]} {layout.viewBox[1]}"
				role="img"
				aria-labelledby="{uid}-{layout.key}-title"
				aria-describedby="{uid}-{layout.key}-desc"
			>
				<title id="{uid}-{layout.key}-title">How each colour comes from the one before it</title>
				<desc id="{uid}-{layout.key}-desc">{summary}</desc>

				<!--
					Wires first, so a card always covers the line it arrived on. `pathLength="1"` declares the
					length rather than measuring it with `getTotalLength()`, which needs a DOM — this way the
					draw is a plain attribute and the server can render it finished.
				-->
				<g class="wires">
					{#each cards as card (card.name)}
						{#if card.parent}
							<path
								class="wire"
								d={wirePath(layout, card.parent, card.name)}
								pathLength="1"
								stroke-dasharray="1"
								stroke-dashoffset={(1 - card.u).toFixed(4)}
							/>
						{/if}
					{/each}
				</g>

				{#each cards as card (card.name)}
					{#if card.present}
						{@const home = layout.pos[card.name]}
						{@const start = layout.pos[card.parent ?? card.name]}
						{@const x = between(start[0], home[0], card.u)}
						{@const y = between(start[1], home[1], card.u)}
						<!-- Name and hex sit at the top, the move on the last line, 11 units off each edge. -->
						{@const foot = y + layout.cardH - 11}
						<g>
							<rect
								class="card"
								{x}
								{y}
								width={layout.cardW}
								height={layout.cardH}
								rx="3"
								fill={card.fill}
							/>
							{#if card.landed}
								<text class="nm" x={x + 11} y={y + 25} fill={card.ink}>{card.name}</text>
								<text class="hx" x={x + 11} y={y + 40} fill={card.ink}>{card.hex}</text>
								<text class="mv" x={x + 11} y={foot} fill={card.ink}>{card.move}</text>
							{/if}
						</g>
					{/if}
				{/each}
			</svg>
		</div>
	{/each}

	{#each strips as strip (strip.id)}
		<div class="strip">
			<p class="strip-label">{strip.label}</p>
			<ul class="row is-{strip.id}">
				{#each strip.swatches as name (name)}
					<li style="background: {palette[name].hex};">
						{#if strip.named}
							<span style="color: {palette[labelFor(name)].hex};">{name}</span>
						{:else}
							<span class="sr-only">{name} {palette[name].hex}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	<div class="bar">
		<!--
			No `aria-live`. Seven interruptions in eight seconds is noise rather than information, and the
			figure's own `<desc>` already carries the whole tree as text, read at the reader's own pace.
		-->
		<p class="caption">{beat.lead}<strong>{beat.strong}</strong>{beat.tail}</p>
		<button type="button" class="replay" onclick={play}>Replay</button>
	</div>
</div>

<style>
	.tree {
		display: grid;
		gap: var(--space-5);
	}

	/* No plate. This sits in sections that already have a ground, and every card carries its own edge. */
	.stage svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.is-narrow {
		display: none;
	}

	/*
		A viewport query, not a container one: the figure is always the content column wide, and 560px is
		already the breakpoint the swatch grids use.
	*/
	@media (max-width: 560px) {
		.is-wide {
			display: none;
		}

		.is-narrow {
			display: block;
		}
	}

	/*
		A neutral grey rather than `--hairline`, on the cards and the swatches both. The hairline is an
		alpha of the scope's text colour, and these boxes are arbitrary palette colours — grey at a low
		alpha is the only edge that reads on the seed AND on cottontail.
	*/
	.card {
		stroke: rgb(128 128 128 / 36%);
		stroke-width: 1;
	}

	.wire {
		fill: none;
		stroke: var(--brand-foreground);
		stroke-width: 1.25;
		opacity: 0.32;
	}

	/*
		Type sizes are viewBox units, so they grow when the narrow table shrinks the viewBox. That is the
		whole reason there are two tables instead of one figure that scales.
	*/
	text {
		font-family: var(--font-mono);
		user-select: none;
	}

	.nm {
		font-size: 11px;
		letter-spacing: 0.05em;
	}

	.hx,
	.mv {
		font-size: 9.5px;
		/* Same as the hex on a swatch card. Any lower and the binary label rule stops clearing AA. */
		opacity: 0.75;
	}

	.mv {
		letter-spacing: 0.02em;
	}

	.strip-label {
		margin: 0 0 var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	.row {
		display: grid;
		gap: var(--space-1);
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.is-states {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.is-surfaces {
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.row li {
		display: flex;
		align-items: flex-end;
		aspect-ratio: 2.6 / 1;
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		box-shadow: inset 0 0 0 1px rgb(128 128 128 / 30%);
	}

	.row span {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.04em;
	}

	.bar {
		display: flex;
		gap: var(--space-5);
		align-items: baseline;
	}

	/* A floor under it, so the figure does not step up and down as the beats change length. */
	.caption {
		flex: 1;
		max-width: 62ch;
		min-height: 4.5rem;
		margin: 0;
		font-size: var(--text-base);
		color: var(--fg-muted);
	}

	.caption strong {
		font-weight: 600;
		color: var(--brand-foreground);
	}

	/* CopyButton's ghost, minus the hover — nothing in this figure reacts to a pointer. */
	.replay {
		min-width: 5.5rem;
		padding: 0.55rem 0.95rem;
		font: inherit;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--brand-foreground);
		cursor: pointer;
		background: transparent;
		border: 1px solid var(--hairline);
		border-radius: var(--radius-pill);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (max-width: 560px) {
		.bar {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-4);
		}
	}

	/*
		Nothing here moves, so Replay has nothing to replay: the figure is already at its finished state
		and the button would be a control that does nothing. `play()` reads the same query — the sequence
		is driven by requestAnimationFrame rather than by transitions, so the decision has to be made in
		JavaScript as well as here.
	*/
	@media (prefers-reduced-motion: reduce) {
		.replay {
			display: none;
		}
	}
</style>
