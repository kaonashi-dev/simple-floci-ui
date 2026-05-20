import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const DB_PATH = process.env.FLOCI_DB_PATH ?? join(process.cwd(), 'floci.json');

export type DbEvent = {
	id: number;
	queueName: string;
	messageId: string | null;
	eventType: 'sent' | 'received' | 'deleted';
	bodyPreview: string | null;
	sentTsMs: number | null;
	eventAtMs: number;
	queueTimeMs: number | null;
};

type Store = { events: DbEvent[]; seq: number };

let store: Store = { events: [], seq: 0 };
try {
	if (existsSync(DB_PATH)) {
		store = JSON.parse(readFileSync(DB_PATH, 'utf8'));
	}
} catch {
	/* start fresh if file is corrupt */
}

function persist(): void {
	writeFileSync(DB_PATH, JSON.stringify(store));
}

export function insertEvent(event: Omit<DbEvent, 'id'>): void {
	store.seq += 1;
	store.events.push({ id: store.seq, ...event });
	persist();
}

export function queryEvents(queueName: string, limit: number): DbEvent[] {
	return store.events
		.filter((e) => e.queueName === queueName)
		.sort((a, b) => b.eventAtMs - a.eventAtMs)
		.slice(0, limit);
}

export function statsForQueue(queueName: string) {
	const events = store.events.filter((e) => e.queueName === queueName);
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

export function resetStore(): void {
	store = { events: [], seq: 0 };
	persist();
}

export function storeInfo(): { path: string; sizeBytes: number; totalEvents: number } {
	let sizeBytes = 0;
	try {
		sizeBytes = statSync(DB_PATH).size;
	} catch {
		/* file might not exist on very first load */
	}
	return { path: DB_PATH, sizeBytes, totalEvents: store.events.length };
}
