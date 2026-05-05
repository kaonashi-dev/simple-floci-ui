<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
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
	<div class="console-action-row">
		<div>
			<p class="console-subtle-label">Identity</p>
			<h1 class="console-heading mt-2">Cognito User Pools</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{data.pools.length} pool{data.pools.length !== 1 ? 's' : ''}
			</p>
			<div class="mt-2 flex max-w-full items-center gap-1">
				<code class="truncate font-mono text-xs text-muted-foreground">{data.endpoint}</code>
				<CopyButton text={data.endpoint} />
			</div>
		</div>
		<Button size="sm" onclick={() => (showCreate = !showCreate)}>
			<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Create Pool
		</Button>
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
				<Label for="pool-name">Pool name</Label>
				<Input id="pool-name" name="name" placeholder="my-user-pool" required />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>
					Cancel
				</Button>
			</div>
		</form>
	{/if}

	{#if data.pools.length === 0 && !data.error}
		<EmptyState title="No user pools" description="Create a user pool to get started." />
	{:else}
		<div class="console-table-shell">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-b border-border bg-muted/30 hover:bg-muted/30">
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Pool Name</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Pool ID</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.pools as pool}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<a href="/cognito/{encodeURIComponent(pool.id)}" class="font-medium transition-colors hover:text-primary">
									{pool.name}
								</a>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-1.5">
									<code class="font-mono text-xs text-muted-foreground">{pool.id}</code>
									<CopyButton text={pool.id} />
								</div>
							</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">{formatDate(pool.creationDate)}</Table.Cell>
							<Table.Cell class="text-right">
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
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
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
