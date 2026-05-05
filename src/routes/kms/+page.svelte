<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { cn } from '$lib/utils';

	let { data, form } = $props();

	let showCreate = $state(false);
	let confirmSchedule: { keyId: string; aliases: string[] } | null = $state(null);
	let scheduleDays = $state(7);

	function stateColor(state?: string) {
		if (state === 'Enabled') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
		if (state === 'Disabled') return 'text-muted-foreground border-border bg-muted/30';
		if (state === 'PendingDeletion') return 'text-red-400 border-red-500/30 bg-red-500/10';
		return 'text-muted-foreground border-border';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="console-action-row">
		<div>
			<p class="console-subtle-label">Encryption</p>
			<h1 class="console-heading mt-2">KMS Keys</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{data.keys.length} key{data.keys.length !== 1 ? 's' : ''}
			</p>
		</div>
		<Button size="sm" onclick={() => (showCreate = !showCreate)}>
			<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Create Key
		</Button>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load keys" hint={data.error} />
	{/if}

	{#if form?.error}
		<ErrorPanel message={form.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/createKey"
			use:enhance={() => () => { showCreate = false; }}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="key-desc">Description (optional)</Label>
				<Input id="key-desc" name="description" placeholder="My encryption key" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>
					Cancel
				</Button>
			</div>
		</form>
	{/if}

	{#if data.keys.length === 0 && !data.error}
		<EmptyState title="No keys" description="Create a symmetric key to get started." />
	{:else}
		<div class="console-table-shell">
			<Table.Root>
				<Table.Header>
					<Table.Row class="border-b border-border bg-muted/30 hover:bg-muted/30">
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Key ID / Aliases</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">State</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Usage</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Rotation</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.keys as key}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<div class="space-y-1">
									<div class="flex items-center gap-1.5">
										<a href="/kms/{encodeURIComponent(key.keyId)}" class="font-mono text-xs font-medium transition-colors hover:text-primary">
											{key.keyId}
										</a>
										<CopyButton text={key.keyId} />
									</div>
									{#if key.aliases.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each key.aliases as alias}
												<span class="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
													{alias.replace('alias/', '')}
												</span>
											{/each}
										</div>
									{/if}
									{#if key.description}
										<p class="text-xs text-muted-foreground/60">{key.description}</p>
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell>
								<span class={cn('rounded border px-1.5 py-0.5 font-mono text-[10px]', stateColor(key.keyState))}>
									{key.keyState ?? '—'}
								</span>
							</Table.Cell>
							<Table.Cell class="font-mono text-xs text-muted-foreground">
								{key.keyUsage?.replace('_', ' ') ?? '—'}
							</Table.Cell>
							<Table.Cell>
								{#if key.rotationEnabled === true}
									<span class="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">on</span>
								{:else if key.rotationEnabled === false}
									<span class="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">off</span>
								{:else}
									<span class="font-mono text-xs text-muted-foreground/40">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="font-mono text-xs text-muted-foreground">{formatDate(key.creationDate)}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/kms/{encodeURIComponent(key.keyId)}">
										Open
									</Button>
									{#if key.keyState === 'Enabled'}
										<form method="POST" action="?/disableKey" use:enhance>
											<input type="hidden" name="keyId" value={key.keyId} />
											<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Disable</Button>
										</form>
									{:else if key.keyState === 'Disabled'}
										<form method="POST" action="?/enableKey" use:enhance>
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
											Schedule Delete
										</Button>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
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
			<form method="POST" action="?/scheduleDelete" use:enhance={() => () => { confirmSchedule = null; }}>
				<input type="hidden" name="keyId" value={confirmSchedule?.keyId} />
				<input type="hidden" name="days" value={scheduleDays} />
				<Button type="submit" variant="destructive">Schedule Deletion</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
