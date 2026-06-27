import { describe, expect, it } from 'vitest';
import {
	buildThroughputSeries,
	buildLatencySeries,
	buildLatencyHistogram,
	computeLatencyPercentiles,
	buildSnapshotThroughput,
	estimateTimeInQueue,
	buildDepthSeries,
	snapshotsInWindowCount,
	filterByWindow,
	niceBucketMs
} from '$lib/floci/sqs-metrics';
import type { SqsEventType, SqsHistoryEvent } from '$lib/types/sqs-history';
import type { SqsDepthSnapshot } from '$lib/types/sqs';

function snap(tsMs: number, visible: number, notVisible = 0, delayed = 0): SqsDepthSnapshot {
	return { tsMs, visible, notVisible, delayed };
}

const T = 1_000_000_000_000; // round, divisible by all bucket sizes used here

function mk(
	id: number,
	eventType: SqsEventType,
	eventAtMs: number,
	queueTimeMs: number | null = null
): SqsHistoryEvent {
	return {
		id,
		queueName: 'q',
		messageId: null,
		eventType,
		bodyPreview: null,
		sentTsMs: null,
		eventAtMs,
		queueTimeMs
	};
}

describe('sqs-metrics', () => {
	describe('niceBucketMs', () => {
		it('snaps up to a sensible interval', () => {
			expect(niceBucketMs(30_000, 30)).toBe(1_000);
			expect(niceBucketMs(300_000, 30)).toBe(10_000);
			expect(niceBucketMs(0)).toBe(1_000);
		});
	});

	describe('filterByWindow', () => {
		it('keeps only events inside the lookback window', () => {
			const ev = [mk(1, 'sent', 1_000), mk(2, 'sent', 9_500)];
			expect(filterByWindow(ev, 1_000, 10_000).map((e) => e.id)).toEqual([2]);
			expect(filterByWindow(ev, 'all', 10_000)).toHaveLength(2);
		});
	});

	describe('buildThroughputSeries', () => {
		it('returns no buckets for an empty log', () => {
			expect(buildThroughputSeries([], { window: 'all', nowMs: T })).toEqual([]);
		});

		it('counts sent/received/deleted into aligned, gap-filled buckets', () => {
			const ev = [
				mk(1, 'sent', T + 0),
				mk(2, 'sent', T + 200),
				mk(3, 'received', T + 1_500, 1_500),
				mk(4, 'deleted', T + 2_500)
			];
			const series = buildThroughputSeries(ev, { window: 'all', nowMs: T + 3_000, bucketMs: 1_000 });
			expect(series).toEqual([
				{ tsMs: T, sent: 2, received: 0, deleted: 0 },
				{ tsMs: T + 1_000, sent: 0, received: 1, deleted: 0 },
				{ tsMs: T + 2_000, sent: 0, received: 0, deleted: 1 }
			]);
		});

		it('anchors a fixed window to [now - window, now] and drops older events', () => {
			const ev = [mk(1, 'sent', T + 0), mk(2, 'received', T + 6_000, 100)];
			const series = buildThroughputSeries(ev, {
				window: 5_000,
				nowMs: T + 10_000,
				bucketMs: 1_000
			});
			expect(series).toHaveLength(6); // T+5000 .. T+10000 inclusive
			const recBucket = series.find((b) => b.received > 0);
			expect(recBucket?.tsMs).toBe(T + 6_000);
			expect(series.reduce((a, b) => a + b.sent, 0)).toBe(0); // old "sent" excluded
		});
	});

	describe('buildLatencySeries', () => {
		it('aggregates avg/min/max time-in-queue per bucket, ignoring untimed events', () => {
			const ev = [
				mk(1, 'received', T, 100),
				mk(2, 'received', T + 500, 300),
				mk(3, 'received', T + 1_500, 200),
				mk(4, 'sent', T + 1_600)
			];
			const series = buildLatencySeries(ev, { window: 'all', nowMs: T + 2_000, bucketMs: 1_000 });
			expect(series).toEqual([
				{ tsMs: T, count: 2, avgMs: 200, minMs: 100, maxMs: 300 },
				{ tsMs: T + 1_000, count: 1, avgMs: 200, minMs: 200, maxMs: 200 }
			]);
		});
	});

	describe('buildLatencyHistogram', () => {
		it('bins time-in-queue into fixed ranges with an open-ended tail', () => {
			const ev = [50, 50, 150, 700, 2_000, 90_000, 700_000].map((q, i) =>
				mk(i + 1, 'received', T + i, q)
			);
			const hist = buildLatencyHistogram(ev);
			expect(hist.map((b) => b.count)).toEqual([2, 1, 1, 1, 0, 1, 0, 1]);
			expect(hist[0].label).toBe('<100ms');
			expect(hist[hist.length - 1].hiMs).toBeNull();
		});
	});

	describe('computeLatencyPercentiles', () => {
		it('computes nearest-rank percentiles over timed events only', () => {
			const ev = [
				mk(1, 'received', 1, 100),
				mk(2, 'received', 2, 200),
				mk(3, 'received', 3, 300),
				mk(4, 'received', 4, 400),
				mk(5, 'sent', 5)
			];
			expect(computeLatencyPercentiles(ev)).toEqual({
				count: 4,
				minMs: 100,
				avgMs: 250,
				p50Ms: 200,
				p90Ms: 400,
				p95Ms: 400,
				maxMs: 400
			});
		});

		it('returns nulls when there is no timing data', () => {
			expect(computeLatencyPercentiles([])).toEqual({
				count: 0,
				minMs: null,
				avgMs: null,
				p50Ms: null,
				p90Ms: null,
				p95Ms: null,
				maxMs: null
			});
		});
	});

	describe('buildSnapshotThroughput', () => {
		it('needs at least two snapshots', () => {
			expect(buildSnapshotThroughput([snap(T, 5)], { window: 'all', nowMs: T })).toEqual([]);
		});

		it('derives enqueue/dequeue flow from backlog deltas', () => {
			const snaps = [snap(T, 0), snap(T + 1_000, 10), snap(T + 2_000, 30), snap(T + 3_000, 5)];
			const series = buildSnapshotThroughput(snaps, {
				window: 'all',
				nowMs: T + 3_000,
				bucketMs: 1_000
			});
			expect(series).toEqual([
				{ tsMs: T + 1_000, enqueued: 10, dequeued: 0 },
				{ tsMs: T + 2_000, enqueued: 20, dequeued: 0 },
				{ tsMs: T + 3_000, enqueued: 0, dequeued: 25 }
			]);
		});

		it('counts in-flight and delayed toward backlog', () => {
			// total goes 0 -> 10 (all in-flight/delayed) -> 0
			const snaps = [snap(T, 0), snap(T + 1_000, 0, 6, 4), snap(T + 2_000, 0)];
			const series = buildSnapshotThroughput(snaps, {
				window: 'all',
				nowMs: T + 2_000,
				bucketMs: 1_000
			});
			expect(series.reduce((a, b) => a + b.enqueued, 0)).toBe(10);
			expect(series.reduce((a, b) => a + b.dequeued, 0)).toBe(10);
		});
	});

	describe('estimateTimeInQueue', () => {
		it('applies Little’s Law over a draining queue', () => {
			const snaps = [snap(T, 100), snap(T + 10_000, 0)];
			expect(estimateTimeInQueue(snaps, { window: 'all', nowMs: T + 10_000 })).toEqual({
				avgBacklogMsgs: 50,
				dequeuedTotal: 100,
				dequeueRatePerSec: 10,
				estWaitMs: 5_000,
				windowMs: 10_000
			});
		});

		it('returns a null wait when nothing is consumed', () => {
			const snaps = [snap(T, 0), snap(T + 1_000, 10)];
			const est = estimateTimeInQueue(snaps, { window: 'all', nowMs: T + 1_000 });
			expect(est.dequeuedTotal).toBe(0);
			expect(est.estWaitMs).toBeNull();
		});

		it('handles a single snapshot', () => {
			const est = estimateTimeInQueue([snap(T, 5)], { window: 'all', nowMs: T });
			expect(est).toEqual({
				avgBacklogMsgs: 5,
				dequeuedTotal: 0,
				dequeueRatePerSec: null,
				estWaitMs: null,
				windowMs: 0
			});
		});
	});

	describe('buildDepthSeries / snapshotsInWindowCount', () => {
		const snaps = [snap(T, 1), snap(T + 1_000, 2), snap(T + 2_000, 3)];

		it('passes through small series and filters by window', () => {
			expect(buildDepthSeries(snaps, { window: 'all', nowMs: T + 2_000 })).toHaveLength(3);
			expect(snapshotsInWindowCount(snaps, 1_500, T + 2_000)).toBe(2);
		});

		it('downsamples large series while keeping the latest point', () => {
			const many = Array.from({ length: 1_000 }, (_, i) => snap(T + i * 1_000, i));
			const ds = buildDepthSeries(many, { window: 'all', nowMs: T + 1_000_000, maxPoints: 100 });
			expect(ds.length).toBeLessThanOrEqual(101);
			expect(ds[ds.length - 1]).toBe(many[many.length - 1]);
		});
	});
});
