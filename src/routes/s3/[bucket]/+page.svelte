<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatBytes } from '$lib/utils/formatBytes';
	import { formatDate } from '$lib/utils/formatDate';

	let { data, form } = $props();

	let confirmDeleteKey: string | null = $state(null);
	let fileInput: HTMLInputElement;

	const totalItems = $derived(data.listing.folders.length + data.listing.files.length);
</script>

<div class="max-w-4xl space-y-5 animate-fade-in-up">
	<div class="flex items-start justify-between">
		<div class="space-y-1">
			<Breadcrumbs bucket={data.bucket} prefix={data.prefix} />
			<p class="text-xs text-muted-foreground">
				{totalItems} item{totalItems !== 1 ? 's' : ''}
			</p>
		</div>
		<form
			method="POST"
			action="?/uploadObject&prefix={encodeURIComponent(data.prefix)}"
			enctype="multipart/form-data"
			use:enhance
		>
			<input
				bind:this={fileInput}
				type="file"
				name="file"
				class="hidden"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			/>
			<Button type="button" size="sm" onclick={() => fileInput.click()}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
				</svg>
				Upload File
			</Button>
		</form>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not list objects" hint={data.error} />
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

	{#if totalItems === 0 && !data.error}
		<EmptyState title="Empty" description="Upload a file or navigate to a different prefix." />
	{:else}
		<div class="rounded border border-border overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row class="bg-muted/30 hover:bg-muted/30 border-b border-border">
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Name</Table.Head>
						<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Size</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Modified</Table.Head>
						<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.listing.folders as folder}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<a
									href="/s3/{encodeURIComponent(data.bucket)}?prefix={encodeURIComponent(folder.key)}"
									class="flex items-center gap-2 font-medium hover:text-primary transition-colors"
								>
									<svg class="size-4 shrink-0 text-primary/60" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
									</svg>
									{folder.name}
								</a>
							</Table.Cell>
							<Table.Cell>
								<span class="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">folder</span>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-xs text-muted-foreground">—</Table.Cell>
							<Table.Cell class="text-right font-mono text-xs text-muted-foreground">—</Table.Cell>
							<Table.Cell class="text-right">
								<CopyButton text={folder.key} label="Key" />
							</Table.Cell>
						</Table.Row>
					{/each}

					{#each data.listing.files as file}
						<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
							<Table.Cell>
								<div class="flex items-center gap-2">
									<svg class="size-4 shrink-0 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<span class="max-w-xs truncate font-medium" title={file.name}>{file.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								<span class="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">file</span>
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-xs tabular-nums text-muted-foreground">
								{file.size != null ? formatBytes(file.size) : '—'}
							</Table.Cell>
							<Table.Cell class="text-right font-mono text-xs text-muted-foreground">{formatDate(file.lastModified)}</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<CopyButton text={file.key} label="Key" />
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs"
										href="/api/s3/preview?bucket={encodeURIComponent(data.bucket)}&key={encodeURIComponent(file.key)}"
										target="_blank"
									>
										Preview
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs"
										href="/api/s3/download?bucket={encodeURIComponent(data.bucket)}&key={encodeURIComponent(file.key)}"
									>
										Download
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDeleteKey = file.key)}
									>
										Delete
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>

<Dialog.Root open={!!confirmDeleteKey} onOpenChange={(o) => { if (!o) confirmDeleteKey = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete object</Dialog.Title>
			<Dialog.Description class="break-all">
				Delete <strong>{confirmDeleteKey}</strong>? This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteKey = null)}>Cancel</Button>
			<form method="POST" action="?/deleteObject" use:enhance={() => () => { confirmDeleteKey = null; }}>
				<input type="hidden" name="key" value={confirmDeleteKey} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
