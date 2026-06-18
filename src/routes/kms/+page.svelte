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
	import { createKey, enableKey, disableKey, scheduleKeyDeletion } from '$lib/floci/kms';
	import { KeyUsageType } from '@aws-sdk/client-kms';
	import { formatDate } from '$lib/utils/formatDate';
	import { cn } from '$lib/utils';

	let { data } = $props();

	let showCreate = $state(false);
	let confirmSchedule: { keyId: string; aliases: string[] } | null = $state(null);
	let scheduleDays = $state(7);
	let search = $state('');
	let stateFilter = $state<'all' | 'Enabled' | 'Disabled' | 'PendingDeletion'>('all');

	async function handleCreate(fd: FormData) {
		const description = (fd.get('description') as string)?.trim() || undefined;
		const usage = (fd.get('keyUsage') as string) || 'ENCRYPT_DECRYPT';
		const keyUsage =
			usage === 'SIGN_VERIFY' ? KeyUsageType.SIGN_VERIFY : KeyUsageType.ENCRYPT_DECRYPT;
		const keyId = await createKey(description, keyUsage);
		return { success: `Key ${keyId} created` };
	}

	async function handleDisable(fd: FormData) {
		await disableKey(fd.get('keyId') as string);
		return { success: 'Key disabled' };
	}

	async function handleEnable(fd: FormData) {
		await enableKey(fd.get('keyId') as string);
		return { success: 'Key enabled' };
	}

	async function handleSchedule(fd: FormData) {
		const keyId = fd.get('keyId') as string;
		const days = parseInt(fd.get('days') as string, 10) || 7;
		await scheduleKeyDeletion(keyId, days);
		return { success: `Key scheduled for deletion in ${days} days` };
	}

	const filtered = $derived(
		data.keys.filter((k) => {
			const hay = `${k.keyId} ${k.description ?? ''} ${k.aliases.join(' ')}`.toLowerCase();
			const matchesSearch = hay.includes(search.toLowerCase());
			const matchesState = stateFilter === 'all' || k.keyState === stateFilter;
			return matchesSearch && matchesState;
		})
	);

	function stateClass(state?: string) {
		if (state === 'Enabled') return 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400';
		if (state === 'Disabled') return 'text-muted-foreground border-border bg-muted/30';
		if (state === 'PendingDeletion') return 'text-red-600 border-red-500/30 bg-red-500/10 dark:text-red-400';
		return 'text-muted-foreground border-border';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Encryption</p>
			<h1 class="mt-1.5 page-title">KMS Keys</h1>
			<p class="mt-1 page-subtitle">Review keys, aliases, and rotation settings.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Key
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load keys" hint={data.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			use:enhance={clientAction(handleCreate, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => (showCreate = false)
			})}
			class="console-panel flex flex-col gap-3 p-4"
		>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="space-y-1.5 sm:col-span-2">
					<Label for="key-desc" class="text-xs">Description (optional)</Label>
					<Input id="key-desc" name="description" placeholder="My encryption key" class="h-8 text-sm" />
				</div>
				<div class="space-y-1.5">
					<Label for="key-usage" class="text-xs">Key usage</Label>
					<select id="key-usage" name="keyUsage" class="h-8 w-full rounded border border-input bg-background px-2 text-sm">
						<option value="ENCRYPT_DECRYPT">Encrypt/Decrypt</option>
						<option value="SIGN_VERIFY">Sign/Verify</option>
					</select>
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder="Filter keys, aliases, descriptions…" total={data.keys.length} shown={filtered.length} unit="key">
		{#snippet children()}
			<select bind:value={stateFilter} class="h-8 rounded border border-border bg-muted/30 px-2 text-xs">
				<option value="all">All states</option>
				<option value="Enabled">Enabled</option>
				<option value="Disabled">Disabled</option>
				<option value="PendingDeletion">Pending deletion</option>
			</select>
		{/snippet}
	</ListToolbar>

	{#if data.keys.length === 0 && !data.error}
		<EmptyState title="No keys" description="Create a symmetric key to get started." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Key ID / Aliases</th>
						<th class="table-th w-28">State</th>
						<th class="table-th w-36">Usage</th>
						<th class="table-th w-24">Rotation</th>
						<th class="table-th w-36">Created</th>
						<th class="table-th-right w-40">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as key}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<div class="space-y-1">
									<div class="flex items-center gap-1.5">
										<a href="/kms/{encodeURIComponent(key.keyId)}" class="font-mono text-xs font-medium text-foreground transition-colors hover:text-primary">
											{key.keyId}
										</a>
										<CopyButton text={key.keyId} />
									</div>
									{#if key.aliases.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each key.aliases as alias}
												<span class="console-tag border-border/60 bg-muted/50 text-muted-foreground">
													{alias.replace('alias/', '')}
												</span>
											{/each}
										</div>
									{/if}
									{#if key.description}
										<p class="text-xs text-muted-foreground/60">{key.description}</p>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3">
								{#if key.enrichmentError}
									<span title={key.enrichmentError} class="console-tag border-amber-300/30 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">partial</span>
								{:else}
									<span class={cn('console-tag', stateClass(key.keyState))}>
										{key.keyState ?? '—'}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">
								{key.keyUsage?.replace('_', ' ') ?? '—'}
							</td>
							<td class="px-4 py-3">
								{#if key.rotationEnabled === true}
									<span class="console-tag border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">on</span>
								{:else if key.rotationEnabled === false}
									<span class="console-tag border-border text-muted-foreground/60">off</span>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(key.creationDate)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/kms/{encodeURIComponent(key.keyId)}">
										Open
									</Button>
									{#if key.keyState === 'Enabled'}
										<form method="POST" use:enhance={clientAction(handleDisable, { onSuccess: () => invalidateAll() })}>
											<input type="hidden" name="keyId" value={key.keyId} />
											<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Disable</Button>
										</form>
									{:else if key.keyState === 'Disabled'}
										<form method="POST" use:enhance={clientAction(handleEnable, { onSuccess: () => invalidateAll() })}>
											<input type="hidden" name="keyId" value={key.keyId} />
											<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Enable</Button>
										</form>
									{/if}
									{#if key.keyState !== 'PendingDeletion'}
										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
											onclick={() => (confirmSchedule = { keyId: key.keyId, aliases: key.aliases })}
										>
											Delete
										</Button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.keys.length > 0}
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No keys match the current filter.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmSchedule} onOpenChange={(o) => { if (!o) confirmSchedule = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Schedule key deletion</Dialog.Title>
			<Dialog.Description>
				Key <code class="font-mono text-xs">{confirmSchedule?.keyId}</code> will be scheduled for deletion.
				You have a waiting period to cancel before it is permanently destroyed.
			</Dialog.Description>
		</Dialog.Header>
		<div class="px-6 py-2">
			<Label for="delete-days" class="text-xs text-muted-foreground">Waiting period (days)</Label>
			<div class="mt-1.5 flex items-center gap-2">
				<Input
					id="delete-days"
					type="number"
					min="7"
					max="30"
					bind:value={scheduleDays}
					class="w-24 h-8 text-sm"
				/>
				<span class="text-xs text-muted-foreground">Min 7, max 30</span>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmSchedule = null)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleSchedule, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => (confirmSchedule = null)
				})}
			>
				<input type="hidden" name="keyId" value={confirmSchedule?.keyId} />
				<input type="hidden" name="days" value={scheduleDays} />
				<Button type="submit" variant="destructive">Schedule Deletion</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
