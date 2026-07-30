/**
 * Which palette a subtree is rendering in.
 *
 * CSS does not need this — `[data-theme]` already swaps every `--brand-*` for anything inside the
 * scope. This exists for the components that read palette values in JAVASCRIPT: a swatch card
 * printing a hex, a table measuring a contrast ratio, `labelFor` picking an ink. Those cannot see a
 * CSS attribute, so the scope has to tell them.
 *
 * There is no state and no store. The theme is a position in the document, not a mode the user
 * toggles, so a plain context value set once at init is the whole mechanism. `ThemeScope` is the only
 * thing that should call the setter — it writes the attribute and the context together, which is what
 * makes it impossible to get one without the other.
 */
import { getContext, setContext } from 'svelte';
import { themes, type Palette, type ThemeName } from './config/palette';

const KEY = Symbol('brand-theme');

/**
 * Declare the mode for everything below. Call during component init only.
 *
 * Takes a getter rather than a value. Today the mode is fixed per scope so a plain value would do,
 * but a value read at init is a snapshot — if a scope ever became reactive, every consumer below it
 * would silently keep the first mode it saw. The getter costs nothing and makes that impossible.
 */
export function setThemeContext(get: () => ThemeName): void {
	setContext(KEY, get);
}

/** The enclosing mode. Defaults to dark, which is the document's own mode. */
export function useTheme(): ThemeName {
	return getContext<(() => ThemeName) | undefined>(KEY)?.() ?? 'dark';
}

/** The enclosing mode's palette. */
export function usePalette(): Palette {
	return themes[useTheme()];
}
