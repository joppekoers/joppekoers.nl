import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { type UserConfig } from 'vite'

const backend = `http://127.0.0.1:${process.env.BACKEND_PORT || 8080}`

const config: UserConfig = {
	plugins: [tailwindcss(), svelte()],
	publicDir: 'static',
	resolve: {
		alias: {
			$root: fileURLToPath(new URL('./src', import.meta.url)),
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			'@shared': fileURLToPath(new URL('../shared', import.meta.url)),
		},
	},
	server: {
		port: Number(process.env.PORT) || 5173,
		host: true,
		proxy: {
			'/projects': backend,
			'/media': backend,
			'/cv': backend,
			'^/drop/.+': backend,
			'/.well-known': backend,
		},
	},
}

export default config
