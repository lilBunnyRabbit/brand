<script lang="ts">
	import {
		arcLabelAt,
		arcPath,
		arcs,
		ladder,
		ORIGIN,
		rail,
		soloNodes,
		stateCluster,
		stateNodes,
		allNodes,
		vacancy,
		wall,
		type PlotNode
	} from '$lib/brand/derivation';
	import { swatches } from '$lib/brand/config/palette';
	import { varName } from '$lib/brand/tokens';

	/*
		A chroma × lightness plot with the derivation drawn on top of it.

		Up is lightness. Right is chroma, counted in seeds — multiples of the seed's own chroma — so
		"C × 3" becomes a position on a real axis rather than a caption. The notch cut into each disc
		points at its hue, which puts all three channels into one mark.

		What the geometry says without any words:
		  · nine colours land on ONE horizontal line (L 0.745) — that line IS the rule that says no two
		    brand colours may touch
		  · the seven shades are collinear with the origin, so chroma ∝ lightness is a straight edge
		  · the brand four are evenly spaced at 1, 2, 3, 4 seeds
		  · 5c is a hole twice as wide as any other interval on the rail
		  · the four states collide at one coordinate, so they are one node cut into four
		  · sRGB runs out just past 6c, so there is no 7c to have

		Everything is CSS and prerendered HTML. The crosshair is `:has(input:checked)` — no client JS.
	*/

	const uid = $props.id();

	const seedName = 'background';

	/*
		Selection is bound state rather than a CSS `:has()` chain.

		A pure-CSS version needs one generated rule per colour, Svelte cannot loop inside a scoped
		stylesheet, and emitting a style element from markup breaks the compiler. This is plainer, and
		the cost is honest: the diagram itself is fully server-rendered, and only the crosshair and the
		readout swap need JavaScript. Without it the seed's readout shows and the plot still reads.
	*/
	let selected = $state<string>(seedName);
	const current = $derived(allNodes.find((n) => n.name === selected) ?? allNodes[0]);

	/** Only three shades get a label; seven in that band would collide. */
	const labelledShades = new Set(['bg_lightest', 'background', 'bg_darkest']);

	const fmt = (n: number) => Number(n.toFixed(2));
	const seedsLabel = (n: PlotNode) =>
		Number.isInteger(n.seeds) ? `${n.seeds}c` : `${n.seeds.toFixed(2)}c`;

	function aria(n: PlotNode): string {
		const bits = [
			`${n.name}.`,
			`Lightness ${n.lightness.toFixed(3)},`,
			`chroma ${seedsLabel(n)},`,
			`hue ${Math.round(n.hue)} degrees.`
		];
		if (n.sameLightness > 0) bits.push(`Same lightness as ${n.sameLightness} others.`);
		if (n.sameHue.length > 0) bits.push(`Same hue as ${n.sameHue.join(', ')}.`);
		if (n.sameChroma.length > 0) bits.push(`Same chroma as ${n.sameChroma.join(', ')}.`);
		return bits.join(' ');
	}
</script>

