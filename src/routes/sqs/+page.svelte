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

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmDeleteUrl: string | null = $state(null);
	let confirmDeleteName: string | null = $state(null);
</script>

<div class="max-w-4xl space-y-5 animate-fade-in-up">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-semibold tracking-tight">SQS Queues</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				{data.queues.length} queue{data.queues.length !== 1 ? 's' : ''}
			</p>
		</div>
		<Button size="sm" onclick={() => (showCreate = !showCreate)}>
			<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Create Queue
		</Button>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load queues" hint={data.error} />
	{/if}

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createQueue"
			use:enhance={() => () => { showCreate = false; }}
			class="flex items-end gap-2 rounded border border-border bg-card p-4"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="queue-name">Queue name</Label>
				<Input id="queue-name" name="name" placeholder="my-queue" required />
			</div>
			<Button type="submit" size="sm">Create</Button>
			<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>
				Cancel
			</Button>
		</form>
	{/if}

	{#if data.queues.length === 0 && !data.error}
		<EmptyState title="No queues" description="Create a queue to get started." />
	{:else}
		<div class="rounded border border-border overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-muted/30 hover:bg-muted/30 border-b border-border">
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Queue Name</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Available</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">In-Flight</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.queues as queue}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<div class="flex items-center gap-1.5">
									<a href="/sqs/{encodeURIComponent(queue.name)}" class="font-medium hover:text-primary transition-colors">
										{queue.name}
									</a>
									<CopyButton text={queue.url} label="URL" />
								</div>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums text-muted-foreground">
								{queue.approximateNumberOfMessages ?? '—'}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-sm tabular-nums text-muted-foreground">
								{queue.approximateNumberOfMessagesNotVisible ?? '—'}
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/sqs/{encodeURIComponent(queue.name)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => { confirmDeleteUrl = queue.url; confirmDeleteName = queue.name; }}
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

<Dialog.Root open={!!confirmDeleteUrl} onOpenChange={(o) => { if (!o) { confirmDeleteUrl = null; confirmDeleteName = null; } }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete queue</Dialog.Title>
			<Dialog.Description>
				This will permanently delete <strong>{confirmDeleteName}</strong> and all its messages.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => { confirmDeleteUrl = null; confirmDeleteName = null; }}>
				Cancel
			</Button>
			<form method="POST" action="?/deleteQueue" use:enhance={() => () => { confirmDeleteUrl = null; confirmDeleteName = null; }}>
				<input type="hidden" name="url" value={confirmDeleteUrl} />
				<Button type="submit" variant="destructive">Delete Queue</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
