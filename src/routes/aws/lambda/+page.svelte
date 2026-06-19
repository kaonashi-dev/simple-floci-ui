<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	let search = $state('');
	let runtimeFilter = $state<string>('all');

	const runtimes = $derived(
		Array.from(new Set(data.functions.map((f) => f.runtime).filter(Boolean) as string[])).sort()
	);

	const filtered = $derived(
		data.functions.filter((f) => {
			const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
			const matchesRuntime = runtimeFilter === 'all' || f.runtime === runtimeFilter;
			return matchesSearch && matchesRuntime;
		})
	);

	function stateClass(state?: string) {
		if (state === 'Active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
		if (state === 'Inactive') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
		return 'border-border bg-muted/30 text-muted-foreground';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Compute</p>
			<h1 class="mt-1.5 page-title">Lambda Functions</h1>
			<p class="mt-1 page-subtitle">List and invoke local Lambda functions.</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load functions" hint={data.error} />
	{/if}

	<ListToolbar bind:search placeholder="Filter functions…" total={data.functions.length} shown={filtered.length} unit="function">
		{#snippet children()}
			<select
				bind:value={runtimeFilter}
				class="h-8 rounded border border-border bg-muted/30 px-2 text-xs"
				title="Filter by runtime"
			>
				<option value="all">All runtimes</option>
				{#each runtimes as r}
					<option value={r}>{r}</option>
				{/each}
			</select>
		{/snippet}
	</ListToolbar>

	{#if data.functions.length === 0 && !data.error}
		<EmptyState title="No functions" description="Deploy a Lambda function to see it here." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Function Name</th>
						<th class="table-th">Runtime</th>
						<th class="table-th-right w-24">Memory</th>
						<th class="table-th-right w-24">Timeout</th>
						<th class="table-th-right w-28">State</th>
						<th class="table-th-right w-24">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as fn}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<a href="/aws/lambda/{encodeURIComponent(fn.name)}" class="font-medium text-foreground hover:text-primary transition-colors">
										{fn.name}
									</a>
									<CopyButton text={fn.arn} label="ARN" />
								</div>
								{#if fn.description}
									<p class="mt-0.5 text-xs text-muted-foreground">{fn.description}</p>
								{/if}
							</td>
							<td class="px-4 py-3">
								<span class="font-mono text-xs text-muted-foreground">{fn.runtime ?? '—'}</span>
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{fn.memorySizeMb != null ? `${fn.memorySizeMb} MB` : '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{fn.timeoutSec != null ? `${fn.timeoutSec}s` : '—'}
							</td>
							<td class="px-4 py-3 text-right">
								{#if fn.state}
									<span class="console-tag {stateClass(fn.state)}">{fn.state}</span>
								{:else}
									<span class="text-muted-foreground/50">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/lambda/{encodeURIComponent(fn.name)}">
									Open
								</Button>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.functions.length > 0}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No functions match the current filter.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
