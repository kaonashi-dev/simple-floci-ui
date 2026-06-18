<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import ListToolbar from '$lib/components/ListToolbar.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { createSecret, deleteSecret } from '$lib/floci/secrets';
	import { formatDate } from '$lib/utils/formatDate';

	let { data } = $props();

	let showCreate = $state(false);
	let confirmDeleteArn: string | null = $state(null);
	let confirmDeleteName: string | null = $state(null);
	let search = $state('');

	const filtered = $derived(
		data.secrets.filter((s) =>
			`${s.name} ${s.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
		)
	);

	async function handleCreate(fd: FormData) {
		const name = (fd.get('name') as string)?.trim();
		const value = (fd.get('value') as string)?.trim();
		const description = (fd.get('description') as string)?.trim() || undefined;
		if (!name) throw new Error('Secret name is required');
		if (!value) throw new Error('Secret value is required');
		await createSecret(name, value, description);
		return { success: `Secret "${name}" created` };
	}

	async function handleDelete(fd: FormData) {
		const arn = fd.get('arn') as string;
		if (!arn) throw new Error('ARN is required');
		await deleteSecret(arn);
		return { success: 'Secret deleted' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Security</p>
			<h1 class="mt-1.5 page-title">Secrets Manager</h1>
			<p class="mt-1 page-subtitle">View and manage application secrets.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={() => (showCreate = !showCreate)}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				Create Secret
			</Button>
		</div>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load secrets" hint={data.error} />
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
			<h2 class="text-sm font-semibold">Create Secret</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="secret-name" class="text-xs">Name</Label>
					<Input id="secret-name" name="name" placeholder="my-secret" required class="h-8 text-sm" />
				</div>
				<div class="space-y-1.5">
					<Label for="secret-desc" class="text-xs">Description (optional)</Label>
					<Input id="secret-desc" name="description" placeholder="What this secret is for" class="h-8 text-sm" />
				</div>
			</div>
			<div class="space-y-1.5">
				<Label for="secret-value" class="text-xs">Value</Label>
				<Textarea id="secret-value" name="value" placeholder={'{"key": "value"} or any string'} required rows={3} class="resize-none font-mono text-xs" />
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm">Create</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (showCreate = false)}>Cancel</Button>
			</div>
		</form>
	{/if}

	<ListToolbar bind:search placeholder="Filter secrets…" total={data.secrets.length} shown={filtered.length} unit="secret" />

	{#if data.secrets.length === 0 && !data.error}
		<EmptyState title="No secrets" description="Create a secret to store sensitive values." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Name</th>
						<th class="table-th">Description</th>
						<th class="table-th-right w-36">Last Changed</th>
						<th class="table-th-right w-32">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as secret}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-1.5">
									<a href="/secrets/{encodeURIComponent(secret.arn)}" class="font-medium text-foreground hover:text-primary transition-colors">
										{secret.name}
									</a>
									<CopyButton text={secret.arn} label="ARN" />
								</div>
							</td>
							<td class="px-4 py-3 text-muted-foreground text-sm">{secret.description ?? '—'}</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{formatDate(secret.lastChangedDate)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" href="/secrets/{encodeURIComponent(secret.arn)}">
										Open
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => { confirmDeleteArn = secret.arn; confirmDeleteName = secret.name; }}
									>
										Delete
									</Button>
								</div>
							</td>
						</tr>
					{/each}
					{#if filtered.length === 0 && data.secrets.length > 0}
						<tr>
							<td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground/60">
								No secrets match "{search}"
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteArn} onOpenChange={(o) => { if (!o) { confirmDeleteArn = null; confirmDeleteName = null; } }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete secret</Dialog.Title>
			<Dialog.Description>
				This will permanently delete <strong>{confirmDeleteName}</strong>. This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => { confirmDeleteArn = null; confirmDeleteName = null; }}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleDelete, {
					onSuccess: () => invalidateAll(),
					closeOnSuccess: () => { confirmDeleteArn = null; confirmDeleteName = null; }
				})}
			>
				<input type="hidden" name="arn" value={confirmDeleteArn} />
				<Button type="submit" variant="destructive">Delete Secret</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
