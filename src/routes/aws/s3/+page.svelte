<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { createBucket, deleteBucket } from '$lib/floci/s3';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	let showCreate = $state(false);
	let confirmDeleteName: string | null = $state(null);
	let search = $state('');

	const filtered = $derived(
		data.buckets.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
	);

	async function handleCreate(fd: FormData) {
		const name = (fd.get('name') as string)?.trim();
		if (!name) throw new Error('Bucket name is required');
		await createBucket(name);
		return { success: `Bucket "${name}" created` };
	}

	async function handleDelete(fd: FormData) {
		const name = fd.get('name') as string;
		if (!name) throw new Error('Bucket name is required');
		await deleteBucket(name);
		return { success: `Bucket "${name}" deleted` };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Object Storage</p>
			<h1 class="mt-1.5 page-title">S3 Buckets</h1>
			<p class="mt-1 page-subtitle">Browse objects, prefixes, and uploads.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Bucket
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load buckets" hint={data.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			use:enhance={clientAction(handleCreate, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => (showCreate = false)
			})}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="bucket-name" class="text-xs">Bucket name</Label>
				<Input id="bucket-name" name="name" placeholder="my-bucket" required class="h-8 text-sm" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder="Filter buckets…" total={data.buckets.length} shown={filtered.length} unit="bucket" />

	{#if data.buckets.length === 0 && !data.error}
		<EmptyState title="No buckets" description="Create a bucket to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Bucket Name</th>
						<th class="table-th">Created</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as bucket}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/aws/s3/{encodeURIComponent(bucket.name)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{bucket.name}
								</a>
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(bucket.creationDate)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/s3/{encodeURIComponent(bucket.name)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDeleteName = bucket.name)}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.buckets.length > 0}
						<tr>
							<td colspan="3" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No buckets match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteName} onOpenChange={(o) => { if (!o) confirmDeleteName = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete bucket</Dialog.Title>
			<Dialog.Description>
				Delete <strong>{confirmDeleteName}</strong>? The bucket must be empty.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteName = null)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => (confirmDeleteName = null)
				})}
			>
				<input type="hidden" name="name" value={confirmDeleteName} />
				<Button type="submit" variant="destructive">Delete Bucket</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
