<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { updateSecretValue } from '$lib/floci/secrets';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	let revealed = $state(false);

	async function handleUpdate(fd: FormData) {
		const value = fd.get('value') as string;
		if (!value?.trim()) throw new Error('Value is required');
		const arn = data.secret?.arn;
		if (!arn) throw new Error('Secret ARN unavailable');
		await updateSecretValue(arn, value);
		return { success: 'Secret value updated' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/secrets" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">Secrets Manager</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.secret?.name}</span>
		</nav>
		<h1 class="truncate page-title">{data.secret?.name ?? '—'}</h1>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load secret" hint={data.error} />
	{/if}

	{#if data.secret}
		{#if data.secret.arn}
			<div class="flex items-center gap-2 rounded border border-border bg-muted/30 px-3 py-2">
				<code class="flex-1 truncate font-mono text-xs text-muted-foreground">{data.secret.arn}</code>
				<CopyButton text={data.secret.arn} />
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Description</p>
				<p class="mt-1 text-sm text-foreground">{data.secret.description ?? '—'}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last Changed</p>
				<p class="mt-1 font-mono text-sm text-foreground">{formatDate(data.secret.lastChangedDate)}</p>
			</div>
			<div class="console-surface p-3">
				<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Last Accessed</p>
				<p class="mt-1 font-mono text-sm text-foreground">{formatDate(data.secret.lastAccessedDate)}</p>
			</div>
		</div>

		<div class="console-panel p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold">Secret Value</h2>
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => (revealed = !revealed)}>
					{revealed ? 'Hide' : 'Reveal'}
				</Button>
			</div>

			{#if revealed && data.secret.secretValue != null}
				<div class="flex items-start gap-2">
					<pre class="flex-1 overflow-x-auto rounded border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">{data.secret.secretValue}</pre>
					<CopyButton text={data.secret.secretValue} />
				</div>
			{:else}
				<p class="font-mono text-lg tracking-[0.3em] text-muted-foreground/50">••••••••••••••••</p>
			{/if}

			<div class="border-t border-border pt-3">
				<h3 class="mb-2 text-xs font-medium text-muted-foreground">Update Value</h3>
				<form method="POST" use:enhance={clientAction(handleUpdate, { onSuccess: () => invalidateAll() })} class="space-y-2">
					<Textarea name="value" rows={3} placeholder="New secret value" required class="resize-none font-mono text-xs" />
					<Button type="submit" size="sm">Update Value</Button>
				</form>
			</div>
		</div>
	{/if}
</div>
