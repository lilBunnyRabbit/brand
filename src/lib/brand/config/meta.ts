/**
 * Who this guide is for and what it says. EDIT HERE.
 *
 * All page copy comes from this file so the brand can be renamed in one place.
 */
export interface BrandLink {
	label: string;
	href: string;
}

export interface BrandMeta {
	name: string;
	/** One line under the title. */
	tagline: string;
	/** Meta description and OG description. */
	description: string;
	links: BrandLink[];
	/** Repo folder holding the source SVGs, linked as the no-JS download fallback. */
	assetsUrl: string;
}

export const meta: BrandMeta = {
	name: 'lilBunnyRabbit',
	tagline: 'The mark and the palette.',
	description:
		'Brand assets for lilBunnyRabbit — logo variants and the colour palette, with everything ' +
		'available to copy or download.',
	links: [
		{ label: 'GitHub', href: 'https://github.com/lilBunnyRabbit' },
		{ label: 'Repo', href: 'https://github.com/lilBunnyRabbit/brand' }
	],
	assetsUrl: 'https://github.com/lilBunnyRabbit/brand/tree/master/src/lib/brand/logos'
};
