<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/apigateway" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">API Gateway</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="text-muted-foreground">HTTP</span>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.id}</span>
		</nav>
		<h1 class="truncate page-title font-mono">{data.id}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load HTTP API details" hint={data.error} />
	{/if}

	{#if data.routes.length === 0 && !data.error}
		<EmptyState title="No routes" description="No routes configured for this HTTP API." />
	{:else if data.routes.length > 0}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Route Key</th>
						<th class="table-th">Target</th>
						<th class="table-th">Route ID</th>
					</tr>
				</thead>
				<tbody>
					{#each data.routes as route}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<span class="font-mono text-xs font-bold text-foreground">{route.routeKey}</span>
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{route.target ?? '—'}</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1">
									<span class="font-mono text-xs text-muted-foreground">{route.routeId}</span>
									<CopyButton text={route.routeId} />
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
