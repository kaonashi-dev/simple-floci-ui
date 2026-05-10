<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { formatBytes } from '$lib/utils/formatBytes';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Observability</p>
			<h1 class="mt-1.5 page-title">CloudWatch Logs</h1>
			<p class="mt-1 page-subtitle">{data.groups.length} log group{data.groups.length !== 1 ? 's' : ''}</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load log groups" hint={data.error} />
	{/if}

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
					{#each data.groups as group}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a
									href="/logs/{encodeURIComponent(group.name)}"
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
				</tbody>
			</table>
		</div>
	{/if}
</div>
