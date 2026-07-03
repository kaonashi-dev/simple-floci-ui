<script lang="ts">
	import { onMount } from 'svelte';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import LiveStat from '$lib/components/sqs/LiveStat.svelte';
	import { getQueueUrl, getQueueMetrics } from '$lib/floci/sqs';
	import {
		loadSnapshots,
		saveSnapshots,
		clearSnapshots,
		pruneSnapshots,
		serializeSnapshots
	} from '$lib/floci/sqs-snapshots';
	import {
		buildDepthSeries,
		buildSnapshotThroughput,
		estimateTimeInQueue,
		summarizeDepthWindow,
		snapshotsInWindowCount,
		WINDOW_PRESETS,
		type MetricWindow
	} from '$lib/floci/sqs-metrics';
	import { formatDuration } from '$lib/utils/formatDuration';
	import type { SqsDepthSnapshot, SqsQueueMetrics } from '$lib/types/sqs';

	let { data } = $props();

	const C = {
		visible: '#0ea5e9', // sky-500 — available / depth
		inflight: '#f59e0b', // amber-500 — in-flight / being read
		delayed: '#8b5cf6', // violet-500 — delayed
		enqueued: '#0ea5e9',
		dequeued: '#10b981' // emerald-500
	};

	let range = $state<MetricWindow>('all');

	// A reactive clock so windowed views and "updated Ns ago" stay fresh.
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	// ── Polling + persisted history ──────────────────────────────────────────
	let snapshots = $state<SqsDepthSnapshot[]>([]);
	let live = $state<SqsQueueMetrics | null>(null);
	let lastUpdated = $state<number | null>(null);
	let liveError = $state<string | null>(null);
	let running = $state(true);
	let intervalMs = $state(5000);
	let queueUrl: string | null = null;

	onMount(() => {
		// Show whatever this browser has already collected, immediately.
		snapshots = loadSnapshots(data.name);
		if (snapshots.length) lastUpdated = snapshots[snapshots.length - 1].tsMs;
		poll();
	});

	async function poll() {
		try {
			if (!queueUrl) queueUrl = await getQueueUrl(data.name);
			const m = await getQueueMetrics(queueUrl);
			const ts = Date.now();
			live = m;
			lastUpdated = ts;
			snapshots = pruneSnapshots([...snapshots, { tsMs: ts, ...m }], ts);
			saveSnapshots(data.name, snapshots);
			liveError = null;
		} catch (e) {
			liveError = e instanceof Error ? e.message : String(e);
		}
	}

	// Timer driven purely off reactive state — toggling restarts cleanly.
	$effect(() => {
		if (!running) return;
		const id = setInterval(poll, intervalMs);
		return () => clearInterval(id);
	});

	function clearHistory() {
		clearSnapshots(data.name);
		snapshots = [];
	}

	// Save the full collected history off to a JSON file the developer can keep.
	function exportHistory() {
		if (!snapshots.length) return;
		const json = serializeSnapshots(data.name, snapshots);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.name.replace(/[^\w.-]+/g, '_')}-sqs-history.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Wall-clock span of everything retained in storage (all ranges).
	const storedSpanMs = $derived(
		snapshots.length > 1 ? snapshots[snapshots.length - 1].tsMs - snapshots[0].tsMs : 0
	);

	// ── derived series ───────────────────────────────────────────────────────
	const depthPoints = $derived(buildDepthSeries(snapshots, { window: range, nowMs: now }));
	const depthSeries = $derived([
		{
			name: 'Available',
			color: C.visible,
			area: true,
			points: depthPoints.map((s) => ({ x: s.tsMs, y: s.visible }))
		},
		{
			name: 'In-flight (being read)',
			color: C.inflight,
			points: depthPoints.map((s) => ({ x: s.tsMs, y: s.notVisible }))
		},
		{
			name: 'Delayed',
			color: C.delayed,
			points: depthPoints.map((s) => ({ x: s.tsMs, y: s.delayed }))
		}
	]);

	// Per-level spark arrays + windowed roll-up powering the live stat cards.
	const summary = $derived(summarizeDepthWindow(snapshots, range, now));
	const sparks = $derived({
		visible: depthPoints.map((s) => s.visible),
		notVisible: depthPoints.map((s) => s.notVisible),
		delayed: depthPoints.map((s) => s.delayed),
		backlog: depthPoints.map((s) => s.visible + s.notVisible + s.delayed)
	});
	const backlogNow = $derived(
		live ? live.visible + live.notVisible + live.delayed : null
	);

	const throughput = $derived(buildSnapshotThroughput(snapshots, { window: range, nowMs: now }));
	const throughputSeries = [
		{ name: 'Enqueued', color: C.enqueued },
		{ name: 'Dequeued', color: C.dequeued }
	];
	const throughputGroups = $derived(
		throughput.map((b) => ({ label: axisFmt(b.tsMs), values: [b.enqueued, b.dequeued] }))
	);
	const totals = $derived({
		enqueued: throughput.reduce((a, b) => a + b.enqueued, 0),
		dequeued: throughput.reduce((a, b) => a + b.dequeued, 0)
	});
	// Rates over the observed span of the current range.
	const rangeSpanMs = $derived(
		summary.firstTsMs != null && summary.lastTsMs != null
			? summary.lastTsMs - summary.firstTsMs
			: 0
	);
	const throughputRates = $derived({
		enqueued: rangeSpanMs > 0 ? totals.enqueued / (rangeSpanMs / 1000) : null,
		dequeued: rangeSpanMs > 0 ? totals.dequeued / (rangeSpanMs / 1000) : null
	});

	const estimate = $derived(estimateTimeInQueue(snapshots, { window: range, nowMs: now }));
	const inRangeCount = $derived(snapshotsInWindowCount(snapshots, range, now));

	// ── time-axis formatting ───────────────────────────────────────────────
	const spanMs = $derived(
		depthPoints.length > 1 ? depthPoints[depthPoints.length - 1].tsMs - depthPoints[0].tsMs : 0
	);
	function axisFmt(ms: number): string {
		const opts: Intl.DateTimeFormatOptions =
			spanMs >= 24 * 3_600_000
				? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
				: spanMs >= 60 * 60_000
					? { hour: '2-digit', minute: '2-digit' }
					: { hour: '2-digit', minute: '2-digit', second: '2-digit' };
		return new Date(ms).toLocaleString(undefined, opts);
	}

	const sinceUpdated = $derived(
		lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null
	);

	function ratePerMin(perSec: number | null): string {
		if (perSec == null) return '—';
		return `${(perSec * 60).toFixed(perSec * 60 < 10 ? 1 : 0)}/min`;
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<!-- Breadcrumb + title -->
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/sqs" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">SQS</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<a
				href="/aws/sqs/{encodeURIComponent(data.name)}"
				class="truncate rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
			>{data.name}</a>
			<svg class="h-3 w-3 shrink-0 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="font-medium text-foreground">Metrics</span>
		</nav>
		<div class="flex items-center gap-2">
			<h1 class="page-title">Metrics</h1>
			{#if data.isFifo}
				<span class="console-tag border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">FIFO</span>
			{/if}
		</div>
		<p class="mt-0.5 page-subtitle">
			Polled live from the queue and stored in this browser — reflects all activity, from any
			producer or consumer.
		</p>
	</div>

	<!-- ════════════ LIVE DEPTH ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-sm font-semibold">Queue depth</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					How many are waiting vs being read · history persists across reloads.
				</p>
			</div>
			<div class="flex items-center gap-2">
				<select
					bind:value={intervalMs}
					class="h-8 rounded border border-input bg-background px-2 text-xs"
					aria-label="Refresh interval"
				>
					<option value={2000}>2s</option>
					<option value={5000}>5s</option>
					<option value={10000}>10s</option>
					<option value={30000}>30s</option>
				</select>
				<Button variant="outline" size="sm" class="h-8 px-2 text-xs" onclick={() => (running = !running)}>
					{#if running}
						<PauseIcon class="size-3.5" /> Pause
					{:else}
						<PlayIcon class="size-3.5" /> Resume
					{/if}
				</Button>
				<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={poll}>
					<RefreshCwIcon class="size-3.5" /> Now
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="h-8 px-2 text-xs"
					disabled={snapshots.length === 0}
					onclick={exportHistory}
				>
					<DownloadIcon class="size-3.5" /> Export
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
					onclick={clearHistory}
				>
					<Trash2Icon class="size-3.5" /> Clear
				</Button>
			</div>
		</div>

		{#if liveError}
			<ErrorPanel message="Could not read live metrics" hint={liveError} />
		{/if}

		<div class="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
			<LiveStat
				label="Available"
				value={live?.visible ?? null}
				color={C.visible}
				hint="messages waiting"
				spark={sparks.visible}
				peak={summary.count ? summary.peak.visible : null}
			/>
			<LiveStat
				label="In-flight"
				value={live?.notVisible ?? null}
				color={C.inflight}
				hint="received, being processed"
				spark={sparks.notVisible}
				peak={summary.count ? summary.peak.notVisible : null}
			/>
			<LiveStat
				label="Delayed"
				value={live?.delayed ?? null}
				color={C.delayed}
				hint="not yet deliverable"
				spark={sparks.delayed}
				peak={summary.count ? summary.peak.delayed : null}
			/>
			<LiveStat
				label="Total backlog"
				value={backlogNow}
				color="var(--color-foreground, currentColor)"
				hint="available + in-flight + delayed"
				spark={sparks.backlog}
				peak={summary.count ? summary.peak.backlog : null}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/70">
			<span class="flex items-center gap-1.5">
				<span
					class="inline-block h-2 w-2 rounded-full {running ? 'bg-emerald-500 pulse-dot' : 'bg-muted-foreground/40'}"
				></span>
				<span class="font-medium text-foreground/80">{running ? 'Live' : 'Paused'}</span>
			</span>
			<span>·</span>
			<span>{sinceUpdated == null ? 'never updated' : `updated ${sinceUpdated}s ago`}</span>
			<span>·</span>
			<span>polling every {(intervalMs / 1000).toFixed(0)}s</span>
		</div>

		<LineChart
			series={depthSeries}
			height={220}
			formatX={axisFmt}
			formatY={(v) => String(Math.round(v))}
			yUnit="messages"
			emptyText={running ? 'Collecting snapshots…' : 'Paused — resume to collect depth'}
		/>
	</section>

	<!-- ════════════ RANGE SELECTOR ════════════ -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-xs font-medium text-muted-foreground">Range</span>
		{#each WINDOW_PRESETS as preset}
			<button
				type="button"
				class="rounded border px-2.5 py-1 text-xs font-medium transition-colors {range === preset.value
					? 'border-primary bg-primary/10 text-primary'
					: 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'}"
				onclick={() => (range = preset.value)}
			>
				{preset.label}
			</button>
		{/each}
		<span class="ml-auto text-[11px] text-muted-foreground/50">
			{inRangeCount} snapshot{inRangeCount !== 1 ? 's' : ''} in range
		</span>
	</div>

	<!-- ════════════ THROUGHPUT ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div>
			<h2 class="text-sm font-semibold">Throughput (approx)</h2>
			<p class="mt-0.5 text-xs text-muted-foreground/60">
				Messages added vs removed per interval, derived from how the backlog changes between polls.
			</p>
		</div>

		<div class="grid grid-cols-2 gap-2.5">
			<div class="console-surface p-3">
				<p class="console-subtle-label">Enqueued</p>
				<p class="mt-1 font-mono text-lg font-semibold" style="color:{C.enqueued}">≈ {totals.enqueued}</p>
				<p class="text-[10px] text-muted-foreground/60">{ratePerMin(throughputRates.enqueued)} in this range</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Dequeued</p>
				<p class="mt-1 font-mono text-lg font-semibold" style="color:{C.dequeued}">≈ {totals.dequeued}</p>
				<p class="text-[10px] text-muted-foreground/60">{ratePerMin(throughputRates.dequeued)} in this range</p>
			</div>
		</div>

		<BarChart
			series={throughputSeries}
			groups={throughputGroups}
			height={220}
			formatValue={(v) => String(Math.round(v))}
			emptyText="No depth changes recorded yet — produce or consume messages while this is open"
		/>
	</section>

	<!-- ════════════ ESTIMATED TIME IN QUEUE ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div>
			<h2 class="text-sm font-semibold">Estimated time in queue</h2>
			<p class="mt-0.5 text-xs text-muted-foreground/60">
				Average wait estimated with Little's Law: W ≈ average backlog ÷ dequeue rate.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
			<div class="console-surface p-3">
				<p class="console-subtle-label">Avg backlog</p>
				<p class="mt-1 font-mono text-base font-semibold text-foreground">
					{estimate.avgBacklogMsgs == null ? '—' : `${estimate.avgBacklogMsgs.toFixed(1)} msgs`}
				</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Dequeue rate</p>
				<p class="mt-1 font-mono text-base font-semibold text-foreground">
					{ratePerMin(estimate.dequeueRatePerSec)}
				</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Est. avg wait</p>
				<p class="mt-1 font-mono text-base font-semibold text-foreground">
					{formatDuration(estimate.estWaitMs)}
				</p>
			</div>
		</div>

		{#if estimate.estWaitMs == null}
			<p class="text-[11px] text-muted-foreground/50">
				No consumption observed in this range yet — the wait estimate needs messages to be drained
				from the queue.
			</p>
		{/if}
	</section>

	<!-- ════════════ SAVED HISTORY ════════════ -->
	<div class="flex flex-wrap items-center justify-between gap-3 rounded border border-border/60 bg-muted/20 px-4 py-2.5">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/70">
			<span>
				<span class="font-mono tabular-nums text-foreground/80">{snapshots.length.toLocaleString()}</span>
				snapshot{snapshots.length !== 1 ? 's' : ''} saved
			</span>
			{#if storedSpanMs > 0}
				<span>·</span>
				<span>spanning {formatDuration(storedSpanMs)}</span>
			{/if}
			<span>·</span>
			<span>kept 24h in this browser</span>
		</div>
		<Button
			variant="outline"
			size="sm"
			class="h-7 px-2 text-xs"
			disabled={snapshots.length === 0}
			onclick={exportHistory}
		>
			<DownloadIcon class="size-3.5" /> Export JSON
		</Button>
	</div>

	<p class="text-[11px] leading-relaxed text-muted-foreground/50">
		SQS reports approximate depth levels, not exact send/receive counters, so throughput and wait
		time are estimates derived from backlog changes between polls. History is collected while this
		page is open and saved per-queue in this browser (surviving reloads); export it to keep a copy.
	</p>
</div>
