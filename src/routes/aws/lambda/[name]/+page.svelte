<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { invokeFunction } from '$lib/floci/lambda';
	import type { LambdaInvokeResult } from '$lib/types/lambda';

	let { data } = $props();

	let invokeResult: LambdaInvokeResult | null = $state(null);
	let showLogs = $state(false);

	async function handleInvoke(fd: FormData) {
		const payload = (fd.get('payload') as string)?.trim() || '{}';
		try {
			JSON.parse(payload);
		} catch {
			throw new Error('Payload must be valid JSON');
		}
		const result = await invokeFunction(data.name, payload);
		return { result };
	}

	const envEntries = $derived(Object.entries(data.fn?.environment ?? {}).sort(([a], [b]) => a.localeCompare(b)));
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/aws/lambda" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">Lambda</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
			</svg>
			<span class="truncate font-medium text-foreground">{data.fn?.name ?? data.name}</span>
		</nav>
		<h1 class="truncate page-title">{data.fn?.name ?? '—'}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load function" hint={data.error} />
	{/if}

	{#if data.fn}
		<!-- Config card -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each [
				{ label: 'Runtime', value: data.fn.runtime },
				{ label: 'Handler', value: data.fn.handler },
				{ label: 'Memory', value: data.fn.memorySizeMb != null ? `${data.fn.memorySizeMb} MB` : undefined },
				{ label: 'Timeout', value: data.fn.timeoutSec != null ? `${data.fn.timeoutSec}s` : undefined },
				{ label: 'State', value: data.fn.state },
				{ label: 'Code Size', value: data.fn.codeSize != null ? `${Math.round(data.fn.codeSize / 1024)} KB` : undefined },
			] as item}
				<div class="console-surface p-3">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
					<p class="mt-1 font-mono text-sm text-foreground">{item.value ?? '—'}</p>
				</div>
			{/each}
		</div>

		{#if data.fn.arn}
			<div class="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
				<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{data.fn.arn}</code>
				<CopyButton text={data.fn.arn} />
			</div>
		{/if}

		<!-- Invoke panel -->
		<div class="console-panel p-4 space-y-3">
			<h2 class="text-sm font-semibold">Invoke Function</h2>
			<form method="POST" use:enhance={clientAction(handleInvoke, { onSuccess: (d) => (invokeResult = d.result as LambdaInvokeResult) })} class="space-y-2.5">
				<div class="space-y-1.5">
					<Label for="payload" class="text-xs text-muted-foreground">JSON Payload</Label>
					<Textarea
						id="payload"
						name="payload"
						rows={5}
						placeholder={"{}"}
						class="resize-none font-mono text-xs"
					/>
				</div>
				<Button type="submit" size="sm">Invoke</Button>
			</form>

			{#if invokeResult}
				<div class="mt-3 space-y-2 border-t border-border pt-3">
					<div class="flex items-center gap-2">
						<span class="text-xs font-medium text-muted-foreground">Status:</span>
						<span class="font-mono text-xs {invokeResult.functionError ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}">
							{invokeResult.statusCode}
							{#if invokeResult.functionError}— {invokeResult.functionError}{/if}
						</span>
					</div>
					{#if invokeResult.payload}
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground">Response</p>
							<pre class="overflow-x-auto rounded border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">{invokeResult.payload}</pre>
						</div>
					{/if}
					{#if invokeResult.logResult}
						<div class="space-y-1">
							<button
								type="button"
								class="text-xs font-medium text-primary hover:underline"
								onclick={() => (showLogs = !showLogs)}
							>
								{showLogs ? 'Hide' : 'Show'} execution logs
							</button>
							{#if showLogs}
								<pre class="overflow-x-auto rounded border border-border bg-muted/30 p-3 font-mono text-[10px] text-muted-foreground">{invokeResult.logResult}</pre>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Environment variables -->
		{#if envEntries.length > 0}
			<div class="console-panel p-4 space-y-3">
				<h2 class="text-sm font-semibold">Environment Variables</h2>
				<div class="console-table-shell">
					<table class="w-full text-xs">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Key</th>
								<th class="table-th">Value</th>
							</tr>
						</thead>
						<tbody>
							{#each envEntries as [key, val]}
								<tr class="border-b border-border/40 last:border-0">
									<td class="px-4 py-2 font-mono text-foreground/80">{key}</td>
									<td class="px-4 py-2 font-mono text-muted-foreground">
										<div class="flex items-center gap-1.5">
											<span class="truncate max-w-xs">{val}</span>
											<CopyButton text={val} />
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- Layers -->
		{#if data.fn.layers && data.fn.layers.length > 0}
			<div class="console-panel p-4 space-y-3">
				<h2 class="text-sm font-semibold">Layers</h2>
				<ul class="space-y-1.5">
					{#each data.fn.layers as layer}
						<li class="flex items-center gap-1.5">
							<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{layer}</code>
							<CopyButton text={layer} />
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>
