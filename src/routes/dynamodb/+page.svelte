<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { deleteTable } from '$lib/floci/dynamodb';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();
	let confirmDelete: string | null = $state(null);
	let search = $state('');

	async function handleDelete(fd: FormData) {
		const name = fd.get('name') as string;
		if (!name) throw new Error('Table name is required');
		await deleteTable(name);
		return { success: `Table "${name}" deleted` };
	}

	const filtered = $derived(
		data.tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
	);

	function statusClass(status?: string) {
		if (status === 'ACTIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
		if (status === 'CREATING') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
		if (status === 'DELETING') return 'border-destructive/30 bg-destructive/10 text-destructive';
		return 'border-border bg-muted/30 text-muted-foreground';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Database</p>
			<h1 class="mt-1.5 page-title">DynamoDB Tables</h1>
			<p class="mt-1 page-subtitle">Browse tables and scan items.</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load tables" hint={data.error} />
	{/if}

	<ListToolbar bind:search placeholder="Filter tables…" total={data.tables.length} shown={filtered.length} unit="table" />

	{#if data.tables.length === 0 && !data.error}
		<EmptyState title="No tables" description="No DynamoDB tables found in this region." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Name</th>
						<th class="table-th w-28">Status</th>
						<th class="table-th-right w-28">Items</th>
						<th class="table-th w-44">Created</th>
						<th class="table-th w-36">Billing</th>
						<th class="table-th-right w-28">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as table}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/dynamodb/{encodeURIComponent(table.name)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{table.name}
								</a>
							</td>
							<td class="px-4 py-3">
								{#if table.enrichmentError}
									<span title={table.enrichmentError} class="console-tag border-amber-300/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">partial</span>
								{:else if table.status}
									<span class="console-tag {statusClass(table.status)}">{table.status}</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{table.itemCount != null ? table.itemCount.toLocaleString() : '—'}
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
								{formatDate(table.creationDate)}
							</td>
							<td class="px-4 py-3 text-xs text-muted-foreground">
								{table.billingMode ?? '—'}
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/dynamodb/{encodeURIComponent(table.name)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDelete = table.name)}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.tables.length > 0}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No tables match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDelete} onOpenChange={(o) => { if (!o) confirmDelete = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete table</Dialog.Title>
			<Dialog.Description>
				This will permanently delete <strong>{confirmDelete}</strong> and all its data.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDelete = null)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => (confirmDelete = null)
				})}
			>
				<input type="hidden" name="name" value={confirmDelete} />
				<Button type="submit" variant="destructive">Delete Table</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
