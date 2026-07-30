/**
 * Where the mark currently lives, so exactly ONE of it is ever in the DOM.
 *
 * That single-instance rule is what makes a view transition possible: give the hero mark, the header
 * mark and the corner mark the same `view-transition-name`, render only one at a time, and the
 * browser morphs position, size and colour between them when the slot changes. Two live copies with
 * the same name is an error, and nothing animates.
 *
 * Three slots:
 *   hero    the big one, in primary, while it is still on screen
 *   header  small, in foreground, beside the wordmark
 *   perch   small, in foreground, top-left corner while the bar is hidden
 */
import { flushSync } from 'svelte';

export type MarkSlot = 'hero' | 'header' | 'perch';

let heroOnScreen = $state(true);
let barHidden = $state(false);

/** The slot the mark belongs in, given where we are. */
const resolve = (): MarkSlot => (heroOnScreen ? 'hero' : barHidden ? 'perch' : 'header');

let slot = $state<MarkSlot>('hero');

/**
 * Move the mark, through a view transition where the browser supports one.
 *
 * `startViewTransition` takes a callback that mutates the DOM; Svelte applies our state change
 * during it, and the browser tweens the old and new positions of anything sharing a
 * `view-transition-name`. Where it is unsupported the state simply changes and the mark cuts —
 * correct, just without the flight.
 */
function moveTo(next: MarkSlot) {
	if (next === slot) return;

	const doc = document as Document & {
		startViewTransition?: (cb: () => void) => { finished: Promise<void> };
	};

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (!doc.startViewTransition || reduced) {
		slot = next;
		return;
	}

	doc.startViewTransition(() => {
		// Must leave the DOM updated before returning. Svelte batches by default, so flush it.
		flushSync(() => {
			slot = next;
		});
	});
}

export const markSlot = {
	get current() {
		return slot;
	},
	/** Called by the hero as it enters and leaves the viewport. */
	setHeroOnScreen(value: boolean) {
		heroOnScreen = value;
		moveTo(resolve());
	},
	/** Called by the layout as the bar hides and shows. */
	setBarHidden(value: boolean) {
		barHidden = value;
		moveTo(resolve());
	}
};
