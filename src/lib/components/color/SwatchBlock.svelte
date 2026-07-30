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
			Same fill and same width as the two beside it — it is one of three buttons in a row, and being
			the odd one out just read as unfinished. It says what it does instead.
		-->
		<button
			type="button"
			class="pick"
			aria-haspopup="dialog"
			aria-label="All {swatch.notations.length} notations for {swatch.token}"
			onclick={() => sheet.showModal()}
		>
			More <span aria-hidden="true">→</span>
		</button>
	</div>

	<!--
		The sheet is the card, opened up: the WHOLE dialog is the colour, and every row sits on it in the
		card's own label ink. Nothing here is a document surface — a modal that reverted to page grey looked
		like it belonged to a different component than the swatch you clicked.

		Backdrop clicks: a click on `::backdrop` targets the dialog element itself, so comparing the target
		against the element is the whole test. Escape and focus containment are already the platform's.
	-->
	<dialog
		bind:this={sheet}
		style="background: {swatch.hex}; color: var({swatch.labelVar});"
		aria-label="{swatch.label} — every notation"
		onclick={(event) => {
			if (event.target === sheet) sheet.close();
		}}
	>
		<div class="sheet-head">
			{#if variant}
				<Mark {variant} size="1.6rem" ink="currentColor" key="sh-{swatch.token}" />
			{/if}
			<span class="sheet-id">
				<strong>{swatch.label}</strong>
				<span class="sheet-hex">{swatch.hex}</span>
			</span>
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

	/* A wash of the label colour rather than a border — same hue, no extra line. */
	.more button {
		flex: 1;
		background: color-mix(in srgb, currentColor 12%, transparent);
	}

	.more button:hover,
	.more button.is-copied {
		background: color-mix(in srgb, currentColor 26%, transparent);
	}

	.pick span {
		display: inline-block;
		transition: transform var(--dur-fast) var(--ease);
	}

	.pick:hover span {
		transform: translateX(2px);
	}

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

	/*
		`margin: auto` is not redundant here.

		A modal is centred by the UA's `dialog:modal { inset: 0 }` plus `dialog { margin: auto }` — and
		Tailwind's preflight zeroes the margin on every element, which leaves the sheet pinned to the top
		of the viewport instead.

		The colour comes from the inline style, same as the card. Everything inside is `currentColor`
		against it, so one binary label rule covers the whole sheet.
	*/
	/*
		Height is capped by the VIEWPORT and nothing else, so the sheet shows all twenty notations at once
		wherever there is room and only scrolls when there genuinely is not. It used to carry a `32rem` cap
		as well, which made it scroll on a screen with hundreds of spare pixels either side of it.

		`dvh` rather than `vh`, and `--space-6` off each edge so it never touches a screen edge.
	*/
	dialog {
		width: min(30rem, calc(100vw - 2 * var(--space-4)));
		max-height: calc(100dvh - 2 * var(--space-6));
		margin: auto;
		padding: 0;
		overflow: hidden;
		border: 0;
		border-radius: var(--radius-lg);
		/*
			The ring-plus-offset pattern, same as the cottontail panel wears: 2px of cottontail with a real
			gap of scrim between it and the sheet. An outline flush to the edge is indistinguishable from a
			border, and this is not a border — it is the focus-ring treatment, so it should look like one.

			Offset also fixes the one swatch a border could never work on. The outline sits on the scrim
			rather than on the plate, so it reads even on the cottontail card itself, where cottontail on
			cottontail would have disappeared.

			`--brand-cottontail` resolves per scope, so a sheet opened in the light region rings itself in
			light's cottontail with no second rule.
		*/
		outline: 2px solid var(--brand-cottontail);
		outline-offset: 4px;
	}

	dialog::backdrop {
		background: color-mix(in srgb, #000 66%, transparent);
	}

	/* The card face again, at the top of its own sheet. */
	.sheet-head {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		padding: var(--space-4);
	}

	.sheet-id {
		display: grid;
		flex: 1;
		gap: 0.1rem;
	}

	.sheet-id strong {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.sheet-hex {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		text-transform: uppercase;
		opacity: 0.75;
	}

	.x {
		padding: var(--space-1) var(--space-2);
		font: inherit;
		font-size: var(--text-sm);
		color: inherit;
		cursor: pointer;
		background: none;
		border: 0;
		opacity: 0.7;
	}

	.x:hover {
		opacity: 1;
	}

	/*
		`min-height: 0` so the flex child is allowed to be shorter than its content and scroll.

		`overscroll-behavior: contain` so reaching the end of the list does not hand the rest of the gesture
		to the page behind — the page is locked while the sheet is open (see `app.css`), but without this the
		scroll chains anyway on a trackpad and the whole document jumps.
	*/
	.rows {
		display: grid;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
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

	/*
		A wash of the label colour, not a surface token — the row sits on the swatch, so the only colour
		guaranteed to read on it is the one the binary label rule already picked. `--surface-edge` here was a
		page shade landing on an arbitrary swatch.
	*/
	.row:hover,
	.row.is-copied {
		background: color-mix(in srgb, currentColor 16%, transparent);
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
		opacity: 0.8;
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
		opacity: 0.6;
	}
</style>
