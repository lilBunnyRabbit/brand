<script lang="ts">
	import { copyText } from '$lib/clipboard.svelte';

	let {
		// A thunk is accepted so a multi-kilobyte SVG source is not materialised on every render of
		// a page carrying dozens of these.
		value,
		label = 'Copy',
		copiedLabel = 'Copied',
		/** What the screen reader hears; the visible label is only ever "Copy". */
		describe,
		variant = 'ghost',
		onCopy
	}: {
		value: string | (() => string);
		label?: string;
		copiedLabel?: string;
		describe?: string;
		variant?: 'ghost' | 'solid' | 'quiet';
		onCopy?: (value: string) => void;
	} = $props();

	let state = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout>;

	async function copy() {
		const text = typeof value === 'function' ? value() : value;
		const ok = await copyText(text, describe ?? label);
		state = ok ? 'copied' : 'failed';
		if (ok) onCopy?.(text);
		clearTimeout(timer);
		timer = setTimeout(() => (state = 'idle'), 1600);
	}
</script>

<button
	type="button"
	class="copy {variant}"
	class:is-copied={state === 'copied'}
	class:is-failed={state === 'failed'}
	aria-label={describe ? `Copy ${describe}` : label}
	onclick={copy}
>
	{state === 'copied' ? copiedLabel : state === 'failed' ? 'Failed' : label}
</button>

<style>
	.copy {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 5.5rem;
		padding: 0.55rem 0.95rem;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--page-fg);
		cursor: pointer;
		background: transparent;
		border: 1px solid var(--page-border);
		border-radius: 999px;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}

	.copy:hover {
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

	.quiet {
		min-width: 0;
		padding: 0.3rem 0.6rem;
		font-size: 0.75rem;
		border-color: transparent;
	}

	.quiet:hover {
		border-color: var(--page-border);
	}

	/* State is carried by text as well as colour, so it does not rely on hue alone. */
	.is-copied {
		color: var(--page-bg);
		background: var(--brand-success);
		border-color: var(--brand-success);
	}

	.is-failed {
		color: var(--page-bg);
		background: var(--brand-error);
		border-color: var(--brand-error);
	}
</style>
