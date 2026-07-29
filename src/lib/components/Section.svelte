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
		padding-block: clamp(var(--space-8), 8vw, 6rem);
		/* Anchors must not land under the sticky header. */
		scroll-margin-top: 5rem;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: clamp(var(--space-6), 4vw, var(--space-8));
	}

	h2 {
		margin: 0;
		font-size: var(--text-display);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
	}

	.lede {
		max-width: 52ch;
		margin: var(--space-3) 0 0;
		font-size: var(--text-lg);
		line-height: 1.6;
		color: var(--fg-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
