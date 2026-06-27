import type { SqsHistoryEvent } from '$lib/types/sqs-history';
import type { SqsDepthSnapshot } from '$lib/types/sqs';

/**
 * Pure aggregation helpers that turn the locally-recorded SQS event log into the
 * kind of time-series and distribution data CloudWatch surfaces for queues:
 * throughput over time (NumberOfMessagesSent/Received/Deleted), end-to-end
 * time-in-queue, and a latency distribution. Everything here is deterministic
 * given an event list + an explicit `nowMs`, so it is straightforward to unit
 * test without faking the clock.
 */

export type ThroughputBucket = {
	/** Inclusive bucket start, epoch ms. */
	tsMs: number;
	sent: number;
	received: number;
	deleted: number;
};

export type LatencyBucket = {
	tsMs: number;
	count: number;
	avgMs: number | null;
	minMs: number | null;
	maxMs: number | null;
};

export type LatencyHistogramBin = {
	loMs: number;
	/** Upper bound, exclusive; `null` for the open-ended final bin. */
	hiMs: number | null;
	label: string;
	count: number;
};

export type LatencyPercentiles = {
	count: number;
	minMs: number | null;
	avgMs: number | null;
	p50Ms: number | null;
	p90Ms: number | null;
	p95Ms: number | null;
	maxMs: number | null;
};

/** Lookback window in ms, or `'all'` for the full retained history. */
export type MetricWindow = number | 'all';

export const WINDOW_PRESETS: { label: string; value: MetricWindow }[] = [
	{ label: '15m', value: 15 * 60_000 },
	{ label: '1h', value: 60 * 60_000 },
	{ label: '6h', value: 6 * 60 * 60_000 },
	{ label: '24h', value: 24 * 60 * 60_000 },
	{ label: 'All', value: 'all' }
];

/** "Nice" bucket sizes (ms) we snap to so axes stay readable across spans. */
const NICE_BUCKETS_MS = [
	1_000, 5_000, 10_000, 30_000, 60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000,
	60 * 60_000, 3 * 60 * 60_000, 6 * 60 * 60_000, 12 * 60 * 60_000, 24 * 60 * 60_000
];

const MAX_BUCKETS = 500;

/**
 * Pick a bucket size that divides `spanMs` into roughly `targetBuckets`,
 * snapped up to the nearest "nice" interval.
 */
export function niceBucketMs(spanMs: number, targetBuckets = 30): number {
	if (!Number.isFinite(spanMs) || spanMs <= 0) return NICE_BUCKETS_MS[0];
	const ideal = spanMs / Math.max(1, targetBuckets);
	for (const b of NICE_BUCKETS_MS) {
		if (b >= ideal) return b;
	}
	return NICE_BUCKETS_MS[NICE_BUCKETS_MS.length - 1];
}

/** Keep only events whose `eventAtMs` falls within `window` ending at `nowMs`. */
export function filterByWindow(
	events: SqsHistoryEvent[],
	window: MetricWindow,
	nowMs: number
): SqsHistoryEvent[] {
	if (window === 'all') return events;
	const from = nowMs - window;
	return events.filter((e) => e.eventAtMs >= from);
}

type Extent = { startMs: number; endMs: number };

function extentOf(events: SqsHistoryEvent[], window: MetricWindow, nowMs: number): Extent | null {
	if (events.length === 0) return null;
	let min = Infinity;
	let max = -Infinity;
	for (const e of events) {
		if (e.eventAtMs < min) min = e.eventAtMs;
		if (e.eventAtMs > max) max = e.eventAtMs;
	}
	// For a fixed window, anchor the axis to [now - window, now] so an empty tail
	// still reads as "nothing happened recently" rather than collapsing the span.
	if (window !== 'all') {
		return { startMs: nowMs - window, endMs: nowMs };
	}
	return { startMs: min, endMs: max };
}

export type SeriesOptions = {
	window?: MetricWindow;
	nowMs: number;
	bucketMs?: number;
	targetBuckets?: number;
};

/**
 * Throughput per time bucket: counts of sent / received / deleted events.
 * Buckets are aligned to the bucket size and gaps are filled with zeros so the
 * time axis is continuous.
 */
