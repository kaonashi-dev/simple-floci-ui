<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { formatDate } from '$lib/utils/formatDate';
	import type { CloudStorageResource } from '$lib/types/cloud-storage';

	let {
		data,
		cloudName,
		serviceTitle,
		subtitle,
		rootHref,
		resourceLabel,
		namePlaceholder,
		createResource,
		deleteResource
	}: {
		data: { resources: CloudStorageResource[]; error: string | null };
		cloudName: string;
		serviceTitle: string;
		subtitle: string;
		rootHref: string;
		resourceLabel: string;
		namePlaceholder: string;
		createResource: (name: string) => Promise<void>;
		deleteResource: (name: string) => Promise<void>;
	} = $props();

	let showCreate = $state(false);
	let confirmDeleteName: string | null = $state(null);
	let search = $state('');

	const filtered = $derived(
		data.resources.filter((resource) => resource.name.toLowerCase().includes(search.toLowerCase()))
	);

	async function handleCreate(fd: FormData) {
		const name = (fd.get('name') as string)?.trim();
		if (!name) throw new Error(`${resourceLabel} name is required`);
		await createResource(name);
		return { success: `${resourceLabel} "${name}" created` };
	}

	async function handleDelete(fd: FormData) {
		const name = fd.get('name') as string;
		if (!name) throw new Error(`${resourceLabel} name is required`);
		await deleteResource(name);
		return { success: `${resourceLabel} "${name}" deleted` };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">{cloudName} Object Storage</p>
			<h1 class="mt-1.5 page-title">{serviceTitle}</h1>
			<p class="mt-1 page-subtitle">{subtitle}</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create {resourceLabel}
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message={`Could not load ${resourceLabel.toLowerCase()}s`} hint={data.error} />
	{/if}

	{#if showCreate}
		<form
			method="POST"
			use:enhance={clientAction(handleCreate, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => (showCreate = false)
			})}
			class="console-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
		>
			<div class="flex-1 space-y-1.5">
				<Label for="resource-name" class="text-xs">{resourceLabel} name</Label>
				<Input id="resource-name" name="name" placeholder={namePlaceholder} required class="h-8 text-sm" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder={`Filter ${resourceLabel.toLowerCase()}s...`} total={data.resources.length} shown={filtered.length} unit={resourceLabel.toLowerCase()} />

	{#if data.resources.length === 0 && !data.error}
		<EmptyState title={`No ${resourceLabel.toLowerCase()}s`} description={`Create a ${resourceLabel.toLowerCase()} to get started.`} />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Name</th>
						<th class="table-th">Type</th>
						<th class="table-th">Region</th>
						<th class="table-th">Created</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as resource}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<a href="{rootHref}/{encodeURIComponent(resource.name)}" class="font-medium text-foreground hover:text-primary transition-colors">
									{resource.name}
								</a>
							</td>
							<td class="px-4 py-3 text-xs text-muted-foreground">{resource.type}</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{resource.region ?? '-'}</td>
							<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDate(resource.createdAt ?? undefined)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="{rootHref}/{encodeURIComponent(resource.name)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDeleteName = resource.name)}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.resources.length > 0}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No {resourceLabel.toLowerCase()}s match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteName} onOpenChange={(o) => { if (!o) confirmDeleteName = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete {resourceLabel.toLowerCase()}</Dialog.Title>
			<Dialog.Description>
				Delete <strong>{confirmDeleteName}</strong>? It must be empty.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteName = null)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => (confirmDeleteName = null)
				})}
			>
				<input type="hidden" name="name" value={confirmDeleteName} />
				<Button type="submit" variant="destructive">Delete {resourceLabel}</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
