<script lang="ts">
	import Mark from '$lib/components/logo/Mark.svelte';
	import Wordmark from '$lib/components/logo/Wordmark.svelte';
	import { card } from '$lib/brand/config/card';
	import { wordmarks } from '$lib/brand/config/wordmarks';
	import { dark } from '$lib/brand/config/palette';
	import { varName } from '$lib/brand/tokens';
	import type { LogoVariant } from '$lib/brand/types';

	let { variant }: { variant: LogoVariant } = $props();

	const lockup = wordmarks[0];

	/** A ground may be a palette swatch or raw stock (white), which is not in the palette. */
	const resolve = (value: string) => (value in dark ? `var(${varName(value)})` : value);

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
			<div class="face" style="background: {row.groundCss}; color: {row.inkCss};">
				<div class="inner back">
					<Mark {variant} size="30%" ink="currentColor" key="back-{row.id}" />
				</div>
			</div>

			<!--
				Front. The back already carries the mark large, so the front carries the lockup small and
				gives the space to the person: name and role low on the card, contacts on the baseline, one
				left margin for all of it. `--brand-foreground` is re-pointed at the card's ink because the
				lockup sets its name in the foreground token, and on a card the ink IS the foreground.
			-->
			<div
				class="face"
				style="background: {row.groundCss}; color: {row.inkCss}; --brand-foreground: {row.inkCss}; --quiet: {row.quietCss};"
			>
				<div class="inner front">
					<div class="lockup">
						<Wordmark {variant} {lockup} size="9cqi" ink="currentColor" />
					</div>
					<div class="who">
						<p class="name">{card.name}</p>
						<p class="role">{card.role}</p>
					</div>
					<ul class="lines">
						{#each card.lines as line (line.label)}
							<li>{line.value}</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	{/each}
</div>

<p class="note">
	{card.widthMm} × {card.heightMm} mm with {card.bleedMm} mm bleed. Contact details are placeholders.
</p>

<style>
	.sheet {
		display: grid;
		gap: var(--space-6);
	}

	.row {
		display: grid;
		grid-template-columns: 5rem minmax(0, 1fr) minmax(0, 1fr);
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
		font-size: var(--text-xs);
		letter-spacing: 0.14em;
		color: var(--fg-muted);
	}

	.label {
		font-size: var(--text-base);
		font-weight: 700;
	}

	/*
		The aspect box governs, and its content is taken out of flow so it cannot push it taller.

		This was the bug: with the content in normal flow, a flex column plus `margin-top: auto` grew
		past the 85/55 box and the front rendered nearly square. `aspect-ratio` yields to content
		unless the content cannot contribute height — hence `position: absolute` on the inner layer
		and `overflow: hidden` on the box.
	*/
	.face {
		position: relative;
		container-type: inline-size;
		aspect-ratio: var(--ratio);
		overflow: hidden;
		border-radius: var(--radius-md);
		box-shadow: 0 12px 28px -16px rgb(0 0 0 / 0.65);
	}

	.inner {
		position: absolute;
		inset: 0;
		padding: 8cqi;
	}

	.back {
		display: grid;
		place-items: center;
	}

	.front {
		display: grid;
		/* Lockup at the head; the slack sits under it, so the person and the contacts settle to the foot. */
		grid-template-rows: auto 1fr auto auto;
		row-gap: 3cqi;
	}

	.lockup {
		grid-row: 1;
	}

	.who {
		grid-row: 3;
		min-width: 0;
	}

	.name {
		margin: 0;
		font-size: 7cqi;
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.role {
		margin: 1.2cqi 0 0;
		font-size: 3.2cqi;
		line-height: 1.3;
		color: var(--quiet);
	}

	/* Addresses as typed, not shouted: an uppercased e-mail reads as a different string. */
	.lines {
		display: flex;
		flex-wrap: wrap;
		grid-row: 4;
		gap: 0.6cqi 5cqi;
		padding: 0;
		margin: 0;
		font-family: var(--font-mono);
		font-size: 3cqi;
		line-height: 1.4;
		list-style: none;
		color: var(--quiet);
	}

	.note {
		margin: var(--space-6) 0 0;
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

	/* Two faces sharing a phone width put the contact lines near 6px. One per row instead. */
	@media (max-width: 620px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-3);
		}

		.sheet {
			gap: var(--space-8);
		}

		.spec {
			padding-bottom: var(--space-1);
		}
	}
</style>
