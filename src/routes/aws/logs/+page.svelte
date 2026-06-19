<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { formatBytes } from '$lib/utils/formatBytes';

	let { data } = $props();
	let search = $state('');

	const filtered = $derived(
		data.groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
	);

	const totalBytes = $derived(
		data.groups.reduce((sum, g) => sum + (g.storedBytes ?? 0), 0)
	);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Observability</p>
			<h1 class="mt-1.5 page-title">CloudWatch Logs</h1>
			<p class="mt-1 page-subtitle">Browse log groups, streams, and events.</p>
		</div>
		{#if totalBytes > 0}
			<div class="console-panel flex min-w-48 items-center gap-3 p-3">
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Total stored</p>
					<p class="mt-1 font-mono text-sm font-medium text-foreground">{formatBytes(totalBytes)}</p>
				</div>
			</div>
		{/if}
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load log groups" hint={data.error} />
	{/if}

	<ListToolbar bind:search placeholder="Filter log groups…" total={data.groups.length} shown={filtered.length} unit="log group" />

	{#if data.groups.length === 0 && !data.error}
		<EmptyState title="No log groups" description="Log groups will appear here when Lambda functions or services write logs." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Log Group</th>
						<th class="table-th-right w-28">Retention</th>
						<th class="table-th-right w-24">Size</th>
						<th class="table-th-right w-36">Created</th>
						<th class="table-th-right w-20">ARN</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as group}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a
									href="/aws/logs/{encodeURIComponent(group.name)}"
									class="font-mono text-xs text-foreground hover:text-primary transition-colors"
								>
									{group.name}
								</a>
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">
								{group.retentionDays != null ? `${group.retentionDays} days` : 'Never expires'}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{group.storedBytes != null ? formatBytes(group.storedBytes) : '—'}
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">
								{formatDate(group.creationTime)}
							</td>
							<td class="px-4 py-3 text-right">
								{#if group.arn}
									<CopyButton text={group.arn} label="ARN" />
								{/if}
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.groups.length > 0}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No log groups match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
