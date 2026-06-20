import { beforeEach, describe, expect, it, vi } from 'vitest';

const sqs = vi.hoisted(() => ({ getQueueUrl: vi.fn(), getQueueAttributes: vi.fn() }));

vi.mock('$lib/floci/sqs', () => sqs);

describe('SQS queue load', () => {
	beforeEach(() => {
		sqs.getQueueUrl.mockReset().mockResolvedValue('queue-url');
		sqs.getQueueAttributes.mockReset().mockResolvedValue({ CreatedTimestamp: '1' });
	});

	it('loads decoded queue details and FIFO state', async () => {
		const { load } = await import('../../../src/routes/aws/sqs/[queue]/+page');

		await expect(load({ params: { queue: encodeURIComponent('orders.fifo') } } as never)).resolves.toEqual({
			name: 'orders.fifo',
			url: 'queue-url',
			attributes: { CreatedTimestamp: '1' },
			isFifo: true,
			error: null
		});
	});

	it('returns fallback data when the service fails', async () => {
		sqs.getQueueUrl.mockRejectedValue(new Error('down'));
		const { load } = await import('../../../src/routes/aws/sqs/[queue]/+page');

		await expect(load({ params: { queue: 'orders' } } as never)).resolves.toEqual({
			name: 'orders',
			url: null,
			attributes: {},
			isFifo: false,
			error: 'Error: down'
		});
	});
});
