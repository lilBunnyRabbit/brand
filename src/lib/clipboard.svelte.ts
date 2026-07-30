/**
 * Clipboard + a single screen-reader announcement channel.
 *
 * One shared live region rather than one per button: this page carries a copy button on every
 * swatch and every asset, and dozens of `aria-live` regions is a documented screen-reader failure
 * mode — they compete and drop messages.
 */
let message = $state('');
let token = $state(0);

export const announcer = {
	get message() {
		return message;
	},
	/** Re-announce even when the text is identical, by bumping a key the region is keyed on. */
	get token() {
		return token;
	}
};

export function announce(text: string): void {
	message = text;
	token += 1;
}

/**
 * Copy text, returning whether it worked.
 *
 * The clipboard API rejects on a non-secure origin and when the document is not focused, so the
 * failure path is real and the caller must be able to show it rather than claim success.
 */
export async function copyText(value: string, describe?: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(value);
		if (describe) announce(`Copied ${describe}`);
		return true;
	} catch {
		announce('Copy failed. Select the value and copy manually');
		return false;
	}
}

/** Trigger a download of in-memory text as a file. */
export function downloadText(filename: string, value: string, type = 'text/plain'): void {
	const url = URL.createObjectURL(new Blob([value], { type: `${type};charset=utf-8` }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	// Revoking synchronously can cancel the download in some browsers; defer past the click.
	setTimeout(() => URL.revokeObjectURL(url), 0);
	announce(`Downloaded ${filename}`);
}
