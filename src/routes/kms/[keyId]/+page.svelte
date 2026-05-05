<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { cn } from '$lib/utils';

	let { data, form } = $props();

	let showScheduleDelete = $state(false);
	let scheduleDays = $state(7);
	let showAddAlias = $state(false);
	let confirmDeleteAlias: string | null = $state(null);

	function stateColor(state?: string) {
		if (state === 'Enabled') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
		if (state === 'Disabled') return 'text-muted-foreground border-border bg-muted/30';
		if (state === 'PendingDeletion') return 'text-red-400 border-red-500/30 bg-red-500/10';
		return 'text-muted-foreground border-border';
	}
</script>

<div class="mx-auto w-full max-w-6xl space-y-6 animate-fade-in-up">
	<div>
		<nav class="mb-2 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/kms" class="rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">KMS</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<code class="truncate font-medium text-foreground">{data.keyId}</code>
		</nav>

		<div class="flex flex-wrap items-center gap-3">
			<h1 class="truncate font-mono text-xl font-semibold tracking-tight sm:text-2xl">{data.keyId}</h1>
			{#if data.key}
				<span class={cn('rounded border px-2 py-0.5 font-mono text-xs', stateColor(data.key.keyState))}>
					{data.key.keyState}
				</span>
			{/if}
		</div>

		{#if data.key?.keyArn}
			<div class="mt-2 flex max-w-full items-center gap-1.5">
				<code class="truncate font-mono text-xs text-muted-foreground">{data.key.keyArn}</code>
				<CopyButton text={data.key.keyArn} />
			</div>
		{/if}
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load key" hint={data.error} />
	{/if}

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if data.key}
		<!-- Metadata grid -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{#each [
				{ label: 'Key Usage', value: data.key.keyUsage?.replace(/_/g, ' ') ?? '—' },
				{ label: 'Key Spec', value: data.key.keySpec ?? '—' },
				{ label: 'Origin', value: data.key.origin ?? '—' },
				{ label: 'Multi-Region', value: data.key.multiRegion ? 'Yes' : 'No' },
				{ label: 'Created', value: formatDate(data.key.creationDate) },
				{ label: 'Deletion Date', value: data.key.deletionDate ? formatDate(data.key.deletionDate) : '—' }
			] as item}
				<div class="console-surface p-3">
					<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
					<p class="mt-1 font-mono text-sm text-foreground">{item.value}</p>
				</div>
			{/each}
		</div>

		{#if data.key.description}
			<div class="console-surface p-3">
				<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Description</p>
				<p class="mt-1 text-sm text-foreground">{data.key.description}</p>
			</div>
		{/if}

		<div class="h-px bg-border"></div>

		<!-- Aliases -->
		<div class="space-y-3">
			<div class="console-action-row">
				<h2 class="text-sm font-semibold">Aliases</h2>
				<Button size="sm" variant="outline" onclick={() => (showAddAlias = !showAddAlias)}>
					Add Alias
				</Button>
			</div>

			{#if showAddAlias}
				<form
					method="POST"
					action="?/createAlias"
					use:enhance={() => () => { showAddAlias = false; }}
					class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
				>
					<div class="flex-1 space-y-1.5">
						<Label for="alias-name" class="text-xs">Alias name <span class="text-muted-foreground">(without "alias/" prefix)</span></Label>
						<Input id="alias-name" name="name" placeholder="my-key-alias" required class="h-8 text-sm" />
					</div>
					<Button type="submit" size="sm">Add</Button>
					<Button type="button" variant="ghost" size="sm" onclick={() => (showAddAlias = false)}>Cancel</Button>
				</form>
			{/if}

			{#if data.aliases.length === 0}
				<p class="text-sm text-muted-foreground">No aliases — key referenced by ID only.</p>
			{:else}
				<div class="console-table-shell">
					{#each data.aliases as alias, i}
						<div class={cn(
							'flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
							i < data.aliases.length - 1 && 'border-b border-border/50'
						)}>
							<div class="flex items-center gap-2">
								<code class="font-mono text-sm text-foreground">{alias.name}</code>
								<CopyButton text={alias.name} />
							</div>
							<div class="flex flex-wrap items-center gap-3">
								<span class="font-mono text-xs text-muted-foreground">{formatDate(alias.lastUpdatedDate)}</span>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
									onclick={() => (confirmDeleteAlias = alias.name)}
								>
									Remove
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="h-px bg-border"></div>

		<!-- Key rotation -->
		<div class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-sm font-medium">Automatic Key Rotation</p>
				<p class="mt-0.5 text-xs text-muted-foreground">
					{#if data.key.rotationEnabled}
						Rotation is enabled. Key material rotates annually.
					{:else}
						Rotation is disabled. Key material does not change automatically.
					{/if}
				</p>
			</div>
			{#if data.key.rotationEnabled}
				<form method="POST" action="?/disableRotation" use:enhance>
					<Button type="submit" variant="outline" size="sm">Disable Rotation</Button>
				</form>
			{:else}
				<form method="POST" action="?/enableRotation" use:enhance>
					<Button type="submit" variant="outline" size="sm">Enable Rotation</Button>
				</form>
			{/if}
		</div>

		<div class="h-px bg-border"></div>

		<!-- Enable / disable / schedule deletion -->
		<div class="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 shadow-[var(--shadow-sm)]">
			<p class="text-sm font-medium text-foreground">Danger Zone</p>
			<div class="flex flex-wrap items-center gap-2">
				{#if data.key.keyState === 'Enabled'}
					<form method="POST" action="?/disable" use:enhance>
						<Button type="submit" variant="outline" size="sm" class="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
							Disable Key
						</Button>
					</form>
				{:else if data.key.keyState === 'Disabled'}
					<form method="POST" action="?/enable" use:enhance>
						<Button type="submit" variant="outline" size="sm">Enable Key</Button>
					</form>
				{/if}

				{#if data.key.keyState === 'PendingDeletion'}
					<form method="POST" action="?/cancelDelete" use:enhance>
						<Button type="submit" variant="outline" size="sm">Cancel Scheduled Deletion</Button>
					</form>
					{#if data.key.deletionDate}
						<span class="text-xs text-red-400">Deletes {formatDate(data.key.deletionDate)}</span>
					{/if}
				{:else}
					<Button
						variant="outline"
						size="sm"
						class="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
						onclick={() => (showScheduleDelete = true)}
					>
						Schedule Deletion
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Schedule deletion dialog -->
<Dialog.Root open={showScheduleDelete} onOpenChange={(o) => (showScheduleDelete = o)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Schedule key deletion</Dialog.Title>
			<Dialog.Description>
				The key will be permanently deleted after the waiting period. Decryption using this key
				will fail immediately. You can cancel before the date arrives.
			</Dialog.Description>
		</Dialog.Header>
		<div class="px-6 py-2">
			<Label for="sched-days" class="text-xs text-muted-foreground">Waiting period (days)</Label>
			<div class="mt-1.5 flex items-center gap-2">
				<Input id="sched-days" type="number" min="7" max="30" bind:value={scheduleDays} class="w-24 h-8 text-sm" />
				<span class="text-xs text-muted-foreground">Min 7, max 30</span>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showScheduleDelete = false)}>Cancel</Button>
			<form method="POST" action="?/scheduleDelete" use:enhance={() => () => { showScheduleDelete = false; }}>
				<input type="hidden" name="days" value={scheduleDays} />
				<Button type="submit" variant="destructive">Schedule Deletion</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete alias dialog -->
<Dialog.Root open={!!confirmDeleteAlias} onOpenChange={(o) => { if (!o) confirmDeleteAlias = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Remove alias</Dialog.Title>
			<Dialog.Description>
				Remove alias <code class="font-mono text-xs">{confirmDeleteAlias}</code>?
				The key will still exist but can no longer be referenced by this alias.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteAlias = null)}>Cancel</Button>
			<form method="POST" action="?/deleteAlias" use:enhance={() => () => { confirmDeleteAlias = null; }}>
				<input type="hidden" name="name" value={confirmDeleteAlias} />
				<Button type="submit" variant="destructive">Remove Alias</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
