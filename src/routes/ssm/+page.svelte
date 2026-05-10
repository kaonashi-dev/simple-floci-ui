<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmDeleteName: string | null = $state(null);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Configuration</p>
			<h1 class="mt-1.5 page-title">SSM Parameter Store</h1>
			<p class="mt-1 page-subtitle">{data.parameters.length} parameter{data.parameters.length !== 1 ? 's' : ''}</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Parameter
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load parameters" hint={data.error} />
	{/if}

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createParameter"
			use:enhance={() => () => { showCreate = false; }}
			class="console-panel flex flex-col gap-3 p-4"
		>
			<h2 class="text-sm font-semibold">Create Parameter</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="param-name" class="text-xs">Name</Label>
					<Input id="param-name" name="name" placeholder="/my/parameter" required class="h-8 text-sm font-mono" />
				</div>
				<div class="space-y-1.5">
					<Label for="param-type" class="text-xs">Type</Label>
					<select id="param-type" name="type" class="h-8 w-full rounded border border-input bg-background px-2 text-sm">
						<option value="String">String</option>
						<option value="SecureString">SecureString</option>
						<option value="StringList">StringList</option>
					</select>
				</div>
			</div>
			<div class="space-y-1.5">
				<Label for="param-value" class="text-xs">Value</Label>
				<Textarea id="param-value" name="value" placeholder="Parameter value" required rows={3} class="resize-none font-mono text-xs" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	{#if data.parameters.length === 0 && !data.error}
		<EmptyState title="No parameters" description="Create parameters to store configuration values." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Name</th>
						<th class="table-th w-28">Type</th>
						<th class="table-th-right w-16">Version</th>
						<th class="table-th-right w-36">Last Modified</th>
						<th class="table-th-right w-24">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.parameters as param}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/ssm/{encodeURIComponent(param.name)}" class="font-mono text-xs text-foreground hover:text-primary transition-colors">
									{param.name}
								</a>
								{#if param.description}
									<p class="mt-0.5 text-xs text-muted-foreground">{param.description}</p>
								{/if}
							</td>
							<td class="px-4 py-3">
								{#if param.type === 'SecureString'}
									<span class="console-tag border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">{param.type}</span>
								{:else}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">{param.type}</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{param.version ?? '—'}
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{formatDate(param.lastModifiedDate)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/ssm/{encodeURIComponent(param.name)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDeleteName = param.name)}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteName} onOpenChange={(o) => { if (!o) confirmDeleteName = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete parameter</Dialog.Title>
			<Dialog.Description>
				This will permanently delete <strong>{confirmDeleteName}</strong>. This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteName = null)}>Cancel</Button>
			<form method="POST" action="?/deleteParameter" use:enhance={() => () => { confirmDeleteName = null; }}>
				<input type="hidden" name="name" value={confirmDeleteName} />
				<Button type="submit" variant="destructive">Delete Parameter</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
