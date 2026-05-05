<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatDate } from '$lib/utils/formatDate';

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmDeleteName: string | null = $state(null);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="console-action-row">
		<div>
			<p class="console-subtle-label">Object storage</p>
			<h1 class="console-heading mt-2">S3 Buckets</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{data.buckets.length} bucket{data.buckets.length !== 1 ? 's' : ''}
			</p>
		</div>
		<Button size="sm" onclick={() => (showCreate = !showCreate)}>
			<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Create Bucket
		</Button>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load buckets" hint={data.error} />
	{/if}

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createBucket"
			use:enhance={() => () => { showCreate = false; }}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="bucket-name">Bucket name</Label>
				<Input id="bucket-name" name="name" placeholder="my-bucket" required />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>
					Cancel
				</Button>
			</div>
		</form>
	{/if}

	{#if data.buckets.length === 0 && !data.error}
		<EmptyState title="No buckets" description="Create a bucket to get started." />
	{:else}
		<div class="console-table-shell">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-muted/30 hover:bg-muted/30 border-b border-border">
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Bucket Name</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.buckets as bucket}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<a href="/s3/{encodeURIComponent(bucket.name)}" class="font-medium hover:text-primary transition-colors">
									{bucket.name}
								</a>
							</Table.Cell>
							<Table.Cell class="font-mono text-xs text-muted-foreground">{formatDate(bucket.creationDate)}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/s3/{encodeURIComponent(bucket.name)}">
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
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
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
			<form method="POST" action="?/deleteBucket" use:enhance={() => () => { confirmDeleteName = null; }}>
				<input type="hidden" name="name" value={confirmDeleteName} />
				<Button type="submit" variant="destructive">Delete Bucket</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
