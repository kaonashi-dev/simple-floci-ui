<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { createTopic, deleteTopic } from '$lib/floci/sns';

	let { data } = $props();

	let showCreate = $state(false);
	let isFifo = $state(false);
	let confirmDeleteArn: string | null = $state(null);
	let confirmDeleteName: string | null = $state(null);
	let search = $state('');

	const filtered = $derived(
		data.topics.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
	);

	async function handleCreate(fd: FormData) {
		let name = (fd.get('name') as string)?.trim();
		if (!name) throw new Error('Topic name is required');
		const fifo = fd.get('type') === 'fifo';
		if (fifo && !name.endsWith('.fifo')) name = `${name}.fifo`;
		await createTopic(name, { fifo });
		return { success: `Topic "${name}" created` };
	}

	async function handleDelete(fd: FormData) {
		const arn = fd.get('arn') as string;
		if (!arn) throw new Error('Topic ARN is required');
		await deleteTopic(arn);
		return { success: 'Topic deleted' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Messaging</p>
			<h1 class="mt-1.5 page-title">SNS Topics</h1>
			<p class="mt-1 page-subtitle">Manage topics, subscriptions, and publish messages.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Topic
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load topics" hint={data.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			use:enhance={clientAction(handleCreate, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => { showCreate = false; isFifo = false; }
			})}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="topic-name" class="text-xs">Topic name {isFifo ? '(.fifo suffix required)' : ''}</Label>
				<Input id="topic-name" name="name" placeholder={isFifo ? 'my-topic.fifo' : 'my-topic'} required class="h-8 text-sm" />
			</div>
			<div class="space-y-1.5">
				<Label class="text-xs">Type</Label>
				<div class="flex h-8 items-center gap-3 text-xs">
					<label class="flex items-center gap-1.5">
						<input type="radio" name="type" value="standard" checked={!isFifo} onchange={() => (isFifo = false)} />
						Standard
					</label>
					<label class="flex items-center gap-1.5">
						<input type="radio" name="type" value="fifo" checked={isFifo} onchange={() => (isFifo = true)} />
						FIFO
					</label>
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder="Filter topics…" total={data.topics.length} shown={filtered.length} unit="topic" />

	{#if data.topics.length === 0 && !data.error}
		<EmptyState title="No topics" description="Create a topic to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Topic Name</th>
						<th class="table-th w-16">Type</th>
						<th class="table-th">ARN</th>
						<th class="table-th-right w-32">Subscriptions</th>
						<th class="table-th-right w-28">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as topic}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/aws/sns/{encodeURIComponent(topic.arn)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{topic.name}
								</a>
							</td>
							<td class="px-4 py-3">
								{#if topic.name.endsWith('.fifo')}
									<span class="console-tag border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">FIFO</span>
								{:else}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">std</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<code class="max-w-xs truncate font-mono text-xs text-muted-foreground" title={topic.arn}>{topic.arn}</code>
									<CopyButton text={topic.arn} />
								</div>
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{#if topic.enrichmentError}
									<span title={topic.enrichmentError} class="console-tag border-amber-300/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">partial</span>
								{:else}
									{topic.subscriptionCount ?? '—'}
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/sns/{encodeURIComponent(topic.arn)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => { confirmDeleteArn = topic.arn; confirmDeleteName = topic.name; }}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.topics.length > 0}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No topics match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteArn} onOpenChange={(o) => { if (!o) { confirmDeleteArn = null; confirmDeleteName = null; } }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete topic</Dialog.Title>
			<Dialog.Description>
				This will permanently delete <strong>{confirmDeleteName}</strong> and all its subscriptions.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => { confirmDeleteArn = null; confirmDeleteName = null; }}>
				Cancel
			</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => { confirmDeleteArn = null; confirmDeleteName = null; }
				})}
			>
				<input type="hidden" name="arn" value={confirmDeleteArn} />
				<Button type="submit" variant="destructive">Delete Topic</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
