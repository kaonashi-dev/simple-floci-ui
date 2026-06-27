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
	import Sparkline from '$lib/components/charts/Sparkline.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { createQueue, deleteQueue } from '$lib/floci/sqs';
	import { loadSnapshots } from '$lib/floci/sqs-snapshots';
	import { buildSnapshotThroughput } from '$lib/floci/sqs-metrics';

	let { data } = $props();

	// Per-queue activity sparkline (enqueued vs dequeued) derived from the depth
	// snapshots collected on each queue's metrics page (stored in localStorage).
	const nowMs = Date.now();
	const sparks = $derived.by(() => {
		const m = new Map<string, { enqueued: number[]; dequeued: number[] }>();
		for (const q of data.queues) {
			const buckets = buildSnapshotThroughput(loadSnapshots(q.name), {
				window: 'all',
				nowMs,
				targetBuckets: 24
			});
			m.set(q.name, {
				enqueued: buckets.map((b) => b.enqueued),
				dequeued: buckets.map((b) => b.dequeued)
			});
		}
		return m;
	});

	let showCreate = $state(false);
	let isFifo = $state(false);
	let confirmDeleteUrl: string | null = $state(null);
	let confirmDeleteName: string | null = $state(null);
	let search = $state('');

	const filtered = $derived(
		data.queues.filter((q) => q.name.toLowerCase().includes(search.toLowerCase()))
	);

	function num(v: FormDataEntryValue | null): number | undefined {
		if (v == null || v === '') return undefined;
		const n = Number(v);
		return Number.isFinite(n) ? n : undefined;
	}

	async function handleCreate(fd: FormData) {
		let name = (fd.get('name') as string)?.trim();
		if (!name) throw new Error('Queue name is required');
		const fifo = fd.get('type') === 'fifo';
		if (fifo && !name.endsWith('.fifo')) name = `${name}.fifo`;
		await createQueue(name, {
			fifo,
			visibilityTimeout: num(fd.get('visibilityTimeout')),
			messageRetention: num(fd.get('messageRetention')),
			delaySeconds: num(fd.get('delaySeconds')),
			maxMessageSizeKb: num(fd.get('maxMessageSizeKb'))
		});
		return { success: `Queue "${name}" created` };
	}

	async function handleDelete(fd: FormData) {
		const url = fd.get('url') as string;
		if (!url) throw new Error('Queue URL is required');
		await deleteQueue(url);
		return { success: 'Queue deleted' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Messaging</p>
			<h1 class="mt-1.5 page-title">SQS Queues</h1>
			<p class="mt-1 page-subtitle">Inspect message flow, depth, and FIFO queues.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Queue
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load queues" hint={data.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			use:enhance={clientAction(handleCreate, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => { showCreate = false; isFifo = false; }
			})}
			class="console-panel flex flex-col gap-3 p-4"
		>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="queue-name" class="text-xs">Queue name {isFifo ? '(.fifo suffix required)' : ''}</Label>
					<Input id="queue-name" name="name" placeholder={isFifo ? 'my-queue.fifo' : 'my-queue'} required class="h-8 text-sm" />
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
			</div>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="space-y-1.5">
					<Label for="visibility" class="text-xs">Visibility timeout (s)</Label>
					<Input id="visibility" name="visibilityTimeout" type="number" min="0" max="43200" placeholder="30" class="h-8 text-sm" />
				</div>
				<div class="space-y-1.5">
					<Label for="retention" class="text-xs">Retention (s)</Label>
					<Input id="retention" name="messageRetention" type="number" min="60" max="1209600" placeholder="345600" class="h-8 text-sm" />
				</div>
				<div class="space-y-1.5">
					<Label for="delay" class="text-xs">Delivery delay (s)</Label>
					<Input id="delay" name="delaySeconds" type="number" min="0" max="900" placeholder="0" class="h-8 text-sm" />
				</div>
				<div class="space-y-1.5">
					<Label for="maxSize" class="text-xs">Max msg size (KB)</Label>
					<Input id="maxSize" name="maxMessageSizeKb" type="number" min="1" max="256" placeholder="256" class="h-8 text-sm" />
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder="Filter queues…" total={data.queues.length} shown={filtered.length} unit="queue" />

	{#if data.queues.length === 0 && !data.error}
		<EmptyState title="No queues" description="Create a queue to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Queue Name</th>
						<th class="table-th w-16">Type</th>
						<th class="table-th-right w-28">Available</th>
						<th class="table-th-right w-28">In-Flight</th>
						<th class="table-th-right w-28">Delayed</th>
						<th class="table-th w-32">Activity</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as queue}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<a href="/aws/sqs/{encodeURIComponent(queue.name)}" class="font-medium text-foreground hover:text-primary transition-colors">
										{queue.name}
									</a>
									<CopyButton text={queue.url} label="URL" />
									{#if queue.enrichmentError}
										<span title={queue.enrichmentError} class="console-tag border-amber-300/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">partial</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3">
								{#if queue.name.endsWith('.fifo')}
									<span class="console-tag border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">FIFO</span>
								{:else}
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">std</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{queue.approximateNumberOfMessages ?? '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{queue.approximateNumberOfMessagesNotVisible ?? '—'}
							</td>
							<td class="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
								{queue.approximateNumberOfMessagesDelayed ?? '—'}
							</td>
							<td class="px-4 py-3">
								<a
									href="/aws/sqs/{encodeURIComponent(queue.name)}/metrics"
									class="inline-block rounded transition-opacity hover:opacity-80"
									title="View metrics for {queue.name}"
									aria-label="View metrics for {queue.name}"
								>
									<Sparkline
										series={[
											{ color: '#0ea5e9', values: sparks.get(queue.name)?.enqueued ?? [] },
											{ color: '#10b981', values: sparks.get(queue.name)?.dequeued ?? [] }
										]}
									/>
								</a>
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/sqs/{encodeURIComponent(queue.name)}">
										Open
									</Button>
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/aws/sqs/{encodeURIComponent(queue.name)}/metrics">
										Metrics
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
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.queues.length > 0}
						<tr>
							<td colspan="7" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No queues match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
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
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => { confirmDeleteUrl = null; confirmDeleteName = null; }
				})}
			>
				<input type="hidden" name="url" value={confirmDeleteUrl} />
				<Button type="submit" variant="destructive">Delete Queue</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

