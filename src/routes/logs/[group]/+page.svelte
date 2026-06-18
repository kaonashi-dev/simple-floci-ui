<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { filterLogEvents } from '$lib/floci/logs';
	import { formatDate } from '$lib/utils/formatDate';
	import { formatBytes } from '$lib/utils/formatBytes';
	import type { LogEvent } from '$lib/types/logs';

	let { data } = $props();

	let filteredEvents: LogEvent[] = $state([]);
	let hasFiltered = $state(false);

	async function handleFilter(fd: FormData) {
		const pattern = (fd.get('pattern') as string)?.trim() || '';
		const events = await filterLogEvents(data.groupName, pattern);
		return { events };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/logs" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">Logs</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground font-mono text-[11px]">{data.groupName}</span>
		</nav>
		<h1 class="truncate page-title font-mono">{data.groupName}</h1>
		<p class="mt-1 page-subtitle">{data.streams.length} stream{data.streams.length !== 1 ? 's' : ''}</p>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load log streams" hint={data.error} />
	{/if}

	<!-- Filter bar -->
	<form
		method="POST"
		use:enhance={clientAction(handleFilter, {
			onSuccess: (d) => {
				filteredEvents = d.events as LogEvent[];
				hasFiltered = true;
			}
		})}
		class="console-panel flex gap-2 p-3 items-end"
	>
		<div class="flex-1 space-y-1.5">
			<label for="filter-pattern" class="text-xs text-muted-foreground">Filter pattern</label>
			<Input id="filter-pattern" name="pattern" placeholder={"ERROR or { $.level = \"error\" }"} class="h-8 text-sm font-mono" />
		</div>
		<Button type="submit" size="sm">Search</Button>
	</form>

	<!-- Filtered events -->
	{#if filteredEvents.length > 0}
		<div class="space-y-1.5">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Filter Results ({filteredEvents.length})</h2>
			<div class="console-surface divide-y divide-border/40 font-mono text-xs">
				{#each filteredEvents as event}
					<div class="flex gap-3 px-4 py-2">
						<span class="shrink-0 tabular-nums text-muted-foreground/60">{event.timestamp ? formatDate(event.timestamp) : '—'}</span>
						<span class="break-all text-foreground/80">{event.message}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else if hasFiltered}
		<p class="text-sm text-muted-foreground">No events matched the filter.</p>
	{/if}

	<div class="h-px bg-border"></div>

	<!-- Streams table -->
	{#if data.streams.length === 0 && !data.error}
		<EmptyState title="No log streams" description="This log group has no streams yet." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Stream Name</th>
						<th class="table-th-right w-36">Last Event</th>
						<th class="table-th-right w-24">Size</th>
						<th class="table-th-right w-36">Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.streams as stream}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a
									href="/logs/{encodeURIComponent(data.groupName)}/{encodeURIComponent(stream.name)}"
									class="font-mono text-xs text-foreground hover:text-primary transition-colors"
								>
									{stream.name}
								</a>
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{formatDate(stream.lastEventTime)}</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{stream.storedBytes != null ? formatBytes(stream.storedBytes) : '—'}
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{formatDate(stream.creationTime)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
