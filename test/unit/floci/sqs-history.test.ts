import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getDbStats,
	getQueueHistory,
	getQueueStats,
	recordDeleted,
	recordReceived,
	recordSent,
	resetDb
} from '$lib/floci/sqs-history';

describe('sqs-history', () => {
	beforeEach(() => {
		resetDb();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-19T12:00:00.000Z'));
	});

	it('records sent events and truncates long body previews', () => {
		recordSent('orders', 'msg-1', 'x'.repeat(250));

		expect(getQueueHistory('orders')).toEqual([
			expect.objectContaining({
				queueName: 'orders',
				messageId: 'msg-1',
				eventType: 'sent',
				bodyPreview: 'x'.repeat(200),
				eventAtMs: Date.parse('2026-06-19T12:00:00.000Z')
			})
		]);
	});

	it('records received events with queue time when SentTimestamp is valid', () => {
		recordReceived('orders', [
			{
				messageId: 'msg-1',
				body: 'hello',
				receiptHandle: 'receipt',
				attributes: { SentTimestamp: String(Date.parse('2026-06-19T11:59:59.000Z')) }
			}
		]);

		expect(getQueueHistory('orders')).toEqual([
			expect.objectContaining({
				eventType: 'received',
				bodyPreview: 'hello',
				sentTsMs: Date.parse('2026-06-19T11:59:59.000Z'),
				queueTimeMs: 1000
			})
		]);
	});

	it('handles invalid SentTimestamp values', () => {
		recordReceived('orders', [{ messageId: 'msg-1', body: undefined, attributes: { SentTimestamp: 'nope' } }]);

		expect(getQueueHistory('orders')).toEqual([
			expect.objectContaining({ bodyPreview: null, sentTsMs: null, queueTimeMs: null })
		]);
	});

	it('records deleted events and exposes stats/info', () => {
		recordSent('orders', undefined, 'body');
		recordDeleted('orders');

		expect(getQueueStats('orders')).toEqual(
			expect.objectContaining({ totalSent: 1, totalDeleted: 1 })
		);
		expect(getDbStats()).toEqual({ path: 'memory', sizeBytes: 0, totalEvents: 2 });
	});
});
