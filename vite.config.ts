import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// Keep logo SVGs as real files. A data: URI in a `download` attribute is
		// browser-dependent and can't be hotlinked.
		assetsInlineLimit: 0
	}
});
