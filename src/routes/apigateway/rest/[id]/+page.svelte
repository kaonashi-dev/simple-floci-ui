<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	function methodClass(method: string) {
		if (method === 'GET') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
		if (method === 'POST') return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
		if (method === 'PUT') return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400';
		if (method === 'DELETE') return 'border-destructive/30 bg-destructive/10 text-destructive';
		return 'border-border bg-muted/30 text-muted-foreground';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/apigateway" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">API Gateway</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="text-muted-foreground">REST</span>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.id}</span>
		</nav>
		<h1 class="truncate page-title font-mono">{data.id}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load REST API details" hint={data.error} />
	{/if}

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Resources -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Resources</h2>
			{#if data.resources.length === 0}
				<EmptyState title="No resources" description="No resources found for this API." />
			{:else}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Path</th>
								<th class="table-th">Methods</th>
								<th class="table-th">Resource ID</th>
							</tr>
						</thead>
						<tbody>
							{#each data.resources as resource}
								<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
									<td class="px-4 py-3 font-mono text-xs font-medium">{resource.path}</td>
									<td class="px-4 py-3">
										{#if resource.methods.length > 0}
											<div class="flex flex-wrap gap-1">
												{#each resource.methods as method}
													<span class="console-tag {methodClass(method)}">{method}</span>
												{/each}
											</div>
										{:else}
											<span class="text-muted-foreground/50">—</span>
										{/if}
									</td>
									<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{resource.id}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Stages -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Stages</h2>
			{#if data.stages.length === 0}
				<EmptyState title="No stages" description="No stages deployed for this API." />
			{:else}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Stage Name</th>
								<th class="table-th">Deployment ID</th>
								<th class="table-th">Last Updated</th>
							</tr>
						</thead>
						<tbody>
							{#each data.stages as stage}
								<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
									<td class="px-4 py-3 font-medium">{stage.name}</td>
									<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{stage.deploymentId ?? '—'}</td>
									<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(stage.lastUpdatedDate)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
