<script lang="ts">
	import { onMount } from 'svelte';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import { getQueueUrl, getQueueMetrics } from '$lib/floci/sqs';
	import {
		buildThroughputSeries,
		buildLatencySeries,
		buildLatencyHistogram,
		computeLatencyPercentiles,
		filterByWindow,
		WINDOW_PRESETS,
		type MetricWindow
	} from '$lib/floci/sqs-metrics';
	import { formatDuration } from '$lib/utils/formatDuration';
	import type { SqsQueueMetrics } from '$lib/types/sqs';

	let { data } = $props();

	// Shared palette (kept in sync with the history page's event tags).
	const C = {
		visible: '#0ea5e9', // sky-500 — available / depth
		inflight: '#f59e0b', // amber-500 — in-flight / being read
		delayed: '#8b5cf6', // violet-500 — delayed
		sent: '#0ea5e9',
		received: '#10b981', // emerald-500
		deleted: '#f43f5e' // rose-500
	};

	// Anchor windowed queries to a single "now" captured on entry.
	const nowMs = Date.now();
	let range = $state<MetricWindow>('all');

	// ── Live depth polling (real-time, from the queue itself) ────────────────
	type Snapshot = { tsMs: number } & SqsQueueMetrics;
	const MAX_SNAPSHOTS = 240;

	let snapshots = $state<Snapshot[]>([]);
	let live = $state<SqsQueueMetrics | null>(null);
	let lastUpdated = $state<number | null>(null);
	let liveError = $state<string | null>(null);
	let running = $state(true);
	let intervalMs = $state(5000);
	let queueUrl: string | null = null;

	async function poll() {
		try {
			if (!queueUrl) queueUrl = await getQueueUrl(data.name);
			const m = await getQueueMetrics(queueUrl);
			live = m;
			lastUpdated = Date.now();
			snapshots = [...snapshots, { tsMs: lastUpdated, ...m }].slice(-MAX_SNAPSHOTS);
			liveError = null;
		} catch (e) {
			liveError = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(() => {
		poll();
	});

	// Drive the polling timer purely off reactive state so toggling
	// run/interval restarts cleanly without leaking timers.
	$effect(() => {
		if (!running) return;
		const id = setInterval(poll, intervalMs);
		return () => clearInterval(id);
	});

	const depthSeries = $derived([
		{
			name: 'Available',
			color: C.visible,
			area: true,
			points: snapshots.map((s) => ({ x: s.tsMs, y: s.visible }))
		},
		{
			name: 'In-flight (being read)',
			color: C.inflight,
			points: snapshots.map((s) => ({ x: s.tsMs, y: s.notVisible }))
		},
		{
			name: 'Delayed',
			color: C.delayed,
			points: snapshots.map((s) => ({ x: s.tsMs, y: s.delayed }))
		}
	]);

	// ── Historical series (from the local send/receive/delete event log) ─────
	const scopedEvents = $derived(filterByWindow(data.events, range, nowMs));

	const throughput = $derived(buildThroughputSeries(data.events, { window: range, nowMs }));
	const throughputSeries = [
		{ name: 'Sent', color: C.sent },
		{ name: 'Received', color: C.received },
		{ name: 'Deleted', color: C.deleted }
	];
	const throughputGroups = $derived(
		throughput.map((b) => ({ label: axisFmt(b.tsMs), values: [b.sent, b.received, b.deleted] }))
	);

	const latency = $derived(buildLatencySeries(data.events, { window: range, nowMs }));
	const latencyLineSeries = $derived([
		{
			name: 'Avg time in queue',
			color: C.received,
			area: true,
			points: latency.filter((b) => b.avgMs != null).map((b) => ({ x: b.tsMs, y: b.avgMs as number }))
		},
		{
			name: 'Max',
			color: C.deleted,
			points: latency.filter((b) => b.maxMs != null).map((b) => ({ x: b.tsMs, y: b.maxMs as number }))
		}
	]);

	const histogram = $derived(buildLatencyHistogram(scopedEvents));
	const histogramSeries = [{ name: 'messages', color: C.received }];
	const histogramGroups = $derived(histogram.map((b) => ({ label: b.label, values: [b.count] })));

	const pct = $derived(computeLatencyPercentiles(scopedEvents));

	const totals = $derived({
		sent: throughput.reduce((a, b) => a + b.sent, 0),
		received: throughput.reduce((a, b) => a + b.received, 0),
		deleted: throughput.reduce((a, b) => a + b.deleted, 0)
	});

	// ── time-axis formatting ─────────────────────────────────────────────────
	const spanMs = $derived(
		throughput.length > 1 ? throughput[throughput.length - 1].tsMs - throughput[0].tsMs : 0
	);
	function axisFmt(ms: number): string {
		const opts: Intl.DateTimeFormatOptions =
			spanMs >= 24 * 3_600_000
				? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
				: { hour: '2-digit', minute: '2-digit' };
		return new Date(ms).toLocaleString(undefined, opts);
	}
	function clockFmt(ms: number): string {
		return new Date(ms).toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});
	const sinceUpdated = $derived(lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null);
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
			Live queue depth plus throughput and time-in-queue recorded locally in this browser.
		</p>
	</div>

	<!-- ════════════ LIVE DEPTH ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-sm font-semibold">Queue depth (live)</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					Polled directly from the queue · how many are waiting vs being read.
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
			</div>
		</div>

		{#if liveError}
			<ErrorPanel message="Could not read live metrics" hint={liveError} />
		{/if}

		<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
			<div class="console-surface p-3">
				<p class="console-subtle-label">Available</p>
				<p class="mt-1 font-mono text-2xl font-semibold" style="color:{C.visible}">
					{live?.visible ?? '—'}
				</p>
				<p class="text-[10px] text-muted-foreground/60">messages waiting</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">In-flight</p>
				<p class="mt-1 font-mono text-2xl font-semibold" style="color:{C.inflight}">
					{live?.notVisible ?? '—'}
				</p>
				<p class="text-[10px] text-muted-foreground/60">received, being processed</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Delayed</p>
				<p class="mt-1 font-mono text-2xl font-semibold" style="color:{C.delayed}">
					{live?.delayed ?? '—'}
				</p>
				<p class="text-[10px] text-muted-foreground/60">not yet deliverable</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Status</p>
				<p class="mt-1 flex items-center gap-1.5 text-sm font-medium">
					<span
						class="inline-block h-2 w-2 rounded-full {running ? 'bg-emerald-500 pulse-dot' : 'bg-muted-foreground/40'}"
					></span>
					{running ? 'Live' : 'Paused'}
				</p>
				<p class="text-[10px] text-muted-foreground/60">
					{sinceUpdated == null ? 'never updated' : `updated ${sinceUpdated}s ago`}
				</p>
			</div>
		</div>

		<LineChart
			series={depthSeries}
			height={200}
			formatX={clockFmt}
			formatY={(v) => String(Math.round(v))}
			yUnit="messages"
			emptyText={running ? 'Collecting snapshots…' : 'Paused — resume to collect depth'}
		/>
	</section>

	<!-- ════════════ WINDOW SELECTOR ════════════ -->
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
			{scopedEvents.length} event{scopedEvents.length !== 1 ? 's' : ''} in range
		</span>
	</div>

	<!-- ════════════ THROUGHPUT ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div>
			<h2 class="text-sm font-semibold">Message throughput</h2>
			<p class="mt-0.5 text-xs text-muted-foreground/60">
				Sent / received / deleted per interval, from this browser's activity.
			</p>
		</div>

		<div class="grid grid-cols-3 gap-2.5">
			<div class="console-surface p-3">
				<p class="console-subtle-label">Sent</p>
				<p class="mt-1 font-mono text-lg font-semibold" style="color:{C.sent}">{totals.sent}</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Received</p>
				<p class="mt-1 font-mono text-lg font-semibold" style="color:{C.received}">{totals.received}</p>
			</div>
			<div class="console-surface p-3">
				<p class="console-subtle-label">Deleted</p>
				<p class="mt-1 font-mono text-lg font-semibold" style="color:{C.deleted}">{totals.deleted}</p>
			</div>
		</div>

		<BarChart
			series={throughputSeries}
			groups={throughputGroups}
			height={220}
			formatValue={(v) => String(Math.round(v))}
			emptyText="No send/receive/delete activity recorded in this range"
		/>
	</section>

	<!-- ════════════ TIME IN QUEUE ════════════ -->
	<section class="console-panel p-4 space-y-4">
		<div>
			<h2 class="text-sm font-semibold">Time in queue</h2>
			<p class="mt-0.5 text-xs text-muted-foreground/60">
				How long messages waited before being received (send → receive latency).
			</p>
		</div>

		<div class="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
			{#each [['Min', pct.minMs], ['Avg', pct.avgMs], ['p50', pct.p50Ms], ['p90', pct.p90Ms], ['p95', pct.p95Ms], ['Max', pct.maxMs]] as [label, value]}
				<div class="console-surface p-3">
					<p class="console-subtle-label">{label}</p>
					<p class="mt-1 font-mono text-base font-semibold text-foreground">{formatDuration(value as number | null)}</p>
				</div>
			{/each}
		</div>

		<div>
			<p class="mb-1.5 text-xs font-medium text-muted-foreground">Latency over time</p>
			<LineChart
				series={latencyLineSeries}
				height={180}
				formatX={axisFmt}
				formatY={(v) => formatDuration(v)}
				emptyText="No received messages with timing data in this range"
			/>
		</div>

		<div>
			<p class="mb-1.5 text-xs font-medium text-muted-foreground">Distribution ({pct.count} message{pct.count !== 1 ? 's' : ''})</p>
			<BarChart
				series={histogramSeries}
				groups={histogramGroups}
				height={180}
				formatValue={(v) => String(Math.round(v))}
				emptyText="No timing data — receive some messages to populate this"
			/>
		</div>
	</section>

	<p class="text-[11px] leading-relaxed text-muted-foreground/50">
		Depth is read live from the queue. Throughput and time-in-queue come from events recorded in
		this browser when you send, receive, or delete messages here — they reflect your own activity,
		not traffic from other producers or consumers.
	</p>
</div>
