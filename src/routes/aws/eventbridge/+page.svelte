<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';

	let { data } = $props();
	let search = $state('');

	const filtered = $derived(
		data.buses.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
	);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Integration</p>
			<h1 class="mt-1.5 page-title">EventBridge</h1>
			<p class="mt-1 page-subtitle">Manage event buses, rules, and targets.</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load event buses" hint={data.error} />
	{/if}

	<ListToolbar bind:search placeholder="Filter buses…" total={data.buses.length} shown={filtered.length} unit="bus" />

	{#if data.buses.length === 0 && !data.error}
		<EmptyState title="No event buses" description="No EventBridge buses found." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Bus Name</th>
						<th class="table-th">ARN</th>
						<th class="table-th-right w-24">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as bus}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a
									href="/aws/eventbridge/{encodeURIComponent(bus.name)}"
									class="font-medium text-foreground hover:text-primary transition-colors {bus.name === 'default' ? 'font-semibold' : ''}"
								>
									{bus.name}
								</a>
								{#if bus.name === 'default'}
									<span class="ml-2 console-tag border-primary/30 bg-primary/10 text-primary">default</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<code class="truncate font-mono text-xs text-muted-foreground max-w-md">{bus.arn}</code>
									<CopyButton text={bus.arn} />
								</div>
							</td>
							<td class="px-4 py-3 text-right">
								<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/eventbridge/{encodeURIComponent(bus.name)}">
									Open
								</Button>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.buses.length > 0}
						<tr>
							<td colspan="3" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No buses match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
