<script lang="ts">
	import '$lib/styles/app.css';

	import Announcer from '$lib/components/Announcer.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import { brandStyleSheet } from '$lib/brand/tokens';
	import { home, sections } from '$lib/brand/nav';
	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';

	let { children } = $props();

	/*
		The palette as CSS custom properties.

		Evaluated by SSR during `vite build` and baked into the static HTML's <head>, so the page is
		fully styled on first paint with no client JS. A `style` attribute on a wrapper could not do
		this — it cannot reach `html`/`body`, so the page background and `color-scheme` would be left
		out.

		Built as a whole tag here rather than interpolated inside {@html} in the markup: svelte-check
		does not read a template literal inside {@html} as a usage, and `noUnusedLocals` then fails.
	*/
	const tokenStyle = `<style id="brand-tokens">${brandStyleSheet()}</style>`;
	const links = sections();

	const mark = logos.variants.find((v) => !v.hidden);

	/*
		The bar belongs to the top of the page. It leaves as soon as you move off it and only comes back
		when you return — not on any upward flick, which made it pop in and out constantly mid-page.

		Two thresholds rather than one so the boundary cannot oscillate: it hides past SHOW and only
		reappears below HIDE, giving 40px of hysteresis where nothing changes.
	*/
	const SHOW = 40;
	const HIDE = 80;

	let hidden = $state(false);
	let scrolled = $state(false);

	function onScroll() {
		const y = window.scrollY;
		scrolled = y > 8;

		if (y > HIDE) hidden = true;
		else if (y < SHOW) hidden = false;
	}
</script>

<svelte:head>
	{@html tokenStyle}
	<!-- Matches the page shade, so mobile browser chrome extends the page rather than framing it. -->
	<meta name="theme-color" content="#17252c" />
</svelte:head>

<svelte:window onscroll={onScroll} />

<Announcer />

<a class="skip" href="#colours">Skip to content</a>

<!--
	The mark, parked in the corner while the bar is away. `aria-hidden` because it duplicates the
	header's own home link — a screen reader should not hear two of them.
-->
{#if mark}
	<!--
		Always in the DOM and toggled by a class, not created and destroyed — a CSS transition cannot
		run on an element that did not exist a frame ago.
	-->
	<a class="perch" class:is-shown={hidden} href={home()} tabindex="-1" aria-hidden="true">
		<Mark variant={mark} size="1.5rem" ink="var(--brand-foreground)" key="perch" />
	</a>
{/if}

<header class="bar" class:is-hidden={hidden} class:is-scrolled={scrolled}>
	<div class="inner">
		<a class="brand" href={home()}>
			{#if mark}
				<!-- The mark stays in the bar. It is chrome, so `foreground`. -->
				<Mark variant={mark} size="1.35rem" ink="var(--brand-foreground)" key="header" />
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
		<p>{meta.name} — {meta.tagline} Dark only; a light mode is designed but not built.</p>
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
		top: var(--space-3);
		left: var(--space-3);
		z-index: 20;
		padding: var(--space-2) var(--space-4);
		color: var(--on-brand);
		text-decoration: none;
		background: var(--brand-primary);
		border-radius: var(--radius-pill);
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 10;
		background: color-mix(in srgb, var(--brand-background) 82%, transparent);
		border-bottom: 1px solid transparent;
		backdrop-filter: blur(12px) saturate(150%);
		transition:
			transform var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}

	/* The hairline only appears once there is something to separate from. */
	.bar.is-scrolled {
		border-bottom-color: var(--hairline);
	}

	.bar.is-hidden {
		transform: translateY(-100%);
	}

	/* The bare mark in `foreground`, matching the header. No pill, no ground of its own. */
	/*
		The mark, kept on screen while the bar is away. Aligned to the same gutter the bar uses, so it
		lands exactly where the bar's own mark was rather than near it.
	*/
	.perch {
		position: fixed;
		top: var(--space-3);
		left: clamp(var(--space-4), 4vw, var(--space-6));
		z-index: 11;
		display: block;
		opacity: 0;
		transform: scale(0.55) translateY(-0.5rem);
		transition:
			opacity 0.22s var(--ease),
			transform 0.28s var(--ease-spring, var(--ease));
		pointer-events: none;
	}

	.perch.is-shown {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		align-items: center;
		justify-content: space-between;
		max-width: var(--measure);
		padding: var(--space-3) clamp(var(--space-4), 4vw, var(--space-6));
		margin-inline: auto;
	}

	.brand {
		display: inline-flex;
		gap: var(--space-3);
		align-items: center;
		text-decoration: none;
	}

	.wordmark {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	nav {
		display: flex;
		gap: var(--space-1);
	}

	/*
		Six section links do not fit beside the wordmark on a phone. They scroll horizontally in their
		own strip rather than wrapping — wrapping pushed the header to ~104px and put every anchor
		underneath it.
	*/
	@media (max-width: 720px) {
		.inner {
			flex-wrap: nowrap;
			gap: var(--space-3);
		}

		nav {
			overflow-x: auto;
			scrollbar-width: none;
			-webkit-overflow-scrolling: touch;
		}

		nav::-webkit-scrollbar {
			display: none;
		}

		nav a {
			padding-inline: var(--space-2);
			white-space: nowrap;
		}

		footer .inner {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	nav a {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--fg-muted);
		text-decoration: none;
		border-radius: var(--radius-pill);
	}

	nav a:hover {
		color: var(--brand-foreground);
		background: var(--surface-raised);
	}

	main {
		max-width: var(--measure);
		padding-inline: clamp(var(--space-4), 4vw, var(--space-6));
		margin-inline: auto;
	}

	footer {
		margin-top: clamp(var(--space-6), 6vw, 4rem);
	}

	footer p {
		max-width: 60ch;
		margin: 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	footer .inner {
		padding-block: var(--space-6);
	}

	/*
		The bar still hides — that is behaviour, not decoration — it just snaps instead of sliding. The
		global reduced-motion rule already caps durations, this makes the intent explicit.
	*/
	@media (prefers-reduced-motion: reduce) {
		.bar,
		.perch {
			transition: none;
		}
	}
</style>
