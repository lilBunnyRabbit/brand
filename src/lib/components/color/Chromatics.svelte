<script lang="ts">
	import { chromatics } from '$lib/brand/config/chromatics';

	/*
		The scheme, live, in a frame.

		Everything the embed needs is in `chromatics.url` — the scheme itself rides in the hash — so
		this component is one iframe and one listener. The listener is the whole reason it is a
		component rather than a bare tag in the page: Chromatics posts its content height as it
		renders and again on every tab switch, and a frame at a fixed height would either clip the
		design system or leave a screen of dead space under the source.

		The frame is NOT sandboxed. It is the same origin as this site (a sibling GitHub Pages
		project), it stores its own view state, and `sandbox` without `allow-scripts` would render a
		blank panel — the attribute would be theatre, not a boundary.
	*/

	/*
		Three checks before a message moves the layout, because `window` hears every frame on the page
		and anything that can reach this tab:
		  - the origin is Chromatics', so a message from elsewhere is ignored outright
		  - the source IS this iframe, so a second embed cannot resize this one
		  - the number is finite and clamped, so a bug at the other end cannot hand us a 90,000px page
	*/
	const MIN = 320;
	const MAX = 4000;

	let frame: HTMLIFrameElement | undefined = $state();
	let height = $state(chromatics.height);

	function onMessage(event: MessageEvent) {
		if (event.origin !== chromatics.origin) return;
		if (!frame || event.source !== frame.contentWindow) return;

		const data = event.data as { type?: unknown; height?: unknown } | null;
		if (!data || data.type !== 'chromatics:height') return;
		if (typeof data.height !== 'number' || !Number.isFinite(data.height)) return;

		height = Math.min(MAX, Math.max(MIN, Math.round(data.height)));
	}
</script>

<svelte:window onmessage={onMessage} />

<!--
	`loading="lazy"` because this sits at the foot of a long page and boots a second application;
	`height` is set inline rather than in the stylesheet since it is state, and the frame holds the
	fallback height until it says otherwise — including when JavaScript never runs.
-->
<iframe
	bind:this={frame}
	src={chromatics.url}
	title={chromatics.title}
	loading="lazy"
	style="height: {height}px"
></iframe>

<!--
	Not only a nicety: a frame is a viewport, and the guide should not be the only way in. This is
	also the fallback if the embed is blocked, and the way to fork the scheme — the frame itself is
	locked.
-->
<p class="out">
	<a href={chromatics.url}>Open the scheme in Chromatics</a>
</p>

<style>
	iframe {
		display: block;
		width: 100%;
		background: var(--surface-raised);
		border: 1px solid var(--hairline);
		border-radius: var(--radius-lg);
		/* The frame reports a new height on every tab switch; without this the page jumps. */
		transition: height var(--dur) var(--ease);
	}

	.out {
		margin: var(--stack-sm) 0 0;
		font-size: var(--text-sm);
		color: var(--fg-muted);
	}

	.out a {
		font-weight: 600;
		color: var(--brand-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
