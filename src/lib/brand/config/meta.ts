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
	/**
	 * Where the site is published, with no trailing slash.
	 *
	 * Needed because `og:image` and `og:url` must be ABSOLUTE. A scraper is not a browser: it does not
	 * resolve a relative path against the page it fetched, so `base`-prefixed URLs from `$app/paths`
	 * are not enough on their own.
	 */
	siteUrl: string;
}

export const meta: BrandMeta = {
	name: 'lilBunnyRabbit',
	tagline: 'Take what you need.',
	description: 'The mark, the colours and the rules. Copy or download anything here.',
	links: [
		{ label: 'GitHub', href: 'https://github.com/lilBunnyRabbit' },
		{ label: 'Repo', href: 'https://github.com/lilBunnyRabbit/brand' }
	],
	assetsUrl: 'https://github.com/lilBunnyRabbit/brand/tree/master/src/lib/brand/logos',
	siteUrl: 'https://lilbunnyrabbit.github.io/brand'
};
