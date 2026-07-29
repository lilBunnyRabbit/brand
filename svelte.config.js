import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		// `?? ''` so a local `bun run build` works with BASE_PATH unset. CI sets it from the
		// repo name, so the base path is never hardcoded anywhere.
		paths: {
			base: process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')
		},
		prerender: {
			handleMissingId: 'warn'
		}
	}
};

export default config;
