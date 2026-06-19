<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	type Tab = 'users' | 'roles' | 'policies';
	let activeTab: Tab = $state('users');
	let search = $state('');

	const users = $derived(data.users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase())));
	const roles = $derived(data.roles.filter((r) => `${r.roleName} ${r.description ?? ''}`.toLowerCase().includes(search.toLowerCase())));
	const policies = $derived(data.policies.filter((p) => p.policyName.toLowerCase().includes(search.toLowerCase())));
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Security</p>
			<h1 class="mt-1.5 page-title">IAM</h1>
			<p class="mt-1 page-subtitle">Browse users, roles, and local policies.</p>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load IAM data" hint={data.error} />
	{/if}

	{#if data.identity}
		<div class="console-surface p-3">
			<p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Caller Identity</p>
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<div>
					<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Account ID</p>
					<p class="mt-0.5 font-mono text-xs text-foreground">{data.identity.accountId}</p>
				</div>
				<div>
					<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">User ID</p>
					<p class="mt-0.5 font-mono text-xs text-foreground">{data.identity.userId}</p>
				</div>
				<div>
					<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">ARN</p>
					<div class="mt-0.5 flex items-center gap-1">
						<code class="truncate font-mono text-xs text-foreground">{data.identity.arn}</code>
						<CopyButton text={data.identity.arn} />
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Tab bar + search -->
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex gap-1 border-b border-border sm:border-0">
			{#each [
				{ id: 'users', label: 'Users', count: data.users.length },
				{ id: 'roles', label: 'Roles', count: data.roles.length },
				{ id: 'policies', label: 'Policies', count: data.policies.length }
			] as tab}
				<button
					type="button"
					onclick={() => (activeTab = tab.id as Tab)}
					class="px-3 py-2 text-sm font-medium transition-colors {activeTab === tab.id ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}"
				>
					{tab.label}
					<span class="ml-1.5 font-mono text-[10px] {activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}">{tab.count}</span>
				</button>
			{/each}
		</div>
		<div class="relative">
			<SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
			<input
				bind:value={search}
				placeholder="Filter {activeTab}…"
				class="h-8 w-56 rounded border border-border bg-muted/30 pl-8 pr-7 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
			/>
			{#if search}
				<button
					type="button"
					aria-label="Clear search"
					class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
					onclick={() => (search = '')}
				>
					<XIcon class="size-3.5" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Users tab -->
	{#if activeTab === 'users'}
		{#if data.users.length === 0 && !data.error}
			<EmptyState title="No users" description="No IAM users found in this account." />
		{:else}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full min-w-[700px] text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">Username</th>
							<th class="table-th">ARN</th>
							<th class="table-th">User ID</th>
							<th class="table-th">Created</th>
						</tr>
					</thead>
					<tbody>
						{#each users as user}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<a href="/aws/iam/users/{encodeURIComponent(user.username)}" class="font-medium text-foreground transition-colors hover:text-primary">
										{user.username}
									</a>
								</td>
								<td class="px-4 py-3">
									<div class="flex max-w-xs items-center gap-1">
										<code class="truncate font-mono text-xs text-muted-foreground">{user.arn}</code>
										<CopyButton text={user.arn} />
									</div>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{user.userId}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.createdDate)}</td>
							</tr>
						{/each}
						{#if users.length === 0 && data.users.length > 0}
							<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground/60">No users match "{search}"</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Roles tab -->
	{#if activeTab === 'roles'}
		{#if data.roles.length === 0 && !data.error}
			<EmptyState title="No roles" description="No IAM roles found in this account." />
		{:else}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full min-w-[700px] text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">Role Name</th>
							<th class="table-th">ARN</th>
							<th class="table-th">Role ID</th>
							<th class="table-th">Description</th>
							<th class="table-th">Created</th>
						</tr>
					</thead>
					<tbody>
						{#each roles as role}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3 font-medium">{role.roleName}</td>
								<td class="px-4 py-3">
									<div class="flex max-w-xs items-center gap-1">
										<code class="truncate font-mono text-xs text-muted-foreground">{role.arn}</code>
										<CopyButton text={role.arn} />
									</div>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{role.roleId}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{role.description ?? '—'}</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{formatDate(role.createdDate)}</td>
							</tr>
						{/each}
						{#if roles.length === 0 && data.roles.length > 0}
							<tr><td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/60">No roles match "{search}"</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Policies tab -->
	{#if activeTab === 'policies'}
		{#if data.policies.length === 0 && !data.error}
			<EmptyState title="No local policies" description="No customer-managed IAM policies found." />
		{:else}
			<div class="console-table-shell overflow-x-auto">
				<table class="w-full min-w-[600px] text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th">Policy Name</th>
							<th class="table-th">ARN</th>
							<th class="table-th">Policy ID</th>
							<th class="table-th-right w-28">Attachments</th>
						</tr>
					</thead>
					<tbody>
						{#each policies as policy}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3 font-medium">{policy.policyName}</td>
								<td class="px-4 py-3">
									<div class="flex max-w-xs items-center gap-1">
										<code class="truncate font-mono text-xs text-muted-foreground">{policy.arn}</code>
										<CopyButton text={policy.arn} />
									</div>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{policy.policyId}</td>
								<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
									{policy.attachmentCount ?? 0}
								</td>
							</tr>
						{/each}
						{#if policies.length === 0 && data.policies.length > 0}
							<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground/60">No policies match "{search}"</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>
