import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			sourceMap: true,
			postcss: true,
		}),
	],
}

export default config
