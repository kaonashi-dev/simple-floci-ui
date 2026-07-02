import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// The whole app renders in the browser (ssr = false), so we ship a pure
		// static SPA: a fallback shell + hashed client assets, hostable anywhere.
		adapter: adapter({ fallback: 'index.html' }),
		alias: {
			'$lib': 'src/lib',
			'$lib/*': 'src/lib/*'
		},
		// Baseline CSP (emitted as a <meta> in the static shell). `script-src 'self'`
		// with hash mode — SvelteKit hashes its own bootstrap; every other script is an
		// external self asset — blocks inline script, which is what a malicious `blob:`
		// object-preview navigation would rely on to run in our origin (see
		// utils/objectPreview.ts). connect-src/img-src etc. are deliberately left
		// unrestricted: the app is browser-direct and must reach the developer's own,
		// arbitrary Floci/cloud endpoints.
		csp: {
			mode: 'hash',
			directives: {
				'script-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self']
			}
		}
	}
};

export default config;
