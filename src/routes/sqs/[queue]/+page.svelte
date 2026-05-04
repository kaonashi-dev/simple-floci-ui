<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import JsonViewer from '$lib/components/JsonViewer.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import type { SqsMessage } from '$lib/types/sqs';

	let { data, form } = $props();

	let messages: SqsMessage[] = $state([]);
	let showPurgeConfirm = $state(false);
	let expandedMessage: string | null = $state(null);

	$effect(() => {
		if (form?.action === 'receive' && form.messages) {
			messages = form.messages as SqsMessage[];
		}
	});

	const attrKeys = $derived(Object.entries(data.attributes ?? {}).sort(([a], [b]) => a.localeCompare(b)));
</script>

<div class="max-w-4xl space-y-6 animate-fade-in-up">
	<!-- Breadcrumb -->
	<div>
		<nav class="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
			<a href="/sqs" class="hover:text-foreground transition-colors">SQS</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
			</svg>
			<span class="text-foreground font-medium">{data.name}</span>
		</nav>
		<h1 class="text-xl font-semibold tracking-tight truncate">{data.name}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load queue" hint={data.error} />
	{/if}

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if form?.success}
		<div class="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-400">
			<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			{form.success}
		</div>
	{/if}

	{#if data.url}
		<div class="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
			<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{data.url}</code>
			<CopyButton text={data.url} />
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-4">
		<!-- Send Message -->
		<div class="rounded border border-border bg-card p-4 space-y-3">
			<h2 class="text-sm font-semibold">Send Message</h2>
			<form method="POST" action="?/sendMessage" use:enhance class="space-y-2.5">
				<div class="space-y-1.5">
					<Label for="msg-body" class="text-xs text-muted-foreground">Message body</Label>
					<Textarea
						id="msg-body"
						name="body"
						rows={4}
						placeholder="JSON message body"
						class="resize-none font-mono text-xs"
					/>
				</div>
				<Button type="submit" size="sm">Send</Button>
			</form>
		</div>

		<!-- Attributes -->
		<div class="rounded border border-border bg-card p-4 space-y-3">
			<h2 class="text-sm font-semibold">Attributes</h2>
			<dl class="space-y-2">
				{#each attrKeys.slice(0, 8) as [k, v]}
					<div class="flex items-baseline justify-between gap-2">
						<dt class="shrink-0 text-xs text-muted-foreground">
							{k.replace(/([A-Z])/g, ' $1').trim()}
						</dt>
						<dd class="max-w-[140px] truncate font-mono text-xs text-foreground/80" title={v}>{v}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>

	<div class="h-px bg-border"></div>

	<!-- Messages -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-sm font-semibold">Messages</h2>
				<p class="mt-0.5 text-xs text-muted-foreground/60">
					Received messages become temporarily invisible (visibility timeout applies).
				</p>
			</div>
			<form method="POST" action="?/receiveMessages" use:enhance>
				<Button type="submit" variant="outline" size="sm">
					<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Receive
				</Button>
			</form>
		</div>

		{#if messages.length === 0}
			<p class="rounded border border-border/50 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
				No messages yet — click Receive to poll the queue.
			</p>
		{:else}
			<div class="space-y-2">
				{#each messages as msg}
					<div class="rounded border border-border bg-card p-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<p class="font-mono text-[10px] text-muted-foreground/60">ID: {msg.messageId}</p>
								<p class="mt-1 break-words text-sm">{msg.body}</p>
							</div>
							<div class="flex shrink-0 items-center gap-1">
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
										action="?/deleteMessage"
										use:enhance={() => () => {
											messages = messages.filter((m) => m.messageId !== msg.messageId);
										}}
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
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm font-medium text-foreground">Purge Queue</p>
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
				action="?/purgeQueue"
				use:enhance={() => () => { showPurgeConfirm = false; messages = []; }}
			>
				<Button type="submit" variant="destructive">Purge All Messages</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
