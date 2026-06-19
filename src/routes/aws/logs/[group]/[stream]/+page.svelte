<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/logs" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">Logs</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<a
				href="/aws/logs/{encodeURIComponent(data.groupName)}"
				class="rounded px-1.5 py-1 font-mono text-[11px] transition-colors hover:bg-muted hover:text-foreground truncate max-w-[200px]"
			>
				{data.groupName}
			</a>
			<svg class="h-3 w-3 shrink-0 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-mono text-[11px] font-medium text-foreground">{data.streamName}</span>
		</nav>
		<h1 class="truncate page-title font-mono text-base">{data.streamName}</h1>
		<p class="mt-1 page-subtitle">{data.events.length} event{data.events.length !== 1 ? 's' : ''}</p>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load log events" hint={data.error} />
	{/if}

	{#if data.events.length === 0 && !data.error}
		<EmptyState title="No events" description="This log stream has no events." />
	{:else}
		<div class="console-surface divide-y divide-border/40 font-mono text-xs">
			{#each data.events as event}
				<div class="flex gap-3 px-4 py-2 hover:bg-muted/20 transition-colors">
					<span class="shrink-0 tabular-nums text-muted-foreground/60 w-40">{event.timestamp ? formatDate(event.timestamp) : '—'}</span>
					<span class="break-all text-foreground/80">{event.message}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
