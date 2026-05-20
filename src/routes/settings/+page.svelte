<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { toastingEnhance } from '$lib/utils/formEnhance';
	import { formatBytes } from '$lib/utils/formatBytes';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { data, form } = $props();

	let showResetConfirm = $state(false);
</script>

<div class="mx-auto w-full max-w-3xl space-y-8 animate-fade-in-up">
	<div>
		<h1 class="page-title">Settings</h1>
		<p class="mt-0.5 page-subtitle">Local configuration for Floci Explorer</p>
	</div>

	<!-- Database section -->
	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<DatabaseIcon class="size-4 text-muted-foreground" />
			<h2 class="text-sm font-semibold">Database</h2>
		</div>
		<p class="text-xs text-muted-foreground/70">
			Local SQLite database that stores message history and metrics. Created automatically on first run — no configuration required.
		</p>

		<div class="console-panel divide-y divide-border/60">
			<!-- DB stats row -->
			<div class="grid grid-cols-3 gap-px">
				<div class="p-4">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Location</p>
					<code class="mt-1 block truncate font-mono text-xs text-foreground/80" title={data.db.path}>{data.db.path}</code>
				</div>
				<div class="p-4">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Size</p>
					<p class="mt-1 font-mono text-sm font-semibold text-foreground">{formatBytes(data.db.sizeBytes)}</p>
				</div>
				<div class="p-4">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Events</p>
					<p class="mt-1 font-mono text-sm font-semibold text-foreground">{data.db.totalEvents.toLocaleString()}</p>
				</div>
			</div>

			<!-- Reset action row -->
			<div class="flex items-center justify-between gap-4 px-4 py-3">
				<div>
					<p class="text-xs font-medium">Reset database</p>
					<p class="mt-0.5 text-xs text-muted-foreground/60">Permanently deletes all recorded message events. Queue data in AWS is not affected.</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={() => (showResetConfirm = true)}
				>
					<TrashIcon class="size-3.5" />
					Reset
				</Button>
			</div>
		</div>
	</section>
</div>

<Dialog.Root open={showResetConfirm} onOpenChange={(o) => (showResetConfirm = o)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Reset database</Dialog.Title>
			<Dialog.Description>
				All <strong>{data.db.totalEvents.toLocaleString()}</strong> recorded event{data.db.totalEvents !== 1 ? 's' : ''} will be permanently deleted.
				This cannot be undone. AWS queues and their messages are not affected.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showResetConfirm = false)}>Cancel</Button>
			<form
				method="POST"
				action="?/resetDb"
				use:enhance={toastingEnhance({
					successMessage: 'Database reset',
					closeOnSuccess: () => {
						showResetConfirm = false;
						invalidateAll();
					}
				})}
			>
				<Button type="submit" variant="destructive">Delete all events</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
