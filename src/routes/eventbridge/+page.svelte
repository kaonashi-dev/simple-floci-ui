<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Integration</p>
			<h1 class="mt-1.5 page-title">EventBridge</h1>
			<p class="mt-1 page-subtitle">{data.buses.length} event bus{data.buses.length !== 1 ? 'es' : ''}</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load event buses" hint={data.error} />
	{/if}

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
					{#each data.buses as bus}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a
									href="/eventbridge/{encodeURIComponent(bus.name)}"
									class="font-medium text-foreground hover:text-primary transition-colors {bus.name === 'default' ? 'font-semibold' : ''}"
								>
									{bus.name}
								</a>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<code class="truncate font-mono text-xs text-muted-foreground max-w-md">{bus.arn}</code>
									<CopyButton text={bus.arn} />
								</div>
							</td>
							<td class="px-4 py-3 text-right">
								<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/eventbridge/{encodeURIComponent(bus.name)}">
									Open
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
