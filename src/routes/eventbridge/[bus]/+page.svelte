<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	let { data, form } = $props();
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

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if form?.success}
		<div class="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
			<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			{form.success}
		</div>
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
									<form method="POST" action="?/disableRule" use:enhance class="inline">
										<input type="hidden" name="ruleName" value={rule.name} />
										<Button type="submit" variant="ghost" size="sm" class="h-7 px-2 text-xs text-amber-600 hover:text-amber-600 hover:bg-amber-500/10">
											Disable
										</Button>
									</form>
								{:else}
									<form method="POST" action="?/enableRule" use:enhance class="inline">
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
