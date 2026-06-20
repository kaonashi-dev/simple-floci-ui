import { beforeEach, describe, expect, it, vi } from 'vitest';

const floci = vi.hoisted(() => ({ checkConnections: vi.fn() }));

vi.mock('$lib/floci/floci', () => floci);

describe('layout load', () => {
	beforeEach(() => {
		floci.checkConnections.mockReset().mockResolvedValue({ aws: { ok: true } });
	});

	it('returns connection status', async () => {
		const { load, ssr, prerender } = await import('../../../src/routes/+layout');

		expect(ssr).toBe(false);
		expect(prerender).toBe(false);
		await expect(load()).resolves.toEqual({ connection: { aws: { ok: true } } });
	});
});
