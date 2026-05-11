<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmDelete: { id: string; name: string } | null = $state(null);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Identity</p>
			<h1 class="mt-1.5 page-title">Cognito User Pools</h1>
			<p class="mt-1 page-subtitle">{data.pools.length} pool{data.pools.length !== 1 ? 's' : ''}</p>
			<div class="mt-1.5 flex items-center gap-1">
				<code class="truncate font-mono text-xs text-muted-foreground">{data.endpoint}</code>
				<CopyButton text={data.endpoint} />
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Pool
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load user pools" hint={data.error} />
	{/if}

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createPool"
			use:enhance={() => () => { showCreate = false; }}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="pool-name" class="text-xs">Pool name</Label>
				<Input id="pool-name" name="name" placeholder="my-user-pool" required class="h-8 text-sm" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	{#if data.pools.length === 0 && !data.error}
		<EmptyState title="No user pools" description="Create a user pool to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Pool Name</th>
						<th class="table-th">Pool ID</th>
						<th class="table-th">Created</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pools as pool}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/cognito/{encodeURIComponent(pool.id)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{pool.name}
								</a>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<code class="font-mono text-xs text-muted-foreground">{pool.id}</code>
									<CopyButton text={pool.id} />
								</div>
							</td>
							<td class="px-4 py-3 text-muted-foreground">{formatDate(pool.creationDate)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/cognito/{encodeURIComponent(pool.id)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
										onclick={() => (confirmDelete = { id: pool.id, name: pool.name })}
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

<Dialog.Root open={!!confirmDelete} onOpenChange={(o) => { if (!o) confirmDelete = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete user pool</Dialog.Title>
			<Dialog.Description>
				Delete <strong>{confirmDelete?.name}</strong>? All users and groups will be permanently removed.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDelete = null)}>Cancel</Button>
			<form method="POST" action="?/deletePool" use:enhance={() => () => { confirmDelete = null; }}>
				<input type="hidden" name="id" value={confirmDelete?.id} />
				<Button type="submit" variant="destructive">Delete Pool</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
