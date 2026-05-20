import { join } from 'node:path';
import { JsonFileStore } from './json-file';
import type { StorageService } from './types';

export type { StorageEvent, StorageEventType, QueueStats, StoreInfo, StorageService } from './types';

const storagePath = process.env.FLOCI_DB_PATH ?? join(process.cwd(), 'floci.json');

// Swap this line to change the backend (e.g. new SqliteStore(storagePath))
export const storage: StorageService = new JsonFileStore(storagePath);
