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
	tagline: 'Take what you need.',
	description:
		'The mark, the colours, and a handful of rules. Everything on this page can be copied or ' +
		'downloaded — help yourself.',
	links: [
		{ label: 'GitHub', href: 'https://github.com/lilBunnyRabbit' },
		{ label: 'Repo', href: 'https://github.com/lilBunnyRabbit/brand' }
	],
	assetsUrl: 'https://github.com/lilBunnyRabbit/brand/tree/master/src/lib/brand/logos'
};
