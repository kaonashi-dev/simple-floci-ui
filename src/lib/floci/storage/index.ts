import { browser } from '$app/environment';
import { MemoryStore } from './memory';
import { LocalStorageStore } from './local-storage';
import type { StorageService } from './types';

export type { StorageEvent, StorageEventType, QueueStats, StoreInfo, StorageService } from './types';

// Per-dev history lives in the browser (localStorage); the server falls back to
// an ephemeral in-memory store (used only by not-yet-migrated server routes).
export const storage: StorageService = browser ? new LocalStorageStore() : new MemoryStore();
