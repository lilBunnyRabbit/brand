<script lang="ts">
	import { announcer } from '$lib/clipboard.svelte';
</script>

<!--
	The single live region for the whole page. Keyed on a token so an identical message announces
	again — copying the same hex twice should say so both times.
-->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
	{#key announcer.token}
		{announcer.message}
	{/key}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
