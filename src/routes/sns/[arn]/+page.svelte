<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let { data, form } = $props();

	const topicName = $derived(data.arn.split(':').pop() ?? data.arn);

	const keyAttrs = ['DisplayName', 'SubscriptionsConfirmed', 'SubscriptionsPending', 'SubscriptionsDeleted'];
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/sns" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">SNS</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
			</svg>
			<span class="truncate font-medium text-foreground">{topicName}</span>
		</nav>
		<h1 class="truncate page-title">{topicName}</h1>
		<div class="mt-1.5 flex items-center gap-1.5">
			<code class="truncate font-mono text-xs text-muted-foreground">{data.arn}</code>
			<CopyButton text={data.arn} />
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load topic" hint={data.error} />
	{/if}

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if form?.success}
		<div class="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
			<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			{form.success}
		</div>
	{/if}

	<div class="console-panel p-4 space-y-3">
		<h2 class="text-sm font-semibold">Attributes</h2>
		<dl class="space-y-1.5">
			{#each keyAttrs as key}
				{#if data.attributes[key] !== undefined}
					<div class="flex items-baseline justify-between gap-2">
						<dt class="shrink-0 text-xs text-muted-foreground">{key}</dt>
						<dd class="max-w-[200px] truncate font-mono text-xs text-foreground/80" title={data.attributes[key]}>
							{data.attributes[key]}
						</dd>
					</div>
				{/if}
			{/each}
		</dl>
	</div>

	<div class="space-y-3">
		<h2 class="text-sm font-semibold">Subscriptions</h2>
		{#if data.subscriptions.length === 0}
			<p class="console-surface px-4 py-8 text-center text-sm text-muted-foreground">
				No subscriptions for this topic.
			</p>
		{:else}
			<div class="console-table-shell">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="table-th w-28">Protocol</th>
							<th class="table-th">Endpoint</th>
							<th class="table-th">Subscription ARN</th>
						</tr>
					</thead>
					<tbody>
						{#each data.subscriptions as sub}
							<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
								<td class="px-4 py-3">
									<span class="console-tag border-border bg-muted/30 text-muted-foreground">{sub.protocol}</span>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
									<div class="flex items-center gap-1.5">
										<span class="truncate max-w-xs" title={sub.endpoint}>{sub.endpoint || '—'}</span>
										{#if sub.endpoint}
											<CopyButton text={sub.endpoint} />
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
									<div class="flex items-center gap-1.5">
										<span class="truncate max-w-xs" title={sub.subscriptionArn}>{sub.subscriptionArn || '—'}</span>
										{#if sub.subscriptionArn && sub.subscriptionArn !== 'PendingConfirmation'}
											<CopyButton text={sub.subscriptionArn} />
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<div class="console-panel p-4 space-y-3">
		<h2 class="text-sm font-semibold">Publish Message</h2>
		<form method="POST" action="?/publish" use:enhance class="space-y-3">
			<div class="space-y-1.5">
				<Label for="subject" class="text-xs text-muted-foreground">Subject <span class="text-muted-foreground/60">(optional)</span></Label>
				<Input id="subject" name="subject" placeholder="Message subject" class="h-8 text-sm" />
			</div>
			<div class="space-y-1.5">
				<Label for="message" class="text-xs text-muted-foreground">Message</Label>
				<Textarea
					id="message"
					name="message"
					rows={4}
					placeholder="Message body"
					required
					class="resize-none font-mono text-xs"
				/>
			</div>
			<Button type="submit" size="sm">Publish</Button>
		</form>
	</div>
</div>
