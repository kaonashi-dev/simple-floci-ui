<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { enableRule, disableRule } from '$lib/floci/eventbridge';

	let { data } = $props();

	async function handleEnable(fd: FormData) {
		const ruleName = fd.get('ruleName') as string;
		if (!ruleName) throw new Error('Rule name required');
		await enableRule(ruleName, data.busName);
		return { success: `Rule ${ruleName} enabled` };
	}

	async function handleDisable(fd: FormData) {
		const ruleName = fd.get('ruleName') as string;
		if (!ruleName) throw new Error('Rule name required');
		await disableRule(ruleName, data.busName);
		return { success: `Rule ${ruleName} disabled` };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/eventbridge" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">EventBridge</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.busName}</span>
		</nav>
		<h1 class="truncate page-title">{data.busName}</h1>
		<p class="mt-1 page-subtitle">{data.rules.length} rule{data.rules.length !== 1 ? 's' : ''}</p>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load rules" hint={data.error} />
	{/if}

	{#if data.rules.length === 0 && !data.error}
		<EmptyState title="No rules" description="This event bus has no rules configured." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Rule Name</th>
						<th class="table-th w-24">State</th>
						<th class="table-th">Schedule / Pattern</th>
						<th class="table-th">Description</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.rules as rule}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3 font-medium">{rule.name}</td>
							<td class="px-4 py-3">
								{#if rule.state === 'ENABLED'}
									<span class="console-tag border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Enabled</span>
								{:else}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">Disabled</span>
								{/if}
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
								{rule.scheduleExpression ?? (rule.eventPattern ? 'Event Pattern' : '—')}
							</td>
							<td class="px-4 py-3 text-sm text-muted-foreground">{rule.description ?? '—'}</td>
							<td class="px-4 py-3 text-right">
								{#if rule.state === 'ENABLED'}
									<form method="POST" use:enhance={clientAction(handleDisable, { onSuccess: () => invalidateAll() })} class="inline">
										<input type="hidden" name="ruleName" value={rule.name} />
										<Button type="submit" variant="ghost" size="sm" class="h-7 px-2 text-xs text-amber-600 hover:text-amber-600 hover:bg-amber-500/10">
											Disable
										</Button>
									</form>
								{:else}
									<form method="POST" use:enhance={clientAction(handleEnable, { onSuccess: () => invalidateAll() })} class="inline">
										<input type="hidden" name="ruleName" value={rule.name} />
										<Button type="submit" variant="ghost" size="sm" class="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10">
											Enable
										</Button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
