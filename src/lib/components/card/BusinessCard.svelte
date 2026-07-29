<script lang="ts">
	import Mark from '$lib/components/logo/Mark.svelte';
	import { card } from '$lib/brand/config/card';
	import { swatches } from '$lib/brand/config/palette';
	import { varName } from '$lib/brand/tokens';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();

	/** A ground may be a palette swatch or raw stock (white), which is not in the palette. */
	const resolve = (value: string) => (value in swatches ? `var(${varName(value)})` : value);

	const rows = card.variants.map((v) => ({
		...v,
		groundCss: resolve(v.ground),
		inkCss: `var(${varName(v.ink)})`,
		quietCss: `var(${varName(v.quiet)})`
	}));
</script>

<div class="sheet" style="--ratio: {card.widthMm} / {card.heightMm};">
	{#each rows as row (row.id)}
		<div class="row">
			<div class="spec">
				<span class="code">{row.code}</span>
				<span class="label">{row.label}</span>
			</div>

			<!-- Back: the mark, centred, nothing else. -->
			<div class="face back" style="background: {row.groundCss}; color: {row.inkCss};">
				<Mark {variant} size="26%" ink="currentColor" key="back-{row.id}" />
			</div>

			<!-- Front: mark top-left, name and role, details along the bottom. -->
			<div
				class="face front"
				style="background: {row.groundCss}; color: {row.inkCss}; --quiet: {row.quietCss};"
			>
				<Mark {variant} size="11%" ink="currentColor" key="front-{row.id}" />
				<div class="who">
					<p class="name">{card.name}</p>
					<p class="role">{card.role}</p>
				</div>
				<ul class="lines">
					{#each card.lines as line (line.label)}
						<li class:placeholder={line.placeholder}>{line.value}</li>
					{/each}
				</ul>
			</div>
		</div>
	{/each}
</div>

<p class="note">
	{card.widthMm} × {card.heightMm} mm with {card.bleedMm} mm bleed. Struck-through lines are placeholders.
</p>

<style>
	.sheet {
		display: grid;
		gap: var(--space-5);
	}

	.row {
		display: grid;
		grid-template-columns: 4.5rem minmax(0, 1fr) minmax(0, 1fr);
		gap: var(--space-4);
		align-items: center;
	}

	.spec {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.code {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.14em;
		color: var(--fg-muted);
	}

	.label {
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.face {
		container-type: inline-size;
		aspect-ratio: var(--ratio);
		border-radius: var(--radius-md);
		box-shadow: 0 10px 24px -14px rgb(0 0 0 / 0.6);
	}

	.back {
		display: grid;
		place-items: center;
	}

	/*
		A card is mostly margin. 9% of the width on every side leaves the type sitting in from the trim
		rather than crowding it, and `cqi` keeps that true at any rendered size.
	*/
	.front {
		display: flex;
		flex-direction: column;
		gap: 5cqi;
		padding: 9cqi;
	}

	.who {
		margin-top: auto;
	}

	.name {
		margin: 0;
		font-size: 11cqi;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	.role {
		margin: 2cqi 0 0;
		font-size: 4cqi;
		color: var(--quiet);
	}

	.lines {
		display: grid;
		gap: 1.4cqi;
		padding: 0;
		margin: 0;
		font-size: 4cqi;
		line-height: 1.3;
		color: var(--quiet);
		list-style: none;
	}

	.placeholder {
		text-decoration: line-through;
		text-decoration-thickness: 1px;
	}

	.note {
		margin: var(--space-5) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	@media (max-width: 860px) {
		.row {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.spec {
			flex-direction: row;
			gap: var(--space-3);
			align-items: baseline;
			grid-column: 1 / -1;
		}
	}

	/*
		Below this, two cards share the width and each face is under 160px — at 4cqi the contact lines
		render around 6px. One card per row instead, so the front is legible at the size it is shown.
	*/
	@media (max-width: 620px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-3);
		}
	}
</style>
