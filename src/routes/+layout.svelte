<script lang="ts">
	import '$lib/styles/app.css';

	import Announcer from '$lib/components/Announcer.svelte';
	import { brandStyleSheet } from '$lib/brand/tokens';
	import { home, sections } from '$lib/brand/nav';
	import { instantiateSvg } from '$lib/svg';
	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';

	let { children } = $props();

	/*
		The palette as CSS custom properties.

		This is evaluated by SSR during `vite build` and baked into the static HTML's <head>, so the
		page is fully styled on first paint with no client JS involved. A `style` attribute on a
		wrapper could not do this — it cannot reach `html`/`body`, so the page background,
		`color-scheme` and scrollbar theming would all be left out.
	*/
	// Built as a whole tag here rather than interpolated inside {@html} in the markup: svelte-check
	// does not read a template literal inside {@html} as a usage, and `noUnusedLocals` then fails.
	const tokenStyle = `<style id="brand-tokens">${brandStyleSheet()}</style>`;
	const links = sections();

	/** The mark, for the header. Frozen: header chrome is not the place for a looping animation. */
	const mark = logos.variants.find((v) => !v.hidden);

	// Per-instance id namespace: this same mark also renders in the hero and in every logo tile.
	const uid = $props.id();
</script>

<svelte:head>
	{@html tokenStyle}
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<Announcer />

<a class="skip" href="#logo">Skip to content</a>

<header class="bar">
	<div class="inner">
		<a class="brand" href={home()}>
			{#if mark}
				<span class="mark">{@html instantiateSvg(mark.frozen, `${uid}-header`)}</span>
			{/if}
			<span class="wordmark">{meta.name}</span>
		</a>
		<nav aria-label="Sections">
			{#each links as link (link.id)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</nav>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer>
	<div class="inner">
		<p>{meta.name} — {meta.tagline}</p>
		<nav aria-label="Elsewhere">
			{#each meta.links as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</nav>
	</div>
</footer>

<style>
	.skip {
		position: absolute;
		left: -9999px;
	}

	.skip:focus {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 20;
		padding: 0.6rem 1rem;
		color: var(--page-bg);
		text-decoration: none;
		background: var(--page-fg);
		border-radius: 999px;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 10;
		background: color-mix(in srgb, var(--page-bg) 88%, transparent);
		backdrop-filter: blur(12px) saturate(160%);
		border-bottom: 1px solid var(--page-border);
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		max-width: var(--measure);
		padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
		margin-inline: auto;
	}

	.brand {
		display: inline-flex;
		gap: 0.6rem;
		align-items: center;
		text-decoration: none;
	}

	.mark {
		display: block;
		width: 1.5rem;
		color: var(--page-fg);
	}

	.mark :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}

	.wordmark {
		font-size: 0.9375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	nav {
		display: flex;
		gap: 0.35rem;
	}

	nav a {
		padding: 0.4rem 0.7rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--page-fg-muted);
		text-decoration: none;
		border-radius: 999px;
	}

	nav a:hover {
		color: var(--page-fg);
		background: var(--page-surface);
	}

	main {
		max-width: var(--measure);
		padding-inline: clamp(1rem, 4vw, 2.5rem);
		margin-inline: auto;
	}

	footer {
		margin-top: clamp(3rem, 8vw, 6rem);
		border-top: 1px solid var(--page-border);
	}

	footer p {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--page-fg-subtle);
	}

	footer .inner {
		padding-block: 2rem;
	}
</style>
