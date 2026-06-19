import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { handleFlociProxy } from './src/lib/server/floci-proxy';

export default defineConfig({
	plugins: [tailwindcss(), flociDevCorsProxy(), sveltekit()]
});

function flociDevCorsProxy(): Plugin {
	return {
		name: 'floci-dev-cors-proxy',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				void handleFlociProxy(req, res, next);
			});
		}
	};
}
