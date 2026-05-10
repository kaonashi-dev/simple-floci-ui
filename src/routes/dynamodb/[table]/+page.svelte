<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { formatBytes } from '$lib/utils/formatBytes';
	import type { DynamoItem } from '$lib/types/dynamodb';

	let { data, form } = $props();

	let items: DynamoItem[] = $state(data.scan?.items ?? []);
	let lastEvaluatedKey = $state(data.scan?.lastEvaluatedKey);

	$effect(() => {
		if (form?.action === 'loadMore' && form.scan) {
			items = [...items, ...(form.scan.items as DynamoItem[])];
			lastEvaluatedKey = form.scan.lastEvaluatedKey;
		}
	});

	const allKeys = $derived([...new Set(items.flatMap(i => Object.keys(i)))].sort());

	function truncate(v: unknown): string {
		const s = String(JSON.stringify(v) ?? '');
		return s.length > 60 ? s.slice(0, 60) + '…' : s;
	}

	function statusClass(status?: string) {
		if (status === 'ACTIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
		if (status === 'CREATING') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
		if (status === 'DELETING') return 'border-destructive/30 bg-destructive/10 text-destructive';
		return 'border-border bg-muted/30 text-muted-foreground';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/dynamodb" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">DynamoDB</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
			</svg>
			<span class="truncate font-medium text-foreground">{data.name}</span>
		</nav>
		<h1 class="truncate page-title">{data.name}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load table" hint={data.error} />
	{/if}

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if data.detail}
		<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Status</p>
				<div class="mt-1">
					{#if data.detail.status}
						<span class="console-tag {statusClass(data.detail.status)}">{data.detail.status}</span>
					{:else}
						<p class="font-mono text-sm text-foreground">—</p>
					{/if}
				</div>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Items</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.detail.itemCount != null ? data.detail.itemCount.toLocaleString() : '—'}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Size</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.detail.sizeBytes != null ? formatBytes(data.detail.sizeBytes) : '—'}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Billing Mode</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.detail.billingMode ?? '—'}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Created</p>
				<p class="mt-1 font-mono text-sm text-foreground">{formatDate(data.detail.creationDate)}</p>
			</div>
			<div class="console-surface p-3 col-span-2">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">ARN</p>
				<div class="mt-1 flex items-center gap-1.5">
					<code class="truncate font-mono text-xs text-foreground">{data.detail.arn ?? '—'}</code>
					{#if data.detail.arn}
						<CopyButton text={data.detail.arn} />
					{/if}
				</div>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">GSIs</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.detail.gsis.length}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">LSIs</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.detail.lsis.length}</p>
			</div>
		</div>

		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Key Schema</h2>
			<div class="console-table-shell">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">Attribute Name</th>
							<th class="table-th">Key Type</th>
						</tr>
					</thead>
					<tbody>
						{#each data.detail.keySchema as key}
							<tr class="border-b border-border/40 last:border-0">
								<td class="px-4 py-2 font-mono text-xs text-foreground">{key.attributeName}</td>
								<td class="px-4 py-2 font-mono text-xs text-muted-foreground">{key.keyType}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		{#if data.detail.gsis.length > 0}
			<div class="space-y-3">
				<h2 class="text-sm font-semibold">Global Secondary Indexes</h2>
				<div class="space-y-2">
					{#each data.detail.gsis as gsi}
						<div class="console-surface p-3 space-y-2">
							<div class="flex items-center gap-2">
								<code class="font-mono text-xs font-medium text-foreground">{gsi.name}</code>
								{#if gsi.projection}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">{gsi.projection}</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								{#each gsi.keySchema as k}
									<span class="text-xs text-muted-foreground">
										<span class="font-mono text-foreground/80">{k.attributeName}</span>
										<span class="ml-1 text-muted-foreground/60">({k.keyType})</span>
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if data.detail.lsis.length > 0}
			<div class="space-y-3">
				<h2 class="text-sm font-semibold">Local Secondary Indexes</h2>
				<div class="space-y-2">
					{#each data.detail.lsis as lsi}
						<div class="console-surface p-3 space-y-2">
							<div class="flex items-center gap-2">
								<code class="font-mono text-xs font-medium text-foreground">{lsi.name}</code>
								{#if lsi.projection}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">{lsi.projection}</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								{#each lsi.keySchema as k}
									<span class="text-xs text-muted-foreground">
										<span class="font-mono text-foreground/80">{k.attributeName}</span>
										<span class="ml-1 text-muted-foreground/60">({k.keyType})</span>
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<div class="space-y-3">
		<div class="page-header">
			<div>
				<h2 class="text-sm font-semibold">Items</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					Showing {items.length} item{items.length !== 1 ? 's' : ''} (scan, up to 50 per page)
				</p>
			</div>
		</div>

		{#if items.length === 0}
			<p class="console-surface px-4 py-8 text-center text-sm text-muted-foreground">
				No items found in this table.
			</p>
		{:else}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							{#each allKeys as key}
								<th class="table-th whitespace-nowrap">{key}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								{#each allKeys as key}
									<td class="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap" title={JSON.stringify(item[key])}>
										{item[key] !== undefined ? truncate(item[key]) : ''}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if lastEvaluatedKey}
				<form
					method="POST"
					action="?/loadMore"
					use:enhance
				>
					<input type="hidden" name="lastKey" value={JSON.stringify(lastEvaluatedKey)} />
					<Button type="submit" variant="outline" size="sm">Load More</Button>
				</form>
			{/if}
		{/if}
	</div>
</div>
