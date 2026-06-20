// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageStore } from '$lib/floci/storage/local-storage';
import type { StorageEvent } from '$lib/floci/storage/types';

class SeededLocalStorageStore extends LocalStorageStore {
	seed(events: StorageEvent[], seq: number): void {
		this.store = { events, seq };
	}
}

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

describe('LocalStorageStore', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('loads persisted events and persists mutations', () => {
		localStorage.setItem(
			'events',
			JSON.stringify({ events: [{ id: 7, ...event({ messageId: 'persisted' }) }], seq: 7 })
		);

		const store = new LocalStorageStore('events');
		store.insertEvent(event({ messageId: 'new', eventAtMs: 2 }));

		expect(store.queryEvents('orders', 10).map((e) => e.messageId)).toEqual(['new', 'persisted']);
		expect(JSON.parse(localStorage.getItem('events') ?? '{}')).toEqual(
			expect.objectContaining({ seq: 8 })
		);
	});

	it('starts fresh when persisted data is corrupt', () => {
		localStorage.setItem('events', '{not-json');

		const store = new LocalStorageStore('events');

		expect(store.info().totalEvents).toBe(0);
	});

	it('drops the oldest half and retries once when persistence exceeds quota', () => {
		const realSetItem = localStorage.setItem.bind(localStorage);
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		setItem.mockImplementationOnce(() => {
			throw new Error('quota');
		});
		setItem.mockImplementation(realSetItem);

		const store = new SeededLocalStorageStore('events');
		store.seed(
			Array.from({ length: 1200 }, (_, i) => ({ id: i + 1, ...event({ messageId: `msg-${i}` }) })),
			1200
		);
		store.insertEvent(event({ messageId: 'after-quota' }));

		expect(store.info().totalEvents).toBe(1000);
		expect(JSON.parse(localStorage.getItem('events') ?? '{}').events.length).toBe(store.info().totalEvents);
	});
});
