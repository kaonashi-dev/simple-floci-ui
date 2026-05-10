<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	type Tab = 'users' | 'roles' | 'policies';
	let activeTab: Tab = $state('users');
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Security</p>
			<h1 class="mt-1.5 page-title">IAM</h1>
			<p class="mt-1 page-subtitle">
				{data.users.length} user{data.users.length !== 1 ? 's' : ''},
				{data.roles.length} role{data.roles.length !== 1 ? 's' : ''},
				{data.policies.length} {data.policies.length !== 1 ? 'policies' : 'policy'}
			</p>
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

	<!-- Tab bar -->
	<div class="flex gap-1 border-b border-border">
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

	<!-- Users tab -->
	{#if activeTab === 'users'}
		{#if data.users.length === 0 && !data.error}
			<EmptyState title="No users" description="No IAM users found in this account." />
		{:else if data.users.length > 0}
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
						{#each data.users as user}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<a href="/iam/users/{encodeURIComponent(user.username)}" class="font-medium text-foreground transition-colors hover:text-primary">
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
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Roles tab -->
	{#if activeTab === 'roles'}
		{#if data.roles.length === 0 && !data.error}
			<EmptyState title="No roles" description="No IAM roles found in this account." />
		{:else if data.roles.length > 0}
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
						{#each data.roles as role}
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
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Policies tab -->
	{#if activeTab === 'policies'}
		{#if data.policies.length === 0 && !data.error}
			<EmptyState title="No local policies" description="No customer-managed IAM policies found." />
		{:else if data.policies.length > 0}
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
						{#each data.policies as policy}
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
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>
