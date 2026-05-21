import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type { QueueStats, StoreInfo, StorageEvent, StorageService } from './types';

type Persisted = { events: StorageEvent[]; seq: number };

export class JsonFileStore implements StorageService {
	private store: Persisted = { events: [], seq: 0 };

	constructor(readonly path: string) {
		try {
			if (existsSync(path)) {
				this.store = JSON.parse(readFileSync(path, 'utf8'));
			}
		} catch {
			/* start fresh if file is corrupt */
		}
	}

	private persist(): void {
		writeFileSync(this.path, JSON.stringify(this.store));
	}

	insertEvent(event: Omit<StorageEvent, 'id'>): void {
		this.store.seq += 1;
		this.store.events.push({ id: this.store.seq, ...event });
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
		let sizeBytes = 0;
		try {
			sizeBytes = statSync(this.path).size;
		} catch {
			/* file may not exist yet on first call */
		}
		return { path: this.path, sizeBytes, totalEvents: this.store.events.length };
	}
}
