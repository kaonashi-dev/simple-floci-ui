import type { QueueStats, StoreInfo, StorageEvent, StorageService } from './types';

export const MAX_EVENTS = 2000;

export type Persisted = { events: StorageEvent[]; seq: number };

/**
 * In-memory implementation of the storage contract. Used directly on the server
 * (for not-yet-migrated routes) and as the base for the browser-backed store.
 */
export class MemoryStore implements StorageService {
	protected store: Persisted = { events: [], seq: 0 };

	/** Persist hook — no-op for pure in-memory; overridden by subclasses. */
	protected persist(): void {}

	insertEvent(event: Omit<StorageEvent, 'id'>): void {
		this.store.seq += 1;
		this.store.events.push({ id: this.store.seq, ...event });
		if (this.store.events.length > MAX_EVENTS) {
			this.store.events = this.store.events.slice(-MAX_EVENTS);
		}
		this.persist();
	}

	queryEvents(queueName: string, limit: number): StorageEvent[] {
		return this.store.events
			.filter((e) => e.queueName === queueName)
			.sort((a, b) => b.eventAtMs - a.eventAtMs)
			.slice(0, limit);
	}

	statsForQueue(queueName: string): QueueStats {
		const events = this.store.events.filter((e) => e.queueName === queueName);
		const qtimes = events.map((e) => e.queueTimeMs).filter((q): q is number => q !== null);
		const sum = qtimes.reduce((a, b) => a + b, 0);
		return {
			totalSent: events.filter((e) => e.eventType === 'sent').length,
			totalReceived: events.filter((e) => e.eventType === 'received').length,
			totalDeleted: events.filter((e) => e.eventType === 'deleted').length,
			avgQueueTimeMs: qtimes.length ? sum / qtimes.length : null,
			minQueueTimeMs: qtimes.length ? Math.min(...qtimes) : null,
			maxQueueTimeMs: qtimes.length ? Math.max(...qtimes) : null
		};
	}

	reset(): void {
		this.store = { events: [], seq: 0 };
		this.persist();
	}

	info(): StoreInfo {
		return { path: 'memory', sizeBytes: 0, totalEvents: this.store.events.length };
	}
}
