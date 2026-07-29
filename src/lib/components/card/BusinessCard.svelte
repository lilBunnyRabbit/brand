<script lang="ts">
	import Mark from '$lib/components/logo/Mark.svelte';
	import { card } from '$lib/brand/config/card';
	import { meta } from '$lib/brand/config/meta';
	import { varName } from '$lib/brand/tokens';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();

	/*
		Plain mark on both faces — no disc. The disc combos are for badges that need to carry their own
		ground; a card already has one.

		Shade budget: the section sits on `background`, the front is `bg_light` and the back is
		`bg_darkest`. Three shades, which is the ceiling — neighbours are close enough that a fourth
		would read as noise rather than structure. Neither face is a brand fill, so the mark can stay
		primary on both.
	*/
	const front = `var(${varName(card.frontShade)})`;
	const back = `var(${varName(card.backShade)})`;
	const ratio = `${card.widthMm} / ${card.heightMm}`;
</script>

<div class="faces" style="--front: {front}; --back: {back}; --ratio: {ratio};">
	<figure>
		<div class="face front">
			<Mark {variant} size="1.85rem" key="card-front" />

			<div class="identity">
				<p class="name">{meta.name}</p>
				<p class="role">{card.role}</p>
			</div>

			<dl class="lines">
				{#each card.lines as line (line.label)}
					<div>
						<dt>{line.label}</dt>
						<dd class:placeholder={line.placeholder}>{line.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<figcaption>Front · {card.frontShade}</figcaption>
	</figure>

	<figure>
		<div class="face back">
			<Mark {variant} size="min(42%, 5rem)" key="card-back" />
		</div>
		<figcaption>Back · {card.backShade}</figcaption>
	</figure>
</div>

<p class="spec">
	{card.widthMm} × {card.heightMm} mm, the usual size. Add {card.bleedMm} mm bleed on every edge for print.
	Printed on dark stock — on a light card the mark becomes <code>background</code> instead, since primary
	all but disappears on white.
</p>

<style>
	.faces {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
		gap: var(--space-5);
	}

	figure {
		margin: 0;
	}

	figcaption {
		margin-top: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--fg-muted);
	}

	.face {
		aspect-ratio: var(--ratio);
		padding: clamp(var(--space-4), 4cqi, var(--space-5));
		overflow: hidden;
		container-type: inline-size;
		border: 1px solid var(--fg-border);
		border-radius: var(--radius-md);
	}

	.front {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: var(--space-3);
		background: var(--front);
	}

	.back {
		display: grid;
		place-items: center;
		background: var(--back);
	}

	.identity {
		align-self: center;
	}

	.name {
		margin: 0;
		font-size: clamp(var(--text-lg), 7cqi, var(--text-2xl));
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.role {
		margin: 0.35rem 0 0;
		font-size: clamp(var(--text-xs), 3.2cqi, var(--text-sm));
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	.lines {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		margin: 0;
	}

	dt {
		font-size: clamp(0.55rem, 2.6cqi, var(--text-xs));
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}

	dd {
		margin: 0.15rem 0 0;
		font-family: var(--font-mono);
		font-size: clamp(0.6rem, 3cqi, var(--text-sm));
	}

	/* Marked, not disguised — so nobody prints a draft. */
	.placeholder {
		text-decoration: line-through;
		text-decoration-color: var(--brand-primary);
		text-decoration-thickness: 1px;
	}

	.spec {
		max-width: 60ch;
		margin: var(--space-5) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
</style>
