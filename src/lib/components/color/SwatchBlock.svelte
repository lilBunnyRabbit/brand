<script lang="ts">
	import { copyText } from '$lib/clipboard.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import type { SwatchView } from '$lib/brand/tokens';
	import type { LogoVariant } from '$lib/brand/types';

	let { swatch, variant }: { swatch: SwatchView; variant?: LogoVariant } = $props();

	let copied = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	async function copy(id: string, value: string, what: string) {
		const ok = await copyText(value, what);
		copied = ok ? id : null;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = null), 1600);
	}

	const hex = $derived(swatch.primary[0]);
	const rest = $derived(swatch.primary.slice(1));

	/*
		A native <dialog>, opened with showModal(), because the sheet used to be a <details> INSIDE the
		card: the card has `overflow: hidden` and is one cell of a grid, so an expanded sheet was clipped
		on the right and pushed the row's other cards down. A modal renders in the top layer, which no
		ancestor can clip, and the platform supplies Escape, focus trapping and inertness for free.

		It lists EVERY notation rather than the leftovers — once it is a sheet of its own it may as well be
		the complete reference, so hex and the two on the face appear here too.
	*/
	let sheet: HTMLDialogElement;

	const cssRows = $derived(swatch.notations.filter((n) => n.css));
	const libRows = $derived(swatch.notations.filter((n) => !n.css));
</script>

<!--
	The whole card IS the colour. No border, no chrome around it — the swatch is the object, so it
	fills its own box and the mark sits inside it to show the colour actually carrying something.

	The label colour is a binary rule: shades take `foreground`, everything else takes `background`.
	Nothing else clears AA on both halves of the palette.
