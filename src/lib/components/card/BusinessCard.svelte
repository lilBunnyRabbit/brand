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

	const ratio = `${card.widthMm} / ${card.heightMm}`;
</script>

<div class="sheet" style="--ratio: {ratio};">
	{#each rows as row (row.id)}
		<div class="row">
			<div class="spec">
				<span class="code">{row.code}</span>
				<span class="label">{row.label}</span>
			</div>

			<!-- Back: the mark, centred, nothing else. -->
			<div class="face back" style="background: {row.groundCss}; color: {row.inkCss};">
				<Mark {variant} size="22%" ink="currentColor" key="back-{row.id}" />
			</div>

			<!-- Front: small mark, name, role, details. -->
			<div
				class="face front"
				style="background: {row.groundCss}; color: {row.inkCss}; --quiet: {row.quietCss};"
			>
				<Mark {variant} size="9%" ink="currentColor" key="front-{row.id}" />
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
		padding: 7cqi;
		overflow: hidden;
		border-radius: var(--radius-md);
		box-shadow: 0 10px 24px -12px rgb(0 0 0 / 0.55);
	}

	.back {
		display: grid;
		place-items: center;
	}

	.front {
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 3cqi;
	}

	.who {
		align-self: end;
	}

	.name {
		margin: 0;
		font-size: 9cqi;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.role {
		margin: 1.5cqi 0 0;
		padding-bottom: 2.5cqi;
		font-size: 3.4cqi;
		color: var(--quiet);
		/* A hairline of the ink, not a global border colour — it belongs to the card. */
		border-bottom: 1px solid color-mix(in srgb, currentColor 35%, transparent);
	}

	.lines {
		display: grid;
		gap: 1cqi;
		padding: 0;
		margin: 0;
		font-size: 3.4cqi;
		list-style: none;
		color: var(--quiet);
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

	@media (max-width: 760px) {
		.row {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.spec {
			grid-column: 1 / -1;
			flex-direction: row;
			gap: var(--space-3);
			align-items: baseline;
		}
	}
</style>