<figure class="plot-figure" data-plot={uid}>
	<!--
		The notes come BEFORE the nodes in the DOM so a screen reader hears the explanation before the
		choices. Absolute positioning does not change reading order.
	-->
	<ul class="notes">
		<li class="note-rail">
			L 0.745. Nine colours, one lightness — which is why none of them may touch.
		</li>
		<li class="note-ray">
			One ray through zero. Lighter shades carry more colour, in exact proportion.
		</li>
		<li class="note-wall">
			sRGB ends here. Six seeds already spends {Math.round(wall.use * 100)}% of it, so there is no
			7c.
		</li>
	</ul>

	<fieldset class="plot">
		<legend class="sr-only">Pick a colour to see what it shares</legend>

		<!-- Scaffold. Every fact in it is repeated in the notes, so it is hidden from the a11y tree. -->
		<svg
			class="scaffold"
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			aria-hidden="true"
			focusable="false"
		>
			<defs>
				<pattern id="hatch-{uid}" width="4" height="4" patternUnits="userSpaceOnUse">
					<path d="M0 4 L4 0" stroke="var(--hairline)" stroke-width="0.6" />
				</pattern>
			</defs>

			<!-- The ray: the seven shades are collinear with the origin. -->
			<path
				class="ray"
				d="M{fmt(ORIGIN.x)} {fmt(ORIGIN.y)} L{fmt(ladder[0].x)} {fmt(ladder[0].y)}"
				vector-effect="non-scaling-stroke"
			/>

			<!-- The rail: one lightness, nine colours. -->
			<path
				class="rail"
				d="M{fmt(rail.x1)} {fmt(rail.y)} H{fmt(rail.x2)}"
				vector-effect="non-scaling-stroke"
			/>

			<!-- Seed up to the rail — the seed is where foreground is derived from. -->
			<path
				class="stalk"
				d="M{fmt(ladder[3].x)} {fmt(ladder[3].y)} L{fmt(soloNodes[7].x)} {fmt(soloNodes[7].y)}"
				vector-effect="non-scaling-stroke"
			/>

			<!-- Primary up to cottontail. -->
			<path
				class="riser"
				d="M{fmt(soloNodes[10].x)} {fmt(soloNodes[10].y)} L{fmt(soloNodes[12].x)} {fmt(
					soloNodes[12].y
				)}"
				vector-effect="non-scaling-stroke"
			/>

			<!-- The empty 5c rung. -->
			<path
				class="vacancy"
				d="M{fmt(vacancy.x)} {fmt(rail.y - 9)} V{fmt(rail.y + 9)}"
				vector-effect="non-scaling-stroke"
			/>

			<!-- Where sRGB runs out. -->
			<rect
				class="wall"
				x={fmt(wall.x)}
				y={fmt(rail.y - 5)}
				width={fmt(100 - wall.x)}
				height="10"
				fill="url(#hatch-{uid})"
			/>

			{#each arcs as arc (arc.id)}
				<path class="arc" d={arcPath(arc)} vector-effect="non-scaling-stroke" />
			{/each}
		</svg>

		<!-- Arc labels are HTML: the SVG is stretched non-uniformly, so no text may live inside it. -->
		{#each arcs as arc (arc.id)}
			{@const at = arcLabelAt(arc)}
			<span class="arc-label" data-arc={arc.id} style="--x: {at.x}%; --y: {at.y}%;">
				{arc.label}
			</span>
		{/each}

		<span class="axis axis-x">chroma, in seeds →</span>
		<span class="axis axis-y">← lightness</span>

		<ul class="nodes">
			{#each soloNodes as node (node.name)}
				<li
					style="--x: {node.x}%; --y: {node.y}%; --hue: {node.hue}deg; --fill: var({varName(
						node.name
					)});"
					class:is-seed={node.name === seedName}
					class:is-cottontail={node.name === 'cottontail'}
				>
					<label class:is-on={selected === node.name}>
						<input
							type="radio"
							name="derive-{uid}"
							value={node.name}
							bind:group={selected}
							aria-label={aria(node)}
						/>
						<span class="dial" aria-hidden="true"></span>
						<span class="cross" aria-hidden="true"></span>
						{#if !node.name.startsWith('bg_') || labelledShades.has(node.name)}
							<span class="tag" aria-hidden="true">{node.name}</span>
						{/if}
					</label>
				</li>
			{/each}

			<!--
				The states share one coordinate exactly, so they are drawn as one node cut into four by
				gaps of the panel shade. The collision is the finding, not a problem to lay out around.
			-->
			<li class="quad" style="--x: {stateCluster.x}%; --y: {stateCluster.y}%;">
				{#each stateNodes as node (node.name)}
					<label
						class:is-on={selected === node.name}
						style="--hue: {node.hue}deg; --fill: var({varName(node.name)});"
					>
						<input
							type="radio"
							name="derive-{uid}"
							value={node.name}
							bind:group={selected}
							aria-label={aria(node)}
						/>
						<span class="dial" aria-hidden="true"></span>
						<span class="cross" aria-hidden="true"></span>
					</label>
				{/each}
				<span class="tag" aria-hidden="true">states</span>
			</li>
		</ul>
	</fieldset>

	<!--
		One readout per colour, only the checked one displayed — and therefore only that one in the
		a11y tree. No live region: the radio's own name already speaks the facts, and Announcer is the
		page's single live region.
	-->
	<div class="readout">
		<div class="card">
			<span class="chip" style="background: var({varName(current.name)});" aria-hidden="true"
			></span>
			<p class="card-head">
				<strong>{current.name}</strong>
				<code>{current.hex}</code>
			</p>
			<p class="card-nums">
				L {current.lightness.toFixed(3)} · C {swatches[current.name].c.toFixed(4)} = {seedsLabel(
					current
				)} · H {Math.round(current.hue)}°
			</p>
			<p class="card-how">{current.how}</p>
			<p class="card-share">
				{#if current.sameLightness > 0}Shares its lightness with {current.sameLightness} others.{/if}
				{#if current.sameHue.length > 0}Same hue as {current.sameHue.join(', ')}.{/if}
				Uses {Math.round(current.gamutUse * 100)}% of the chroma sRGB has there.
			</p>
		</div>
	</div>

	<figcaption>
		Up is lightness. Right is chroma, counted in seeds. The notch points at the hue. Pick a dial and
		the lines show what it shares.
	</figcaption>
</figure>

<style>
	.plot-figure {
		margin: 0;
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

	.notes {
		display: grid;
		gap: var(--space-2);
		padding: 0;
		margin: 0 0 var(--space-5);
		font-size: var(--text-sm);
		color: var(--fg-muted);
		list-style: none;
	}

	.notes li {
		padding-left: var(--space-4);
		border-left: 2px solid var(--hairline);
	}

	.note-rail {
		border-left-color: var(--brand-primary) !important;
	}

	/* The plot sits on the darkest shade: the nodes are the brightest things on the page. */
	.plot {
		position: relative;
		aspect-ratio: 1040 / 620;
		padding: 0;
		margin: 0;
		overflow: hidden;
		background: var(--brand-bg_darkest);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	.scaffold {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/*
		Informational strokes, so WCAG 1.4.11 applies: --fg-border is foreground at 67%, the project's
		tested >=3:1 alpha on every shade. --hairline (14%) is decorative and not legal here.
	*/
	.scaffold path {
		fill: none;
		stroke: var(--fg-border);
		stroke-width: 1;
	}

	.rail {
		stroke-width: 1.5;
	}

	.riser,
	.vacancy {
		stroke-dasharray: 3 2;
	}

	.arc {
		opacity: 0.75;
	}

	.arc-label {
		position: absolute;
		top: var(--y);
		left: var(--x);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
		transform: translate(-50%, -50%);
	}

	.axis {
		position: absolute;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
		opacity: 0.7;
	}

	.axis-x {
		right: var(--space-4);
		bottom: var(--space-3);
	}

	.axis-y {
		top: var(--space-3);
		left: var(--space-4);
	}

	.nodes {
		position: absolute;
		inset: 0;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.nodes > li {
		position: absolute;
		top: var(--y);
		left: var(--x);
		transform: translate(-50%, -50%);
	}

	label {
		position: relative;
		display: block;
		cursor: pointer;
	}

	/* Hidden but focusable — never display:none, which removes it from the tab order. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.dial {
		position: relative;
		display: block;
		width: var(--node, 28px);
		height: var(--node, 28px);
		background: var(--fill);
		border-radius: 50%;
	}

	/*
		The notch: a bar of the panel shade cut into the disc, pointing at the hue. 0deg is up and it
		turns clockwise. It doubles as constraint 2 made into an encoding — the separator between two
		colours is always a page shade.
	*/
	.dial::after {
		position: absolute;
		bottom: 50%;
		left: 50%;
		width: 2px;
		height: 44%;
		content: '';
		background: var(--brand-bg_darkest);
		transform-origin: 50% 100%;
		transform: translateX(-50%) rotate(var(--hue));
	}

	.tag {
		position: absolute;
		top: calc(100% + 0.4rem);
		left: 50%;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
		white-space: nowrap;
		transform: translateX(-50%);
	}

	.is-seed .tag {
		font-size: var(--text-sm);
		color: var(--brand-foreground);
	}

	/* cottontail only ever sits on primary, here as well: a primary ring, then panel. */
	.is-cottontail .dial {
		box-shadow: 0 0 0 4px var(--brand-primary);
	}

	label:hover .dial {
		box-shadow:
			0 0 0 3px var(--brand-bg_darkest),
			0 0 0 4px var(--fg-border);
	}

	.is-cottontail label:hover .dial {
		box-shadow:
			0 0 0 4px var(--brand-primary),
			0 0 0 6px var(--fg-border);
	}

	label:hover .tag {
		color: var(--brand-foreground);
	}

	/* Checked ring sits in the panel gap, never on the fill — foreground on a fill is ~1.05:1. */
	label.is-on .dial {
		box-shadow:
			0 0 0 3px var(--brand-bg_darkest),
			0 0 0 5px var(--brand-foreground);
	}

	label.is-on .tag {
		color: var(--brand-foreground);
	}

	/* The crosshair inherits the node's own position, so no coordinate is written twice. */
	.cross {
		display: none;
	}

	label.is-on .cross {
		display: block;
	}

	.cross::before,
	.cross::after {
		position: absolute;
		background: var(--fg-border);
		content: '';
	}

	.cross::before {
		top: 50%;
		right: -100vw;
		left: -100vw;
		height: 1px;
	}

	.cross::after {
		top: -100vh;
		bottom: -100vh;
		left: 50%;
		width: 1px;
	}

	.quad {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 4px;
		padding: 6px;
		background: var(--brand-bg_darkest);
		border-radius: var(--radius-sm);
	}

	.quad .dial {
		width: 20px;
		height: 20px;
	}

	.quad > .tag {
		top: calc(100% + 0.4rem);
	}

	/* ── readout ── */
	.readout {
		margin-top: var(--space-5);
	}

	.card {
		display: grid;
		gap: var(--space-1) var(--space-4);
		grid-template-columns: auto minmax(0, 1fr);
		align-items: baseline;
		padding: var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-md);
	}

	.chip {
		grid-row: 1 / span 4;
		width: 2.5rem;
		height: 1rem;
		border-radius: var(--radius-sm);
	}

	.card p {
		grid-column: 2;
		margin: 0;
	}

	.card-head {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		font-size: var(--text-base);
	}

	.card-head code,
	.card-nums {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.card-how {
		margin-top: var(--space-2) !important;
	}

	.card-share {
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	figcaption {
		margin-top: var(--space-4);
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	@media (max-width: 680px) {
		.plot {
			aspect-ratio: 296 / 540;
		}

		.dial {
			--node: 20px;
		}

		.quad .dial {
			width: 13px;
			height: 13px;
		}

		/* Two of the four arc numbers collide at this width; the readout still carries them. */
		.arc-label[data-arc='foreground-primary'],
		.arc-label[data-arc='primary-tertiary'] {
			display: none;
		}
	}
</style>