export function buildThroughputSeries(
	events: SqsHistoryEvent[],
	opts: SeriesOptions
): ThroughputBucket[] {
	const window = opts.window ?? 'all';
	const scoped = filterByWindow(events, window, opts.nowMs);
	const extent = extentOf(scoped, window, opts.nowMs);
	if (!extent) return [];

	const { startMs, endMs } = normalizeExtent(extent);
	const bucketMs = clampBucketMs(
		opts.bucketMs ?? niceBucketMs(endMs - startMs, opts.targetBuckets ?? 30),
		startMs,
		endMs
	);
	const alignedStart = Math.floor(startMs / bucketMs) * bucketMs;
	const buckets = makeBuckets(alignedStart, endMs, bucketMs, (tsMs) => ({
		tsMs,
		sent: 0,
		received: 0,
		deleted: 0
	}));

	for (const e of scoped) {
		const idx = Math.floor((e.eventAtMs - alignedStart) / bucketMs);
		const bucket = buckets[idx];
		if (!bucket) continue;
		if (e.eventType === 'sent') bucket.sent++;
		else if (e.eventType === 'received') bucket.received++;
		else if (e.eventType === 'deleted') bucket.deleted++;
	}
	return buckets;
}

/**
 * Time-in-queue per time bucket (avg/min/max), derived from `received` events
 * that carry a valid `queueTimeMs`. Buckets with no measured messages report
 * null stats but are still emitted to keep the axis continuous.
 */
export function buildLatencySeries(events: SqsHistoryEvent[], opts: SeriesOptions): LatencyBucket[] {
	const window = opts.window ?? 'all';
	const scoped = filterByWindow(events, window, opts.nowMs);
	const extent = extentOf(scoped, window, opts.nowMs);
	if (!extent) return [];

	const { startMs, endMs } = normalizeExtent(extent);
	const bucketMs = clampBucketMs(
		opts.bucketMs ?? niceBucketMs(endMs - startMs, opts.targetBuckets ?? 30),
		startMs,
		endMs
	);
	const alignedStart = Math.floor(startMs / bucketMs) * bucketMs;

	type Acc = { tsMs: number; sum: number; count: number; min: number; max: number };
	const accs = makeBuckets(alignedStart, endMs, bucketMs, (tsMs) => ({
		tsMs,
		sum: 0,
		count: 0,
		min: Infinity,
		max: -Infinity
	})) as Acc[];

	for (const e of scoped) {
		if (e.queueTimeMs == null || !Number.isFinite(e.queueTimeMs)) continue;
		const idx = Math.floor((e.eventAtMs - alignedStart) / bucketMs);
		const acc = accs[idx];
		if (!acc) continue;
		acc.sum += e.queueTimeMs;
		acc.count++;
		if (e.queueTimeMs < acc.min) acc.min = e.queueTimeMs;
		if (e.queueTimeMs > acc.max) acc.max = e.queueTimeMs;
	}

	return accs.map((a) => ({
		tsMs: a.tsMs,
		count: a.count,
		avgMs: a.count ? a.sum / a.count : null,
		minMs: a.count ? a.min : null,
		maxMs: a.count ? a.max : null
	}));
}

/** Fixed, latency-friendly histogram bins (matches how queue ages are read). */
const HISTOGRAM_BOUNDS_MS = [100, 500, 1_000, 5_000, 30_000, 120_000, 600_000];

/**
 * Distribution of time-in-queue across fixed buckets. Returns one bin per range
 * plus an open-ended final bin (`hiMs: null`).
 */
export function buildLatencyHistogram(events: SqsHistoryEvent[]): LatencyHistogramBin[] {
	const bins: LatencyHistogramBin[] = [];
	let lo = 0;
	for (const hi of HISTOGRAM_BOUNDS_MS) {
		bins.push({ loMs: lo, hiMs: hi, label: histLabel(lo, hi), count: 0 });
		lo = hi;
	}
	bins.push({ loMs: lo, hiMs: null, label: histLabel(lo, null), count: 0 });

	for (const e of events) {
		const v = e.queueTimeMs;
		if (v == null || !Number.isFinite(v)) continue;
		let placed = false;
		for (let i = 0; i < bins.length - 1; i++) {
			if (v < (bins[i].hiMs as number)) {
				bins[i].count++;
				placed = true;
				break;
			}
		}
		if (!placed) bins[bins.length - 1].count++;
	}
	return bins;
}