-->
<article style="background: {swatch.hex}; color: var({swatch.labelVar});">
	<button
		type="button"
		class="face"
		aria-label="Copy {swatch.token} hex {swatch.hex}"
		onclick={() => copy(hex.id, hex.value, `${swatch.token} hex`)}
	>
		{#if variant}
			<span class="art"
				><Mark {variant} size="1.6rem" ink="currentColor" key="sw-{swatch.token}" /></span
			>
		{/if}
		<span class="meta">
			<span class="name">{swatch.label}</span>
			<span class="hex">{swatch.hex}</span>
		</span>
		<span class="said" aria-hidden="true">{copied === hex.id ? 'Copied' : 'Copy'}</span>
	</button>

	<div class="more">
		{#each rest as format (format.id)}
			<button
				type="button"
				class:is-copied={copied === format.id}
				aria-label="Copy {swatch.token} as {format.label}: {format.value}"
				onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
			>
				{copied === format.id ? '✓' : format.label}
			</button>
		{/each}

		<!--
			Not styled like its neighbours on purpose. The two beside it copy; this one opens something, so
			it drops the fill and sits quieter until you go looking for it.
		-->
		<button
			type="button"
			class="pick"
			aria-haspopup="dialog"
			aria-label="All {swatch.notations.length} notations for {swatch.token}"
			onclick={() => sheet.showModal()}
		>
			More
		</button>
	</div>

	<dialog bind:this={sheet} aria-label="{swatch.label} — every notation">
		<div class="sheet-head">
			<span class="sheet-chip" style="background: {swatch.hex};" aria-hidden="true"></span>
			<strong>{swatch.label}</strong>
			<button type="button" class="x" aria-label="Close" onclick={() => sheet.close()}>✕</button>
		</div>

		<div class="rows">
			{#each cssRows as format (format.id)}
				<button
					type="button"
					class="row"
					class:is-copied={copied === format.id}
					aria-label="Copy {swatch.token} as {format.label}: {format.value}"
					onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
				>
					<span class="rl">{format.label}</span>
					<span class="rv">{copied === format.id ? 'Copied' : format.value}</span>
				</button>
			{/each}

			{#if libRows.length}
				<p class="divider">Not valid CSS — culori spaces</p>
				{#each libRows as format (format.id)}
					<button
						type="button"
						class="row is-lib"
						class:is-copied={copied === format.id}
						aria-label="Copy {swatch.token} as {format.label}: {format.value}"
						onclick={() => copy(format.id, format.value, `${swatch.token} ${format.label}`)}
					>
						<span class="rl">{format.label}</span>
						<span class="rv">{copied === format.id ? 'Copied' : format.value}</span>
					</button>
				{/each}
			{/if}
		</div>
	</dialog>
</article>

<style>
	article {
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--radius-lg);
	}

	.face {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: flex-start;
		justify-content: space-between;
		min-height: 8.5rem;
		padding: var(--space-4);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		background: none;
		border: 0;
	}

	.art {
		display: block;
		opacity: 0.9;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.name {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.hex {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		text-transform: uppercase;
		opacity: 0.75;
	}

	.said {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease);
	}

	.face:hover .said,
	.face:focus-visible .said {
		opacity: 0.8;
	}

	/* One row: two copies and a way in. No wrapping — three items fit at any card width. */
	.more {
		display: flex;
		gap: 1px;
	}

	.more button {
		padding: var(--space-2) var(--space-1);
		font: inherit;
		font-size: var(--text-xs);
		font-weight: 700;
		color: inherit;
		text-align: center;
		cursor: pointer;
		background: none;
		border: 0;
	}

	/* The two that copy. A wash of the label colour rather than a border — same hue, no extra line. */
	.more button:not(.pick) {
		flex: 1;
		background: color-mix(in srgb, currentColor 12%, transparent);
	}

	.more button:not(.pick):hover,
	.more button.is-copied {
		background: color-mix(in srgb, currentColor 26%, transparent);
	}

	/* Quieter than the two it sits beside, and no fill: it opens rather than copies. */
	.pick {
		padding-inline: var(--space-4);
		font-weight: 500;
		opacity: 0.7;
	}

	.pick:hover {
		background: color-mix(in srgb, currentColor 12%, transparent);
		opacity: 1;
	}

	/*
		The sheet stops inheriting the plate.

		It is a child of the coloured card, so without these it would render as text-on-swatch — every
		colour in the palette as a different dialog. It is a document surface, so it uses the document's
		own tokens, and inside a light region those resolve light.
	*/
	/*
		`display` goes on `dialog[open]`, NEVER on `dialog`.

		The UA stylesheet closes a dialog with `dialog:not([open]) { display: none }`, which any author
		`display` on the bare element beats — so a plain `dialog { display: flex }` renders all 34 sheets
		inline, in the swatch grid, as if each card were a panel of conversion rows. It looks like a card
		redesign rather than a broken selector, which is exactly what makes it worth a comment.
	*/
	dialog[open] {
		display: flex;
		flex-direction: column;
	}

	dialog {
		width: min(30rem, calc(100vw - 2 * var(--space-4)));
		max-height: min(32rem, calc(100vh - 2 * var(--space-6)));
		padding: 0;
		overflow: hidden;
		color: var(--brand-foreground);
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
	}

	dialog::backdrop {
		background: color-mix(in srgb, #000 62%, transparent);
	}

	.sheet-head {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		padding: var(--space-4);
		border-bottom: 1px solid var(--hairline);
	}

	.sheet-chip {
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
	}

	.sheet-head strong {
		flex: 1;
	}

	.x {
		padding: var(--space-1) var(--space-2);
		font: inherit;
		font-size: var(--text-sm);
		color: var(--fg-muted);
		cursor: pointer;
		background: none;
		border: 0;
	}

	.x:hover {
		color: var(--brand-foreground);
	}

	/* `min-height: 0` so the flex child is allowed to be shorter than its content and scroll. */
	.rows {
		display: grid;
		min-height: 0;
		overflow-y: auto;
	}

	.row {
		display: flex;
		gap: var(--space-4);
		align-items: baseline;
		justify-content: space-between;
		padding: var(--space-2) var(--space-4);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		background: none;
		border: 0;
	}

	.row:hover,
	.row.is-copied {
		background: var(--surface-edge);
	}

	.rl {
		flex: 0 0 auto;
		font-size: var(--text-xs);
		font-weight: 700;
	}

	.rv {
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--fg-muted);
	}

	.row.is-lib .rl {
		font-weight: 600;
		opacity: 0.8;
	}

	.divider {
		padding: var(--space-4) var(--space-4) var(--space-1);
		margin: 0;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg-muted);
	}
</style>
