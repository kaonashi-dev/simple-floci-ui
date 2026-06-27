import { describe, expect, it } from 'vitest';
import {
	buildThroughputSeries,
	buildLatencySeries,
	buildLatencyHistogram,
	computeLatencyPercentiles,
	filterByWindow,
	niceBucketMs
} from '$lib/floci/sqs-metrics';
import type { SqsEventType, SqsHistoryEvent } from '$lib/types/sqs-history';

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
});
