import { describe, expect, it } from 'vitest';
import { safeLoad } from '$lib/floci/load';

describe('safeLoad', () => {
	it('returns data and a null error when the loader succeeds', async () => {
		await expect(safeLoad(async () => ['ok'], [])).resolves.toEqual({ data: ['ok'], error: null });
	});

	it('returns fallback data and a string error when the loader fails', async () => {
		await expect(
			safeLoad(async () => {
				throw new Error('runtime unavailable');
			}, ['fallback'])
		).resolves.toEqual({ data: ['fallback'], error: 'Error: runtime unavailable' });
	});
});
