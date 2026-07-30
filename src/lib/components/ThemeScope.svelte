<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ThemeName } from '$lib/brand/config/palette';
	import { setThemeContext } from '$lib/brand/theme';

	/**
	 * A region rendering in one palette.
	 *
	 * Sets the attribute CSS reads and the context JavaScript reads, in one place, so the two cannot
	 * disagree — a subtree painted light while its ratio readouts still report dark numbers would look
	 * entirely fine and be wrong.
	 *
	 * No layout opinion beyond being a block: the ground comes from the `[data-theme='light']` rule in
	 * `app.css`, and callers put a `.measure` wrapper inside for the content width. That is what lets
	 * the light region run full-bleed while its text stays on the same column as everything above it.
	 */
	let {
		theme,
		/**
		 * Optional anchor. The page's light region sets one so the sticky chrome can find it by id
		 * rather than by `[data-theme="light"]` — a selector that would pick up the first light island
		 * anyone nests anywhere above it.
		 */
		id,
		children
	}: { theme: ThemeName; id?: string; children: Snippet } = $props();

	setThemeContext(() => theme);
</script>

<div {id} data-theme={theme}>{@render children()}</div>
