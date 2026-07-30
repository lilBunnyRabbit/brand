/** Where the mark comes from. EDIT HERE. */
export interface Step {
	n: string;
	title: string;
	body: string;
}

export const logoStory = {
	rule: 'Design from the nose first. The ears are only ever a hint.',
	steps: [
		{ n: '1', title: 'Rabbit nose', body: 'The Y of the philtrum.' },
		{ n: '2', title: 'Reduce', body: 'Down to a bare Y.' },
		{ n: '3', title: 'Mirror', body: 'Two halves, thickened.' },
		{ n: '4', title: 'Curl', body: 'A lower curl for the whisker pad.' },
		{ n: '5', title: 'Abstract', body: 'Ears only hinted at.' }
	] satisfies Step[]
};
