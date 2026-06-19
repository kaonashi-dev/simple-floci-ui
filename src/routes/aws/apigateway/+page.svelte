<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();
	let search = $state('');
	let kindFilter = $state<'all' | 'rest' | 'http'>('all');

	const restApis = $derived(
		(kindFilter === 'http' ? [] : data.restApis).filter((a) =>
			`${a.id} ${a.name}`.toLowerCase().includes(search.toLowerCase())
		)
	);
	const httpApis = $derived(
		(kindFilter === 'rest' ? [] : data.httpApis).filter((a) =>
			`${a.id} ${a.name}`.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Networking</p>
			<h1 class="mt-1.5 page-title">API Gateway</h1>
			<p class="mt-1 page-subtitle">Inspect REST and HTTP APIs and their routes.</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load APIs" hint={data.error} />
	{/if}

	<div class="console-action-row">
		<p class="text-xs text-muted-foreground">
			<span class="font-medium text-foreground">{data.restApis.length}</span> REST,
			<span class="font-medium text-foreground">{data.httpApis.length}</span> HTTP
		</p>
		<div class="flex items-center gap-2">
			<div class="relative">
				<SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
				<input
					bind:value={search}
					placeholder="Filter APIs…"
					class="h-8 w-56 rounded border border-border bg-muted/30 pl-8 pr-7 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
				/>
				{#if search}
					<button type="button" aria-label="Clear search" class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground" onclick={() => (search = '')}>
						<XIcon class="size-3.5" />
					</button>
				{/if}
			</div>
			<select bind:value={kindFilter} class="h-8 rounded border border-border bg-muted/30 px-2 text-xs">
				<option value="all">All types</option>
				<option value="rest">REST only</option>
				<option value="http">HTTP only</option>
			</select>
		</div>
	</div>

	<!-- REST APIs -->
	{#if kindFilter !== 'http'}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold text-foreground">REST APIs <span class="ml-1 font-mono text-[10px] text-muted-foreground">{restApis.length}</span></h2>
			{#if data.restApis.length === 0 && !data.error}
				<EmptyState title="No REST APIs" description="Deploy a REST API to see it here." />
			{:else if restApis.length > 0}
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
							{#each restApis as api}
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
										<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/apigateway/rest/{encodeURIComponent(api.id)}">
											Open
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="console-surface px-4 py-6 text-center text-xs text-muted-foreground/60">No REST APIs match "{search}"</p>
			{/if}
		</div>
	{/if}

	<!-- HTTP APIs -->
	{#if kindFilter !== 'rest'}
		<div class="space-y-3">
			<h2 class="text-sm font-semibold text-foreground">HTTP APIs <span class="ml-1 font-mono text-[10px] text-muted-foreground">{httpApis.length}</span></h2>
			{#if data.httpApis.length === 0 && !data.error}
				<EmptyState title="No HTTP APIs" description="Deploy an HTTP API to see it here." />
			{:else if httpApis.length > 0}
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
							{#each httpApis as api}
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
										<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/apigateway/http/{encodeURIComponent(api.id)}">
											Open
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="console-surface px-4 py-6 text-center text-xs text-muted-foreground/60">No HTTP APIs match "{search}"</p>
			{/if}
		</div>
	{/if}
</div>
