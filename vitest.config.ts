import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'node',
		include: ['test/**/*.test.ts'],
		setupFiles: ['./test/setup.ts'],
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: [
				'src/lib/floci/**/*.ts',
				'src/lib/proxy-shared.ts',
				'src/lib/server/**/*.ts',
				'src/lib/utils/**/*.ts'
			],
			exclude: [
				'**/*.d.ts',
				'src/lib/types/**',
				'src/lib/floci/storage/types.ts',
				'src/lib/components/**',
				'src/routes/**/*.svelte'
			],
			thresholds: {
				statements: 90,
				functions: 90,
				branches: 60,
				lines: 90
			}
		}
	}
});
