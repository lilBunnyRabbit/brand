<script lang="ts">
	import '$lib/styles/app.css';

	import Announcer from '$lib/components/Announcer.svelte';
	import Mark from '$lib/components/logo/Mark.svelte';
	import { brandStyleSheet } from '$lib/brand/tokens';
	import { home, sections } from '$lib/brand/nav';
	import { logos } from '$lib/brand/discover';
	import { meta } from '$lib/brand/config/meta';
	import { dark, light } from '$lib/brand/config/palette';

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

	/*
		The corner mark is `position: fixed`, so it sits OUTSIDE the light region and CSS cannot reach it
		— scroll far enough and a pale grey mark ends up on cream. The fix is to make the perch its own
		scope: carrying `data-theme="light"` re-resolves `--brand-foreground` for that one element, so the
		ink follows the palette instead of being hardcoded twice.

		Detected by geometry rather than an IntersectionObserver, because what matters is not whether the
		light region is on screen but whether it is under the mark specifically — and the scroll handler
		is already reading layout, so this costs one rect.
	*/
	const PERCH_BOTTOM = 56;

	let onLight = $state(false);
	let region: Element | null = null;

	function onScroll() {
		const y = window.scrollY;
		scrolled = y > 8;

		if (y > HIDE) hidden = true;
		else if (y < SHOW) hidden = false;

		region ??= document.getElementById('light-region');
		if (region) {
			const box = region.getBoundingClientRect();
			onLight = box.top < PERCH_BOTTOM && box.bottom > 0;
		}
	}
</script>

<svelte:head>
	{@html tokenStyle}
	<!--
		Matches the page shade under the browser chrome, so it extends the page rather than framing it.
		Follows the scroll into the light region — a dark bar over cream reads as a bug.
	-->
	<meta name="theme-color" content={onLight ? light.background.hex : dark.background.hex} />
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
	<a
		class="perch"
		class:is-shown={hidden}
		data-theme={onLight ? 'light' : undefined}
		href={home()}
		tabindex="-1"
		aria-hidden="true"
	>
		<Mark variant={mark} size="1.35rem" ink="var(--brand-foreground)" key="perch" />
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

	/*
		The mark, kept on screen while the bar is away — and it has to land exactly where the bar's own
		mark was, not near it.

		The bar centres its mark against the wordmark, which is the taller of the two, so the mark's top
		edge sits well below the bar's padding. Reproducing that by hand drifts, so this box copies the
		bar's geometry instead: the same top padding, the same gutter, and a row the height of the
		wordmark's line box with the mark centred in it.
	*/
	.perch {
		position: fixed;
		top: var(--space-3);
		left: clamp(var(--space-4), 4vw, var(--space-6));
		z-index: 11;
		display: grid;
		place-items: center;
		height: calc(1rem * 1.55);
		opacity: 0;
		transform: scale(0.55);
		transform-origin: 0 50%;
		transition:
			opacity 0.2s var(--ease),
			transform 0.26s var(--ease-spring, var(--ease));
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
		Mobile keeps the bar.

		A floating mark in the corner is a desktop affordance: on a phone it sits over content, it is
		too small to be a useful target, and it takes navigation away with it. So the bar stays put and
		slims down instead — the section strip collapses on scroll and the mark and wordmark remain,
		which keeps the nav one tap away.
	*/
	@media (max-width: 720px) {
		.bar.is-hidden {
			transform: none;
		}

		.perch {
			display: none;
		}

		.inner {
			flex-wrap: wrap;
			gap: var(--space-2) var(--space-3);
		}

		/* Brand takes the first row; the section strip drops to a second row of its own. */
		.brand {
			flex: 1 0 100%;
		}

		nav {
			flex: 1 0 100%;
			max-height: 2.5rem;
			overflow-x: auto;
			scrollbar-width: none;
			transition:
				max-height var(--dur) var(--ease),
				opacity var(--dur) var(--ease);
			-webkit-overflow-scrolling: touch;
		}

		nav::-webkit-scrollbar {
			display: none;
		}

		/* Scrolled: the strip collapses and the bar becomes just the mark and the wordmark. */
		.bar.is-hidden nav {
			max-height: 0;
			overflow: hidden;
			opacity: 0;
		}

		nav a {
			padding-inline: var(--space-2);
			white-space: nowrap;
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

	/*
		No measure here. The light region has to run edge to edge, which nothing inside a constrained
		`main` can do — so the content column is `.measure` in `app.css`, applied per band.
	*/

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
