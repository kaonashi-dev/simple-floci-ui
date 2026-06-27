<script lang="ts">
	import { enhance } from '$app/forms';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import JsonViewer from '$lib/components/JsonViewer.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import {
		getQueueUrl,
		sendMessage,
		receiveMessages,
		deleteMessage,
		purgeQueue
	} from '$lib/floci/sqs';
	import { recordSent, recordReceived, recordDeleted } from '$lib/floci/sqs-history';
	import type { SqsMessage, SqsMessageAttributeInput } from '$lib/types/sqs';

	let { data } = $props();

	let messages: SqsMessage[] = $state([]);
	let showPurgeConfirm = $state(false);
	let expandedMessage: string | null = $state(null);
	let showAllAttrs = $state(false);
	let showSendOptions = $state(false);
	let msgAttrs = $state<{ name: string; value: string; type: 'String' | 'Number' | 'Binary' }[]>([]);

	let receiveMax = $state(10);
	let receiveVisibility = $state(30);
	let receiveWait = $state(1);

	function num(v: FormDataEntryValue | null): number | undefined {
		if (v == null || v === '') return undefined;
		const n = Number(v);
		return Number.isFinite(n) ? n : undefined;
	}

	function parseAttributes(raw: FormDataEntryValue | null): SqsMessageAttributeInput[] {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(String(raw));
			if (!Array.isArray(parsed)) return [];
			return parsed
				.filter((a: unknown): a is SqsMessageAttributeInput =>
					typeof a === 'object' && a != null && typeof (a as { name: unknown }).name === 'string'
				)
				.map((a) => ({ name: a.name, value: a.value, type: a.type }));
		} catch {
			return [];
		}
	}

	async function handleSend(fd: FormData) {
		const body = fd.get('body') as string;
		if (!body?.trim()) throw new Error('Message body is required');
		const url = await getQueueUrl(data.name);
		const res = await sendMessage(url, body, {
			delaySeconds: data.isFifo ? undefined : num(fd.get('delaySeconds')),
			messageGroupId: data.isFifo
				? ((fd.get('messageGroupId') as string) || 'default').trim()
				: undefined,
			messageDeduplicationId: data.isFifo
				? (fd.get('messageDeduplicationId') as string)?.trim() || undefined
				: undefined,
			attributes: parseAttributes(fd.get('attributes'))
		});
		recordSent(data.name, res.messageId, body);
		return { success: `Message sent (${res.messageId ?? 'ok'})` };
	}

	async function handleReceive(fd: FormData) {
		const url = await getQueueUrl(data.name);
		const received = await receiveMessages(url, {
			maxMessages: num(fd.get('maxMessages')),
			visibilityTimeout: num(fd.get('visibilityTimeout')),
			waitTimeSeconds: num(fd.get('waitTimeSeconds'))
		});
		if (received.length > 0) recordReceived(data.name, received);
		return { messages: received };
	}

	async function handleDeleteMessage(fd: FormData) {
		const url = await getQueueUrl(data.name);
		await deleteMessage(url, fd.get('receiptHandle') as string);
		recordDeleted(data.name);
		return { success: 'Message deleted' };
	}

	async function handlePurge() {
		const url = await getQueueUrl(data.name);
		await purgeQueue(url);
		return { success: 'Queue purged' };
	}

	const attrEntries = $derived(
		Object.entries(data.attributes ?? {}).sort(([a], [b]) => a.localeCompare(b))
	);
	const visibleAttrs = $derived(showAllAttrs ? attrEntries : attrEntries.slice(0, 8));

	function fmtAttr(key: string, value: string) {
		const epochKeys = new Set(['CreatedTimestamp', 'LastModifiedTimestamp']);
		if (epochKeys.has(key)) {
			const n = Number(value);
			if (Number.isFinite(n)) return new Date(n * 1000).toLocaleString();
		}
		return value;
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/sqs" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">SQS</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
			</svg>
			<span class="truncate font-medium text-foreground">{data.name}</span>
			<span class="text-border">·</span>
			<a
				href="/aws/sqs/{encodeURIComponent(data.name)}/metrics"
				class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
			>Metrics</a>
			<a
				href="/aws/sqs/{encodeURIComponent(data.name)}/history"
				class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
			>History</a>
		</nav>
		<div class="flex items-center gap-2">
			<h1 class="truncate page-title">{data.name}</h1>
			{#if data.isFifo}
				<span class="console-tag border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300">FIFO</span>
			{/if}
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load queue" hint={data.error} />
	{/if}

	{#if data.url}
		<div class="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
			<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{data.url}</code>
			<CopyButton text={data.url} />
		</div>
	{/if}

	<!-- Send message + Attributes -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="console-panel space-y-3 p-4">
			<h2 class="text-sm font-semibold">Send Message</h2>
			<form
				method="POST"
				use:enhance={clientAction(handleSend)}
				class="space-y-2.5"
			>
				<div class="space-y-1.5">
					<Label for="msg-body" class="text-xs text-muted-foreground">Message body</Label>
					<Textarea
						id="msg-body"
						name="body"
						rows={4}
						placeholder={data.isFifo ? '{"order_id": 123}' : 'JSON message body'}
						class="resize-none font-mono text-xs"
					/>
				</div>

				<button
					type="button"
					class="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
					onclick={() => (showSendOptions = !showSendOptions)}
				>
					<ChevronDownIcon class="size-3 transition-transform {showSendOptions ? 'rotate-180' : ''}" />
					Advanced options
				</button>

				{#if showSendOptions}
					<div class="space-y-2.5 rounded border border-border/60 bg-muted/20 p-3">
						{#if data.isFifo}
							<div class="grid grid-cols-2 gap-2">
								<div class="space-y-1">
									<Label for="group-id" class="text-xs">Group ID</Label>
									<Input id="group-id" name="messageGroupId" placeholder="default" class="h-7 text-xs font-mono" />
								</div>
								<div class="space-y-1">
									<Label for="dedup-id" class="text-xs">Dedup ID</Label>
									<Input id="dedup-id" name="messageDeduplicationId" placeholder="(content-based)" class="h-7 text-xs font-mono" />
								</div>
							</div>
						{:else}
							<div class="space-y-1">
								<Label for="send-delay" class="text-xs">Delivery delay (seconds, 0–900)</Label>
								<Input id="send-delay" name="delaySeconds" type="number" min="0" max="900" placeholder="0" class="h-7 w-32 text-xs" />
							</div>
						{/if}

						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label class="text-xs">Message attributes</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									class="h-6 px-1.5 text-xs"
									onclick={() => msgAttrs = [...msgAttrs, { name: '', value: '', type: 'String' }]}
								>
									<PlusIcon class="size-3" /> Add
								</Button>
							</div>
							{#each msgAttrs as attr, i}
								<div class="flex items-center gap-1.5">
									<Input bind:value={msgAttrs[i].name} placeholder="name" class="h-7 flex-1 text-xs font-mono" />
									<Input bind:value={msgAttrs[i].value} placeholder="value" class="h-7 flex-1 text-xs font-mono" />
									<select bind:value={msgAttrs[i].type} class="h-7 rounded border border-input bg-background px-1 text-xs">
										<option value="String">String</option>
										<option value="Number">Number</option>
										<option value="Binary">Binary</option>
									</select>
									<button
										type="button"
										class="rounded p-1 text-muted-foreground hover:text-destructive"
										aria-label="Remove attribute"
										onclick={() => msgAttrs = msgAttrs.filter((_, j) => j !== i)}
									>
										<TrashIcon class="size-3" />
									</button>
								</div>
							{/each}
							<input type="hidden" name="attributes" value={JSON.stringify(msgAttrs.filter(a => a.name && a.value))} />
						</div>
					</div>
				{/if}

				<Button type="submit" size="sm">Send</Button>
			</form>
		</div>

		<div class="console-panel space-y-3 p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold">Attributes</h2>
				{#if attrEntries.length > 8}
					<button
						type="button"
						class="text-xs font-medium text-primary hover:underline"
						onclick={() => (showAllAttrs = !showAllAttrs)}
					>
						{showAllAttrs ? 'Show less' : `Show all (${attrEntries.length})`}
					</button>
				{/if}
			</div>
			<dl class="space-y-1.5">
				{#each visibleAttrs as [k, v]}
					<div class="flex items-baseline justify-between gap-2">
						<dt class="shrink-0 text-xs text-muted-foreground">
							{k.replace(/([A-Z])/g, ' $1').trim()}
						</dt>
						<dd class="max-w-[180px] truncate font-mono text-xs text-foreground/80" title={v}>
							{fmtAttr(k, v)}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>

	<div class="h-px bg-border"></div>

	<!-- Messages -->
	<div class="space-y-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h2 class="text-sm font-semibold">Messages</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					Received messages become temporarily invisible (visibility timeout applies).
				</p>
			</div>
			<form
				method="POST"
				use:enhance={clientAction(handleReceive, {
					onSuccess: (d) => (messages = d.messages as SqsMessage[])
				})}
				class="flex flex-wrap items-end gap-2"
			>
				<div class="space-y-1">
					<Label for="r-max" class="text-[10px] uppercase text-muted-foreground/70">Max</Label>
					<Input id="r-max" name="maxMessages" type="number" min="1" max="10" bind:value={receiveMax} class="h-8 w-16 text-xs" />
				</div>
				<div class="space-y-1">
					<Label for="r-vis" class="text-[10px] uppercase text-muted-foreground/70">Vis. timeout</Label>
					<Input id="r-vis" name="visibilityTimeout" type="number" min="0" max="43200" bind:value={receiveVisibility} class="h-8 w-20 text-xs" />
				</div>
				<div class="space-y-1">
					<Label for="r-wait" class="text-[10px] uppercase text-muted-foreground/70">Wait (s)</Label>
					<Input id="r-wait" name="waitTimeSeconds" type="number" min="0" max="20" bind:value={receiveWait} class="h-8 w-16 text-xs" />
				</div>
				<Button type="submit" variant="outline" size="sm">
					<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Receive
				</Button>
			</form>
		</div>

		{#if messages.length === 0}
			<p class="console-surface px-4 py-8 text-center text-sm text-muted-foreground">
				No messages — click Receive to poll the queue.
			</p>
		{:else}
			<div class="space-y-2">
				{#each messages as msg}
					<div class="console-surface p-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<p class="font-mono text-[10px] text-muted-foreground/60">ID: {msg.messageId}</p>
								<p class="mt-1 break-words text-sm">{msg.body}</p>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<CopyButton text={msg.body ?? ''} label="Body" />
								<Button
									variant="ghost"
									size="sm"
									class="h-7 px-2 text-xs"
									onclick={() => (expandedMessage = expandedMessage === msg.messageId ? null : (msg.messageId ?? null))}
								>
									{expandedMessage === msg.messageId ? 'Hide' : 'Raw'}
								</Button>
								{#if msg.receiptHandle}
									<form
										method="POST"
										use:enhance={clientAction(handleDeleteMessage, {
											onSuccess: () => {
												messages = messages.filter((m) => m.messageId !== msg.messageId);
											}
										})}
									>
										<input type="hidden" name="receiptHandle" value={msg.receiptHandle} />
										<Button
											type="submit"
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										>
											Delete
										</Button>
									</form>
								{/if}
							</div>
						</div>
						{#if expandedMessage === msg.messageId}
							<div class="mt-3">
								<JsonViewer value={msg} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="h-px bg-border"></div>

	<!-- Danger zone -->
	<div class="rounded border border-destructive/20 bg-destructive/5 p-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-sm font-medium">Purge Queue</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Permanently removes all messages. Cannot be undone.</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				class="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
				onclick={() => (showPurgeConfirm = true)}
			>
				Purge Queue
			</Button>
		</div>
	</div>
</div>

<Dialog.Root open={showPurgeConfirm} onOpenChange={(o) => (showPurgeConfirm = o)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Purge queue</Dialog.Title>
			<Dialog.Description>
				All messages in <strong>{data.name}</strong> will be permanently deleted.
				This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showPurgeConfirm = false)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handlePurge, {
					closeOnSuccess: () => { showPurgeConfirm = false; messages = []; }
				})}
			>
				<Button type="submit" variant="destructive">Purge All Messages</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
