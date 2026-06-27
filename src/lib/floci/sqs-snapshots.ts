import { browser } from '$app/environment';
import type { SqsDepthSnapshot } from '$lib/types/sqs';

/**
 * Per-browser persistence for polled SQS depth snapshots. Each queue gets its
 * own `localStorage` key so the metrics page can show the full history it has
 * collected so far — surviving reloads and navigation — and so every developer
 * accumulates their own series against their own runtime. Nothing is shared
 * with the hosted server.
 *
 * Because SQS only exposes approximate depth *levels* (not flow counters),
 * these snapshots are the raw material the metrics page derives throughput and
 * time-in-queue estimates from.
 */

const KEY_PREFIX = 'floci-sqs-snapshots:';
export const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // keep 24h
export const SNAPSHOT_MAX_COUNT = 6000; // hard cap per queue (~8h at 5s)

function keyFor(queueName: string): string {
	return KEY_PREFIX + queueName;
}

/** Drop snapshots older than `maxAgeMs` and cap the total. Pure + testable. */
export function pruneSnapshots(
	snaps: SqsDepthSnapshot[],
	nowMs: number,
	maxAgeMs = SNAPSHOT_MAX_AGE_MS,
	maxCount = SNAPSHOT_MAX_COUNT
): SqsDepthSnapshot[] {
	const cutoff = nowMs - maxAgeMs;
	let out = snaps.filter((s) => s.tsMs >= cutoff);
	if (out.length > maxCount) out = out.slice(-maxCount);
	return out;
}

export function loadSnapshots(queueName: string): SqsDepthSnapshot[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(keyFor(queueName));
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as SqsDepthSnapshot[]) : [];
	} catch {
		return [];
	}
}

export function saveSnapshots(queueName: string, snaps: SqsDepthSnapshot[]): void {
	if (!browser) return;
	try {
		localStorage.setItem(keyFor(queueName), JSON.stringify(snaps));
	} catch {
		// Quota exceeded — drop the oldest half and retry once.
		try {
			localStorage.setItem(
				keyFor(queueName),
				JSON.stringify(snaps.slice(-Math.floor(snaps.length / 2)))
			);
		} catch {
			/* give up silently */
		}
	}
}

export function clearSnapshots(queueName: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(keyFor(queueName));
	} catch {
		/* ignore */
	}
}
