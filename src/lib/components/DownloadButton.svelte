<script lang="ts">
	import { downloadText } from '$lib/clipboard.svelte';

	let {
		filename,
		/**
		 * When given, renders a real <a download>. That works with JavaScript off, and right-click
		 * → Save As gets the correct filename instead of Vite's content hash.
		 */
		href,
		/** Fallback for generated content that has no file on disk. */
		content,
		type = 'image/svg+xml',
		label = 'Download',
		variant = 'ghost'
	}: {
		filename: string;
		href?: string;
		content?: string | (() => string);
		type?: string;
		label?: string;
		variant?: 'ghost' | 'solid';
	} = $props();

	function save() {
		const text = typeof content === 'function' ? content() : (content ?? '');
		downloadText(filename, text, type);
	}
</script>

{#if href}
	<a class="download {variant}" {href} download={filename}>{label}</a>
{:else}
	<button type="button" class="download {variant}" onclick={save}>{label}</button>
{/if}

<style>
	.download {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 5.5rem;
		padding: 0.55rem 0.95rem;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--page-fg);
		text-decoration: none;
		cursor: pointer;
		background: transparent;
		border: 1px solid var(--page-border);
		border-radius: 999px;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease);
	}

	.download:hover {
		border-color: var(--page-fg);
	}

	.solid {
		color: var(--page-bg);
		background: var(--page-fg);
		border-color: var(--page-fg);
	}

	.solid:hover {
		background: var(--brand-background-lighter);
		border-color: var(--brand-background-lighter);
	}
</style>
