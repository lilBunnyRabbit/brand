<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		index,
		title,
		lede,
		/**
		 * Which brand colour marks this section. Rotating through tertiary, secondary, primary and
		 * accent is what gives the quieter three an actual job in the page rather than only appearing
		 * as swatches of themselves.
		 */
		accent = 'primary',
		children,
		actions
	}: {
		id: string;
		index?: string;
		title: string;
		lede?: string;
		accent?: 'tertiary' | 'secondary' | 'primary' | 'accent';
		children: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<section {id} style="--section-accent: var(--brand-{accent});">
	<header>
		<div>
			{#if index}<p class="index">{index}</p>{/if}
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
		/*
			Top only. With padding on both edges, the gap between two sections was the sum of both —
			up to 192px of dead space, which is what made the rhythm look broken. The next section's
			top padding is the gap.
		*/
		padding-block: clamp(var(--space-6), 6vw, 4.5rem) 0;
		/* Anchors must not land under the sticky header. */
		scroll-margin-top: calc(var(--header-h) + var(--space-4));
	}

	header {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: clamp(var(--space-5), 3vw, var(--space-6));
	}

	.index {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin: 0 0 var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--section-accent);
	}

	.index::after {
		flex: 1;
		max-width: 4rem;
		height: 1px;
		content: '';
		background: var(--section-accent);
		opacity: 0.5;
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
		color: var(--brand-foreground);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
</style>
