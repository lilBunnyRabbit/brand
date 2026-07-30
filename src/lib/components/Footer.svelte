<script lang="ts">
	import { meta } from '$lib/brand/config/meta';

	/**
	 * The end of the document.
	 *
	 * Lives here rather than in the layout because its mode is a page decision: the guide ends inside
	 * the light region, so its footer is light and needs to sit inside that scope. The error page ends
	 * dark. A footer in the layout could only ever be one of those.
	 */
</script>

<footer>
	<div class="measure inner">
		<p>{meta.name} — {meta.tagline} Dark is the brand; light is for interfaces.</p>
		<nav aria-label="Elsewhere">
			{#each meta.links as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</nav>
	</div>
</footer>

<style>
	footer {
		margin-top: var(--stack-section);
		border-top: 1px solid var(--hairline);
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		align-items: center;
		justify-content: space-between;
		padding-block: var(--space-6);
	}

	p {
		max-width: 60ch;
		margin: 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	nav {
		display: flex;
		gap: var(--space-1);
	}

	a {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--fg-muted);
		text-decoration: none;
		border-radius: var(--radius-pill);
	}

	a:hover {
		color: var(--brand-foreground);
		background: var(--surface-raised);
	}

	@media (max-width: 720px) {
		.inner {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