/** Percentiles + min/avg/max of time-in-queue using nearest-rank. */
export function computeLatencyPercentiles(events: SqsHistoryEvent[]): LatencyPercentiles {
	const values = events
		.map((e) => e.queueTimeMs)
		.filter((v): v is number => v != null && Number.isFinite(v))
		.sort((a, b) => a - b);

	if (values.length === 0) {
		return {
			count: 0,
			minMs: null,
			avgMs: null,
			p50Ms: null,
			p90Ms: null,
			p95Ms: null,
			maxMs: null
		};
	}

	const sum = values.reduce((a, b) => a + b, 0);
	return {
		count: values.length,
		minMs: values[0],
		avgMs: sum / values.length,
		p50Ms: percentile(values, 50),
		p90Ms: percentile(values, 90),
		p95Ms: percentile(values, 95),
		maxMs: values[values.length - 1]
	};
}

// ── snapshot-derived metrics (from polled queue depth) ──────────────────────
//
// SQS exposes approximate depth *levels*, not flow counters, so throughput and
// time-in-queue are derived from how the backlog changes between polls. These
// reflect ALL activity on the queue (any producer/consumer), not just actions
// taken from this browser's UI.

export type SnapshotThroughputBucket = {
	tsMs: number;
	/** Approx messages added (positive backlog change) in the bucket. */
	enqueued: number;
	/** Approx messages removed (negative backlog change) in the bucket. */
	dequeued: number;
};

export type QueueEstimate = {
	/** Time-weighted average backlog (visible + in-flight + delayed). */
	avgBacklogMsgs: number | null;
	/** Approx messages removed over the window. */
	dequeuedTotal: number;
	/** Approx dequeue rate (messages/second) over the window. */
	dequeueRatePerSec: number | null;
	/** Little's Law estimate of average time-in-queue: W ≈ L / λ. */
	estWaitMs: number | null;
	/** Span of the analysed window in ms. */
	windowMs: number;
};

export type DepthSeriesOptions = SeriesOptions & { maxPoints?: number };

function backlog(s: SqsDepthSnapshot): number {
	return s.visible + s.notVisible + s.delayed;
}

function snapshotsInWindow(
	snaps: SqsDepthSnapshot[],
	window: MetricWindow,
	nowMs: number
): SqsDepthSnapshot[] {
	if (window === 'all') return snaps;
	const from = nowMs - window;
	return snaps.filter((s) => s.tsMs >= from);
}

/** Count of snapshots that fall within the given window. */
export function snapshotsInWindowCount(
	snaps: SqsDepthSnapshot[],
	window: MetricWindow,
	nowMs: number
): number {
	return snapshotsInWindow(snaps, window, nowMs).length;
}

/** Per-poll backlog deltas split into enqueue (+) and dequeue (−) flow. */
function backlogDeltas(snaps: SqsDepthSnapshot[]): SnapshotThroughputBucket[] {
	const out: SnapshotThroughputBucket[] = [];
	for (let i = 1; i < snaps.length; i++) {
		const d = backlog(snaps[i]) - backlog(snaps[i - 1]);
		out.push({
			tsMs: snaps[i].tsMs,
			enqueued: d > 0 ? d : 0,
			dequeued: d < 0 ? -d : 0
		});
	}
	return out;
}

/**
 * Approximate enqueue/dequeue throughput per time bucket, derived from
 * backlog changes between consecutive polls.
 */
export function buildSnapshotThroughput(
	snaps: SqsDepthSnapshot[],
	opts: SeriesOptions
): SnapshotThroughputBucket[] {
	if (snaps.length < 2) return [];
	const window = opts.window ?? 'all';
	const deltas = backlogDeltas(snaps);
	const scoped = window === 'all' ? deltas : deltas.filter((d) => d.tsMs >= opts.nowMs - window);
	if (scoped.length === 0) return [];

	const rawStart = window === 'all' ? scoped[0].tsMs : opts.nowMs - window;
	const rawEnd = window === 'all' ? scoped[scoped.length - 1].tsMs : opts.nowMs;
	const { startMs, endMs } = normalizeExtent({ startMs: rawStart, endMs: rawEnd });
	const bucketMs = clampBucketMs(
		opts.bucketMs ?? niceBucketMs(endMs - startMs, opts.targetBuckets ?? 30),
		startMs,
		endMs
	);
	const alignedStart = Math.floor(startMs / bucketMs) * bucketMs;
	const buckets = makeBuckets(alignedStart, endMs, bucketMs, (tsMs) => ({
		tsMs,
		enqueued: 0,
		dequeued: 0
	}));

	for (const d of scoped) {
		const idx = Math.floor((d.tsMs - alignedStart) / bucketMs);
		const bucket = buckets[idx];
		if (!bucket) continue;
		bucket.enqueued += d.enqueued;
		bucket.dequeued += d.dequeued;
	}
	return buckets;
}

