<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Networking</p>
			<h1 class="mt-1.5 page-title">API Gateway</h1>
			<p class="mt-1 page-subtitle">{data.restApis.length} REST, {data.httpApis.length} HTTP</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load APIs" hint={data.error} />
	{/if}

	<!-- REST APIs -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold text-foreground">REST APIs</h2>
		{#if data.restApis.length === 0 && !data.error}
			<EmptyState title="No REST APIs" description="Deploy a REST API to see it here." />
		{:else if data.restApis.length > 0}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">ID</th>
							<th class="table-th">Name</th>
							<th class="table-th">Endpoint Type</th>
							<th class="table-th">Created</th>
							<th class="table-th-right w-24">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.restApis as api}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<div class="flex items-center gap-1">
										<code class="font-mono text-xs text-muted-foreground">{api.id}</code>
										<CopyButton text={api.id} />
									</div>
								</td>
								<td class="px-4 py-3 font-medium">{api.name}</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{api.endpointType ?? '—'}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(api.createdDate)}</td>
								<td class="px-4 py-3 text-right">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/apigateway/rest/{encodeURIComponent(api.id)}">
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

	<!-- HTTP APIs -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold text-foreground">HTTP APIs</h2>
		{#if data.httpApis.length === 0 && !data.error}
			<EmptyState title="No HTTP APIs" description="Deploy an HTTP API to see it here." />
		{:else if data.httpApis.length > 0}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">ID</th>
							<th class="table-th">Name</th>
							<th class="table-th">Protocol</th>
							<th class="table-th">API Endpoint</th>
							<th class="table-th">Created</th>
							<th class="table-th-right w-24">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.httpApis as api}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<div class="flex items-center gap-1">
										<code class="font-mono text-xs text-muted-foreground">{api.id}</code>
										<CopyButton text={api.id} />
									</div>
								</td>
								<td class="px-4 py-3 font-medium">{api.name}</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{api.protocolType ?? '—'}</td>
								<td class="px-4 py-3">
									{#if api.apiEndpoint}
										<div class="flex max-w-xs items-center gap-1">
											<span class="truncate font-mono text-xs text-muted-foreground">{api.apiEndpoint}</span>
											<CopyButton text={api.apiEndpoint} />
										</div>
									{:else}
										<span class="text-muted-foreground/50">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(api.createdDate)}</td>
								<td class="px-4 py-3 text-right">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/apigateway/http/{encodeURIComponent(api.id)}">
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
</div>
