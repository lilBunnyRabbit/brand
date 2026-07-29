/** Where the mark comes from, and what it must not look like. EDIT HERE. */
export interface Step {
	n: string;
	title: string;
	body: string;
}

export interface Misread {
	reads_as: string;
	fix: string;
}

export const logoStory = {
	idea:
		'It is a rabbit nose, not a rabbit head. The Y of the philtrum is the whole logic — reduce it, ' +
		'mirror it, thicken it into an inner curve, then let a lower curl suggest the mouth and ' +
		'whisker pad. The ears are only a hint at the top.',
	rule: 'Always design from the nose first. Ears are a hint, not the hero.',
	steps: [
		{ n: '1', title: 'Rabbit nose', body: 'The Y-shape and philtrum are the source.' },
		{ n: '2', title: 'Reduce', body: 'Down to a bare Y — the negative space does the work.' },
		{ n: '3', title: 'Mirror', body: 'Two halves, thickened into an inner curve.' },
		{ n: '4', title: 'Curl', body: 'A lower curl carries the mouth and whisker pad.' },
		{ n: '5', title: 'Abstract', body: 'A mark that keeps the nose logic and only hints at ears.' }
	] satisfies Step[],
	misreads: [
		{ reads_as: 'Dog nose', fix: 'Keep the inner curve higher and more vertical.' },
		{ reads_as: 'Leaves', fix: 'Maintain inner-curve depth and the lower curl.' },
		{ reads_as: 'Elephant', fix: 'Keep the centre split narrow; avoid a trunk feel.' },
		{ reads_as: 'Flaring nostrils', fix: 'No outward flare — curves stay inward and controlled.' },
		{ reads_as: 'Mask', fix: 'Soften the angles; avoid aggressive downturns.' },
		{ reads_as: 'Earbuds', fix: 'Keep the lower curl open, never a closed loop.' },
		{ reads_as: 'Butterfly', fix: 'Top mass stays larger and heavier than the bottom.' }
	] satisfies Misread[]
};
