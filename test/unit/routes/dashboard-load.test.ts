import { beforeEach, describe, expect, it, vi } from 'vitest';

const registry = vi.hoisted(() => ({
	SERVICES: [
		{ id: 'ok', list: vi.fn() },
		{ id: 'bad', list: vi.fn() }
	]
}));

vi.mock('$lib/floci/registry', () => registry);

describe('dashboard load', () => {
	beforeEach(() => {
		registry.SERVICES[0].list.mockReset().mockResolvedValue([1, 2]);
		registry.SERVICES[1].list.mockReset().mockRejectedValue(new Error('down'));
	});

	it('aggregates counts and per-service errors', async () => {
		const { load } = await import('../../../src/routes/+page');

		await expect(load()).resolves.toEqual({
			counts: {
				ok: { count: 2, error: null },
				bad: { count: null, error: 'Error: down' }
			}
		});
	});
});
