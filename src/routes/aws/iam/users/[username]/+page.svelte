<script lang="ts">
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/iam" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">IAM</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="text-muted-foreground">Users</span>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.username}</span>
		</nav>
		<h1 class="truncate page-title">{data.username}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load user details" hint={data.error} />
	{/if}

	{#if data.detail}
		<!-- Info card -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">User Info</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">ARN</p>
					<div class="mt-1 flex items-center gap-1">
						<code class="truncate font-mono text-xs text-foreground">{data.detail.arn}</code>
						<CopyButton text={data.detail.arn} />
					</div>
				</div>
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">User ID</p>
					<code class="mt-1 block font-mono text-xs text-foreground">{data.detail.userId}</code>
				</div>
				<div>
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Created</p>
					<code class="mt-1 block font-mono text-xs text-foreground">{formatDate(data.detail.createdDate)}</code>
				</div>
			</div>
		</div>

		<!-- Groups -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Groups</h2>
			{#if data.detail.groups.length === 0}
				<p class="text-sm text-muted-foreground">No groups</p>
			{:else}
				<div class="flex flex-wrap gap-1.5">
					{#each data.detail.groups as group}
						<span class="console-tag border-border bg-muted/30 text-muted-foreground">{group}</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Attached Policies -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Attached Policies</h2>
			{#if data.detail.attachedPolicies.length === 0}
				<EmptyState title="No attached policies" description="No managed policies are attached to this user." />
			{:else}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Policy Name</th>
								<th class="table-th">Policy ARN</th>
							</tr>
						</thead>
						<tbody>
							{#each data.detail.attachedPolicies as policy}
								<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
									<td class="px-4 py-3 font-medium">{policy.policyName}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-1">
											<code class="truncate font-mono text-xs text-muted-foreground">{policy.policyArn}</code>
											<CopyButton text={policy.policyArn} />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
