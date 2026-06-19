<script lang="ts">
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { SqsEventType } from '$lib/types/sqs-history';

	let { data } = $props();

	function fmtTs(ms: number): string {
		return new Date(ms).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});
	}

	function fmtQueueTime(ms: number | null): string {
		if (ms === null) return '—';
		if (ms < 1000) return `${ms} ms`;
		if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
		if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)} min`;
		return `${(ms / 3_600_000).toFixed(1)} h`;
	}

	const tagClass: Record<SqsEventType, string> = {
		sent: 'console-tag border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300',
		received: 'console-tag border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
		deleted: 'console-tag border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
	};

	const stats = $derived(data.stats);
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
			<span class="font-medium text-foreground">History</span>
		</nav>
		<h1 class="page-title">Message History</h1>
		<p class="mt-0.5 page-subtitle">{data.events.length} event{data.events.length !== 1 ? 's' : ''} recorded locally</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Sent</p>
			<p class="mt-1 font-mono text-lg font-semibold text-sky-600 dark:text-sky-400">{stats.totalSent}</p>
			<p class="text-[10px] text-muted-foreground/60">messages enqueued</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Received</p>
			<p class="mt-1 font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">{stats.totalReceived}</p>
			<p class="text-[10px] text-muted-foreground/60">messages polled</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Deleted</p>
			<p class="mt-1 font-mono text-lg font-semibold text-rose-600 dark:text-rose-400">{stats.totalDeleted}</p>
			<p class="text-[10px] text-muted-foreground/60">messages consumed</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Avg time in queue</p>
			<p class="mt-1 font-mono text-lg font-semibold text-foreground">{fmtQueueTime(stats.avgQueueTimeMs)}</p>
			{#if stats.minQueueTimeMs !== null && stats.maxQueueTimeMs !== null}
				<p class="text-[10px] text-muted-foreground/60">
					{fmtQueueTime(stats.minQueueTimeMs)} – {fmtQueueTime(stats.maxQueueTimeMs)}
				</p>
			{:else}
				<p class="text-[10px] text-muted-foreground/60">no data yet</p>
			{/if}
		</div>
	</div>

	<!-- Event log -->
	{#if data.events.length === 0}
		<EmptyState
			title="No history yet"
			description="Send, receive, or delete messages from this queue to start recording events."
		/>
	{:else}
		<div class="console-surface overflow-hidden">
			<!-- Header -->
			<div class="flex items-center gap-3 border-b border-border/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
				<span class="w-20 shrink-0">Type</span>
				<span class="w-28 shrink-0">Message ID</span>
				<span class="min-w-0 flex-1">Body preview</span>
				<span class="w-44 shrink-0 text-right">Time in queue</span>
				<span class="w-44 shrink-0 text-right">Recorded at</span>
			</div>
			<div class="divide-y divide-border/40 font-mono text-xs">
				{#each data.events as event}
					<div class="flex items-start gap-3 px-4 py-2 transition-colors hover:bg-muted/20">
						<span class="w-20 shrink-0 pt-px">
							<span class={tagClass[event.eventType]}>{event.eventType}</span>
						</span>
						<span class="w-28 shrink-0 truncate tabular-nums text-muted-foreground/70" title={event.messageId ?? ''}>
							{event.messageId ? event.messageId.slice(0, 8) + '…' : '—'}
						</span>
						<span class="min-w-0 flex-1 truncate text-foreground/80" title={event.bodyPreview ?? ''}>
							{event.bodyPreview ?? '—'}
						</span>
						<span class="w-44 shrink-0 text-right tabular-nums text-muted-foreground/70">
							{fmtQueueTime(event.queueTimeMs)}
						</span>
						<span class="w-44 shrink-0 text-right tabular-nums text-muted-foreground/60">
							{fmtTs(event.eventAtMs)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
