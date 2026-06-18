import type { StoreInfo } from './types';
import { MemoryStore, MAX_EVENTS } from './memory';

/**
 * Per-dev, browser-local history store backed by `localStorage`. Mirrors the
 * synchronous semantics of the old JSON-file store (load on construct, persist
 * on mutation) so the rest of the app stays unchanged. Nothing is shared with
 * the hosted server.
 */
export class LocalStorageStore extends MemoryStore {
	constructor(private readonly key: string = 'floci-events') {
		super();
		try {
			const raw = localStorage.getItem(this.key);
			if (raw) this.store = JSON.parse(raw);
		} catch {
			/* start fresh on corrupt data */
		}
	}

	protected persist(): void {
		try {
			localStorage.setItem(this.key, JSON.stringify(this.store));
		} catch {
			// Quota exceeded — drop the oldest half and retry once.
			this.store.events = this.store.events.slice(-Math.floor(MAX_EVENTS / 2));
			try {
				localStorage.setItem(this.key, JSON.stringify(this.store));
			} catch {
				/* give up silently */
			}
		}
	}

	info(): StoreInfo {
		let raw = '';
		try {
			raw = localStorage.getItem(this.key) ?? '';
		} catch {
			/* ignore */
		}
		return {
			path: `localStorage:${this.key}`,
			sizeBytes: new Blob([raw]).size,
			totalEvents: this.store.events.length
		};
	}
}
