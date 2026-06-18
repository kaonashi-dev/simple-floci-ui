<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { clientAction } from '$lib/utils/clientAction';
	import { formatBytes } from '$lib/utils/formatBytes';
	import { connectionSettings, DEFAULT_CONNECTION } from '$lib/stores/settings.svelte';
	import { checkConnection } from '$lib/floci/floci';
	import { resetDb } from '$lib/floci/sqs-history';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { data } = $props();

	let showResetConfirm = $state(false);
	let testing = $state(false);

	// Editable copy of the per-dev connection (persisted to localStorage on save).
	let endpoint = $state(connectionSettings.all.endpoint);
	let region = $state(connectionSettings.all.region);
	let accessKeyId = $state(connectionSettings.all.accessKeyId);
	let secretAccessKey = $state(connectionSettings.all.secretAccessKey);

	async function saveConnection() {
		connectionSettings.save({ endpoint, region, accessKeyId, secretAccessKey });
		testing = true;
		try {
			const status = await checkConnection();
			// Refresh the header connection indicator.
			await invalidateAll();
			if (!status.ok) throw new Error(status.error ?? 'Could not connect');
			return { success: `Connected to ${status.endpoint}` };
		} finally {
			testing = false;
		}
	}

	function restoreDefaults() {
		endpoint = DEFAULT_CONNECTION.endpoint;
		region = DEFAULT_CONNECTION.region;
		accessKeyId = DEFAULT_CONNECTION.accessKeyId;
		secretAccessKey = DEFAULT_CONNECTION.secretAccessKey;
	}

	async function handleReset() {
		resetDb();
		return { success: 'History cleared' };
	}
</script>

<div class="mx-auto w-full max-w-3xl space-y-8 animate-fade-in-up">
	<div>
		<h1 class="page-title">Settings</h1>
		<p class="mt-0.5 page-subtitle">Per-browser configuration for Floci Explorer</p>
	</div>

	<!-- Connection section -->
	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<PlugIcon class="size-4 text-muted-foreground" />
			<h2 class="text-sm font-semibold">Floci connection</h2>
		</div>
		<p class="text-xs text-muted-foreground/70">
			The UI talks to your <strong>local</strong> Floci/LocalStack instance directly from this browser.
			Stored only on this device. Default uses LocalStack's trusted-HTTPS loopback domain so it works in
			every browser.
		</p>

		<form
			method="POST"
			use:enhance={clientAction(saveConnection)}
			class="console-panel space-y-3 p-4"
		>
			<div class="space-y-1.5">
				<Label for="endpoint" class="text-xs">Endpoint URL</Label>
				<Input id="endpoint" bind:value={endpoint} placeholder={DEFAULT_CONNECTION.endpoint} class="h-8 font-mono text-xs" />
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="space-y-1.5">
					<Label for="region" class="text-xs">Region</Label>
					<Input id="region" bind:value={region} placeholder="us-east-1" class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="accessKeyId" class="text-xs">Access key ID</Label>
					<Input id="accessKeyId" bind:value={accessKeyId} placeholder="test" class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="secretAccessKey" class="text-xs">Secret access key</Label>
					<Input id="secretAccessKey" bind:value={secretAccessKey} type="password" placeholder="test" class="h-8 font-mono text-xs" />
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm" disabled={testing}>
					{testing ? 'Testing…' : 'Save & test'}
				</Button>
				<Button type="button" variant="ghost" size="sm" onclick={restoreDefaults}>Restore defaults</Button>
			</div>
		</form>
	</section>

	<!-- History section -->
	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<DatabaseIcon class="size-4 text-muted-foreground" />
			<h2 class="text-sm font-semibold">Message history</h2>
		</div>
		<p class="text-xs text-muted-foreground/70">
			SQS message history and metrics are stored locally in this browser — not shared with the hosted UI.
		</p>

		<div class="console-panel divide-y divide-border/60">
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

			<div class="flex items-center justify-between gap-4 px-4 py-3">
				<div>
					<p class="text-xs font-medium">Clear history</p>
					<p class="mt-0.5 text-xs text-muted-foreground/60">Permanently deletes all recorded message events. Queue data in Floci is not affected.</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={() => (showResetConfirm = true)}
				>
					<TrashIcon class="size-3.5" />
					Clear
				</Button>
			</div>
		</div>
	</section>
</div>

<Dialog.Root open={showResetConfirm} onOpenChange={(o) => (showResetConfirm = o)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Clear history</Dialog.Title>
			<Dialog.Description>
				All <strong>{data.db.totalEvents.toLocaleString()}</strong> recorded event{data.db.totalEvents !== 1 ? 's' : ''} will be permanently deleted.
				This cannot be undone. Floci queues and their messages are not affected.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showResetConfirm = false)}>Cancel</Button>
			<form
				method="POST"
				use:enhance={clientAction(handleReset, {
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
