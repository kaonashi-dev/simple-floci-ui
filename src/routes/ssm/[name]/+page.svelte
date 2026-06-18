<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { putParameter } from '$lib/floci/ssm';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	let revealed = $state(false);
	const isSecure = $derived(data.parameter?.type === 'SecureString');

	async function handleUpdate(fd: FormData) {
		const value = fd.get('value') as string;
		const type = (fd.get('type') as string) || 'String';
		if (!value?.trim()) throw new Error('Value is required');
		const name = data.parameter?.name;
		if (!name) throw new Error('Parameter name unavailable');
		await putParameter(name, value, type, true);
		return { success: 'Parameter updated' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/ssm" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">SSM Params</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-mono text-[11px] font-medium text-foreground">{data.parameter?.name}</span>
		</nav>
		<h1 class="truncate page-title font-mono">{data.parameter?.name ?? '—'}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load parameter" hint={data.error} />
	{/if}

	{#if data.parameter}
		{#if data.parameter.arn}
			<div class="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
				<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{data.parameter.arn}</code>
				<CopyButton text={data.parameter.arn} />
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Type</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.parameter.type}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Version</p>
				<p class="mt-1 font-mono text-sm text-foreground">{data.parameter.version ?? '—'}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last Modified</p>
				<p class="mt-1 font-mono text-sm text-foreground">{formatDate(data.parameter.lastModifiedDate)}</p>
			</div>
		</div>

		<div class="console-panel p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold">Value</h2>
				{#if isSecure}
					<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => (revealed = !revealed)}>
						{revealed ? 'Hide' : 'Reveal'}
					</Button>
				{/if}
			</div>

			{#if !isSecure || revealed}
				{#if data.parameter.value != null}
					<div class="flex items-start gap-2">
						<pre class="flex-1 overflow-x-auto rounded border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">{data.parameter.value}</pre>
						<CopyButton text={data.parameter.value} />
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No value available.</p>
				{/if}
			{:else}
				<p class="font-mono text-lg tracking-[0.3em] text-muted-foreground/50">••••••••••••••••</p>
			{/if}

			<div class="border-t border-border pt-3">
				<h3 class="mb-2 text-xs font-medium text-muted-foreground">Update Value</h3>
				<form method="POST" use:enhance={clientAction(handleUpdate, { onSuccess: () => invalidateAll() })} class="space-y-2">
					<input type="hidden" name="type" value={data.parameter.type} />
					<Textarea name="value" rows={3} placeholder="New parameter value" required class="resize-none font-mono text-xs" />
					<Button type="submit" size="sm">Update Value</Button>
				</form>
			</div>
		</div>
	{/if}
</div>