/**
 * Estimate average time-in-queue via Little's Law (W ≈ L / λ), where L is the
 * time-weighted average backlog and λ is the observed dequeue rate. Returns a
 * null estimate when nothing is being consumed.
 */
export function estimateTimeInQueue(snaps: SqsDepthSnapshot[], opts: SeriesOptions): QueueEstimate {
	const window = opts.window ?? 'all';
	const scoped = snapshotsInWindow(snaps, window, opts.nowMs);
	if (scoped.length < 2) {
		return {
			avgBacklogMsgs: scoped.length ? backlog(scoped[0]) : null,
			dequeuedTotal: 0,
			dequeueRatePerSec: null,
			estWaitMs: null,
			windowMs: 0
		};
	}

	let weighted = 0;
	let elapsed = 0;
	for (let i = 1; i < scoped.length; i++) {
		const dt = scoped[i].tsMs - scoped[i - 1].tsMs;
		if (dt <= 0) continue;
		weighted += ((backlog(scoped[i]) + backlog(scoped[i - 1])) / 2) * dt;
		elapsed += dt;
	}
	const avgBacklogMsgs = elapsed ? weighted / elapsed : backlog(scoped[scoped.length - 1]);
	const dequeuedTotal = backlogDeltas(scoped).reduce((a, b) => a + b.dequeued, 0);
	const windowMs = scoped[scoped.length - 1].tsMs - scoped[0].tsMs;
	const dequeueRatePerSec = windowMs > 0 ? dequeuedTotal / (windowMs / 1000) : null;
	const estWaitMs =
		dequeueRatePerSec && dequeueRatePerSec > 0 ? (avgBacklogMsgs / dequeueRatePerSec) * 1000 : null;

	return { avgBacklogMsgs, dequeuedTotal, dequeueRatePerSec, estWaitMs, windowMs };
}

/** Window + downsample snapshots for the depth chart (keeps the latest point). */
export function buildDepthSeries(
	snaps: SqsDepthSnapshot[],
	opts: DepthSeriesOptions
): SqsDepthSnapshot[] {
	const window = opts.window ?? 'all';
	const scoped = snapshotsInWindow(snaps, window, opts.nowMs);
	const max = opts.maxPoints ?? 400;
	if (scoped.length <= max) return scoped;

	const stride = Math.ceil(scoped.length / max);
	const out: SqsDepthSnapshot[] = [];
	for (let i = 0; i < scoped.length; i += stride) out.push(scoped[i]);
	const last = scoped[scoped.length - 1];
	if (out[out.length - 1] !== last) out.push(last);
	return out;
}

// ── internals ──────────────────────────────────────────────────────────────

function normalizeExtent({ startMs, endMs }: Extent): Extent {
	if (endMs <= startMs) return { startMs, endMs: startMs + 1_000 };
	return { startMs, endMs };
}

function clampBucketMs(bucketMs: number, startMs: number, endMs: number): number {
	const span = endMs - startMs;
	const safe = Math.max(1_000, bucketMs);
	if (span / safe <= MAX_BUCKETS) return safe;
	return Math.ceil(span / MAX_BUCKETS);
}

function makeBuckets<T>(
	alignedStart: number,
	endMs: number,
	bucketMs: number,
	make: (tsMs: number) => T
): T[] {
	const out: T[] = [];
	for (let t = alignedStart; t <= endMs; t += bucketMs) {
		out.push(make(t));
		if (out.length >= MAX_BUCKETS) break;
	}
	return out;
}

/** Nearest-rank percentile over a pre-sorted ascending array. */
function percentile(sorted: number[], p: number): number {
	if (sorted.length === 1) return sorted[0];
	const rank = Math.ceil((p / 100) * sorted.length);
	const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
	return sorted[idx];
}

function histLabel(lo: number, hi: number | null): string {
	if (hi === null) return `${shortMs(lo)}+`;
	if (lo === 0) return `<${shortMs(hi)}`;
	return `${shortMs(lo)}–${shortMs(hi)}`;
}

function shortMs(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${ms / 1000}s`;
	if (ms < 3_600_000) return `${ms / 60_000}m`;
	return `${ms / 3_600_000}h`;
}
