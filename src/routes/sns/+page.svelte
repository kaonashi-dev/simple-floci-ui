<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmDeleteArn: string | null = $state(null);
	let confirmDeleteName: string | null = $state(null);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Messaging</p>
			<h1 class="mt-1.5 page-title">SNS Topics</h1>
			<p class="mt-1 page-subtitle">{data.topics.length} topic{data.topics.length !== 1 ? 's' : ''}</p>
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

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createTopic"
			use:enhance={() => () => { showCreate = false; }}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="topic-name" class="text-xs">Topic name</Label>
				<Input id="topic-name" name="name" placeholder="my-topic" required class="h-8 text-sm" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	{#if data.topics.length === 0 && !data.error}
		<EmptyState title="No topics" description="Create a topic to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Topic Name</th>
						<th class="table-th">ARN</th>
						<th class="table-th-right w-32">Subscriptions</th>
						<th class="table-th-right w-28">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.topics as topic}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="/sns/{encodeURIComponent(topic.arn)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{topic.name}
								</a>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<code class="max-w-xs truncate font-mono text-xs text-muted-foreground" title={topic.arn}>{topic.arn}</code>
									<CopyButton text={topic.arn} />
								</div>
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{topic.subscriptionCount ?? '—'}
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/sns/{encodeURIComponent(topic.arn)}">
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
			<form method="POST" action="?/deleteTopic" use:enhance={() => () => { confirmDeleteArn = null; confirmDeleteName = null; }}>
				<input type="hidden" name="arn" value={confirmDeleteArn} />
				<Button type="submit" variant="destructive">Delete Topic</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
