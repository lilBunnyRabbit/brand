<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		lede,
		children,
		actions
	}: {
		id: string;
		title: string;
		lede?: string;
		children: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<section {id}>
	<header>
		<div>
			<h2>{title}</h2>
			{#if lede}<p class="lede">{lede}</p>{/if}
		</div>
		{#if actions}
			<div class="actions">{@render actions()}</div>
		{/if}
	</header>
	{@render children()}
</section>

<style>
	section {
		padding-block: clamp(3.5rem, 8vw, 7rem);
		border-top: 1px solid var(--page-border);
		/* Anchors must not land under the sticky header. */
		scroll-margin-top: 5rem;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: clamp(2rem, 4vw, 3rem);
	}

	h2 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
	}

	.lede {
		max-width: 52ch;
		margin: 0.85rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--page-fg-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
