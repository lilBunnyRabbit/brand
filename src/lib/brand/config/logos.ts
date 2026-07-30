/**
 * Per-file logo metadata. EDIT HERE.
 *
 * This is an OVERRIDE layer, not a registry. Every `.svg` in `../logos/` appears on the site
 * whether or not it is listed below — a missing entry just means the label and rules come from
 * the filename and the defaults in `../logo-meta.ts`.
 *
 * Keys are filenames including the extension. A key that matches no file raises a warning rather
 * than an error, so renaming a file never breaks the build.
 */
import type { LogoOverride } from '../types';

export const logoOverrides: Record<string, LogoOverride> = {
	'lilbunnyrabbit.mark.v6.wip.svg': {
		label: 'Mark',
		description:
			'Two mirrored strokes. Single-colour, so its ink follows whatever it sits in. No light ' +
			'and dark version to keep in sync.',
		tone: 'mono',
		status: 'wip',
		order: -1
	}
};
