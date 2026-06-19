<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import JsonViewer from '$lib/components/JsonViewer.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { formatBytes } from '$lib/utils/formatBytes';
	import { clientAction } from '$lib/utils/clientAction';
	import { scanTable } from '$lib/floci/dynamodb';
	import { untrack } from 'svelte';
	import type { DynamoItem } from '$lib/types/dynamodb';

	let { data } = $props();

	let items: DynamoItem[] = $state([]);
	let lastEvaluatedKey: Record<string, unknown> | undefined = $state(undefined);
	let scannedCount = $state(0);
	let inspectedItem: DynamoItem | null = $state(null);

	let limit = $state(untrack(() => data.limit));
	let indexName = $state(untrack(() => data.indexName ?? ''));
	let filterAttr = $state(untrack(() => data.filterAttr ?? ''));
	let filterValue = $state(untrack(() => data.filterValue ?? ''));

	$effect(() => {
		limit = data.limit;
		indexName = data.indexName ?? '';
		filterAttr = data.filterAttr ?? '';
		filterValue = data.filterValue ?? '';
	});

	$effect(() => {
		items = data.scan?.items ?? [];
		lastEvaluatedKey = data.scan?.lastEvaluatedKey;
		scannedCount = data.scan?.scannedCount ?? 0;
	});

	function num(v: FormDataEntryValue | null): number | undefined {
		if (v == null || v === '') return undefined;
		const n = Number(v);
		return Number.isFinite(n) ? n : undefined;
	}

	async function handleLoadMore(fd: FormData) {
		const lastKeyRaw = fd.get('lastKey') as string;
		const lastKey = lastKeyRaw ? JSON.parse(lastKeyRaw) : undefined;
		const fa = (fd.get('fa') as string) || undefined;
		const fv = (fd.get('fv') as string) || undefined;
		const scan = await scanTable(data.name, {
			limit: num(fd.get('limit')) ?? 50,
			indexName: (fd.get('index') as string) || undefined,
			lastKey,
			filter: fa && fv ? { attribute: fa, value: fv } : undefined
		});
		return { scan };
	}

	const allKeys = $derived([...new Set(items.flatMap(i => Object.keys(i)))].sort());

	function truncate(v: unknown): string {
		const s = String(JSON.stringify(v) ?? '');
		return s.length > 60 ? s.slice(0, 60) + '…' : s;
	}

	function applyScan(e?: Event) {
		e?.preventDefault();
		const params = new URLSearchParams();
		if (limit && limit !== 50) params.set('limit', String(limit));
		if (indexName) params.set('index', indexName);
		if (filterAttr) params.set('fa', filterAttr);
		if (filterValue) params.set('fv', filterValue);
		const qs = params.toString();
		goto($page.url.pathname + (qs ? `?${qs}` : ''), { keepFocus: true, noScroll: true });
	}

	function resetScan() {
		limit = 50;
		indexName = '';
		filterAttr = '';
		filterValue = '';
		goto($page.url.pathname, { keepFocus: true, noScroll: true });
	}

	function statusClass(status?: string) {
		if (status === 'ACTIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
		if (status === 'CREATING') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
		if (status === 'DELETING') return 'border-destructive/30 bg-destructive/10 text-destructive';
		return 'border-border bg-muted/30 text-muted-foreground';
	}

	const gsiOptions = $derived(data.detail?.gsis.map((g) => g.name) ?? []);
	const filterActive = $derived(!!(data.filterAttr && data.filterValue));
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/dynamodb" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">DynamoDB</a>
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

	<!-- Scan controls -->
	<form onsubmit={applyScan} class="console-panel flex flex-wrap items-end gap-2 p-3">
		<div class="space-y-1">
			<Label for="scan-limit" class="text-[10px] uppercase text-muted-foreground/70">Page size</Label>
			<Input id="scan-limit" type="number" min="1" max="500" bind:value={limit} class="h-8 w-20 text-xs" />
		</div>
		<div class="space-y-1">
			<Label for="scan-index" class="text-[10px] uppercase text-muted-foreground/70">Index</Label>
			<select id="scan-index" bind:value={indexName} class="h-8 w-44 rounded border border-input bg-background px-2 text-xs">
				<option value="">(table)</option>
				{#each gsiOptions as g}
					<option value={g}>{g}</option>
				{/each}
			</select>
		</div>
		<div class="space-y-1">
			<Label for="scan-fa" class="text-[10px] uppercase text-muted-foreground/70">Attribute</Label>
			<Input id="scan-fa" bind:value={filterAttr} placeholder="attribute" class="h-8 w-36 text-xs font-mono" />
		</div>
		<div class="space-y-1">
			<Label for="scan-fv" class="text-[10px] uppercase text-muted-foreground/70">Contains</Label>
			<Input id="scan-fv" bind:value={filterValue} placeholder="substring" class="h-8 w-40 text-xs font-mono" />
		</div>
		<Button type="submit" size="sm">
			<FilterIcon class="size-3.5" /> Apply
		</Button>
		{#if filterActive || indexName || (data.limit && data.limit !== 50)}
			<Button type="button" variant="ghost" size="sm" onclick={resetScan}>Reset</Button>
		{/if}
	</form>

	<div class="space-y-3">
		<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="text-sm font-semibold">Items</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					Showing <span class="font-medium text-foreground">{items.length}</span> item{items.length !== 1 ? 's' : ''}
					{#if scannedCount > items.length}
						<span class="ml-1 text-muted-foreground/60">(scanned {scannedCount})</span>
					{/if}
					{#if data.indexName}
						<span class="ml-1">on index <code class="font-mono">{data.indexName}</code></span>
					{/if}
				</p>
			</div>
		</div>

		{#if items.length === 0}
			<p class="console-surface px-4 py-8 text-center text-sm text-muted-foreground">
				{filterActive ? 'No items match the current filter.' : 'No items found in this table.'}
			</p>
		{:else}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th w-10"></th>
							{#each allKeys as key}
								<th class="table-th whitespace-nowrap">{key}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-2 py-2">
									<button
										type="button"
										class="rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground"
										aria-label="View item JSON"
										onclick={() => (inspectedItem = item)}
									>
										<EyeIcon class="size-3.5" />
									</button>
								</td>
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
				<form method="POST" use:enhance={clientAction(handleLoadMore, {
					onSuccess: (d) => {
						const next = d.scan as { items: DynamoItem[]; lastEvaluatedKey?: Record<string, unknown>; scannedCount?: number };
						items = [...items, ...next.items];
						lastEvaluatedKey = next.lastEvaluatedKey;
						scannedCount = scannedCount + (next.scannedCount ?? 0);
					}
				})}>
					<input type="hidden" name="lastKey" value={JSON.stringify(lastEvaluatedKey)} />
					<input type="hidden" name="limit" value={limit} />
					<input type="hidden" name="index" value={indexName} />
					<input type="hidden" name="fa" value={filterAttr} />
					<input type="hidden" name="fv" value={filterValue} />
					<Button type="submit" variant="outline" size="sm">Load More</Button>
				</form>
			{/if}
		{/if}
	</div>
</div>

<Dialog.Root open={!!inspectedItem} onOpenChange={(o) => { if (!o) inspectedItem = null; }}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Item</Dialog.Title>
		</Dialog.Header>
		<div class="max-h-[60vh] overflow-y-auto px-1">
			{#if inspectedItem}
				<JsonViewer value={inspectedItem} />
			{/if}
		</div>
		<Dialog.Footer>
			{#if inspectedItem}
				<CopyButton text={JSON.stringify(inspectedItem, null, 2)} label="JSON" />
			{/if}
			<Button variant="outline" onclick={() => (inspectedItem = null)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
