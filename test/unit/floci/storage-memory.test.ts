import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_EVENTS, MemoryStore } from '$lib/floci/storage/memory';
import type { StorageEvent } from '$lib/floci/storage/types';

function event(overrides: Partial<Omit<StorageEvent, 'id'>> = {}): Omit<StorageEvent, 'id'> {
	return {
		queueName: 'orders',
		messageId: 'msg-1',
		eventType: 'sent',
		bodyPreview: 'body',
		sentTsMs: null,
		eventAtMs: 1,
		queueTimeMs: null,
		...overrides
	};
}

describe('MemoryStore', () => {
	let store: MemoryStore;

	beforeEach(() => {
		store = new MemoryStore();
	});

	it('inserts events with increasing IDs and queries newest first', () => {
		store.insertEvent(event({ eventAtMs: 100 }));
		store.insertEvent(event({ messageId: 'msg-2', eventAtMs: 200 }));
		store.insertEvent(event({ queueName: 'other', eventAtMs: 300 }));

		expect(store.queryEvents('orders', 10)).toEqual([
			expect.objectContaining({ id: 2, messageId: 'msg-2' }),
			expect.objectContaining({ id: 1, messageId: 'msg-1' })
		]);
		expect(store.queryEvents('orders', 1)).toHaveLength(1);
	});

	it('caps stored events at MAX_EVENTS', () => {
		for (let i = 0; i < MAX_EVENTS + 5; i += 1) {
			store.insertEvent(event({ messageId: `msg-${i}`, eventAtMs: i }));
		}

		expect(store.info().totalEvents).toBe(MAX_EVENTS);
		expect(store.queryEvents('orders', MAX_EVENTS).at(-1)).toEqual(
			expect.objectContaining({ messageId: 'msg-5' })
		);
	});

	it('computes queue stats', () => {
		store.insertEvent(event({ eventType: 'sent' }));
		store.insertEvent(event({ eventType: 'received', queueTimeMs: 10 }));
		store.insertEvent(event({ eventType: 'received', queueTimeMs: 30 }));
		store.insertEvent(event({ eventType: 'deleted' }));
		store.insertEvent(event({ queueName: 'other', eventType: 'sent', queueTimeMs: 1000 }));

		expect(store.statsForQueue('orders')).toEqual({
			totalSent: 1,
			totalReceived: 2,
			totalDeleted: 1,
			avgQueueTimeMs: 20,
			minQueueTimeMs: 10,
			maxQueueTimeMs: 30
		});
	});

	it('resets the store', () => {
		store.insertEvent(event());
		store.reset();

		expect(store.info()).toEqual({ path: 'memory', sizeBytes: 0, totalEvents: 0 });
		expect(store.queryEvents('orders', 10)).toEqual([]);
	});
});
