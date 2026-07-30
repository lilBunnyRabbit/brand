<script lang="ts">
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import { home } from '$lib/brand/nav';
</script>

<svelte:head>
	<title>{page.status} · brand assets</title>
</svelte:head>

<!-- `measure` because `main` no longer constrains width — the light region needs to run full-bleed. -->
<div class="measure wrap">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'That page does not exist.'}</p>
	<p><a href={home()}>Back to the brand guide</a></p>
</div>

<!-- This page ends dark. The guide ends inside its light region, which is why the footer is per-page. -->
<Footer />

<style>
	.wrap {
		padding-block: clamp(4rem, 12vw, 9rem);
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(3rem, 10vw, 6rem);
		font-weight: 800;
		line-height: 0.9;
		letter-spacing: -0.04em;
	}

	p {
		margin: 0 0 1rem;
		color: var(--fg-muted);
	}
</style>
