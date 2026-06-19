<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { clientAction } from '$lib/utils/clientAction';
	import { formatBytes } from '$lib/utils/formatBytes';
	import {
		connectionSettings,
		DEFAULT_AWS_CONNECTION,
		DEFAULT_AZURE_CONNECTION,
		DEFAULT_GCP_CONNECTION
	} from '$lib/stores/settings.svelte';
	import { checkConnection } from '$lib/floci/floci';
	import { checkAzureConnection } from '$lib/floci/azure';
	import { checkGcpConnection } from '$lib/floci/gcp';
	import { resetDb } from '$lib/floci/sqs-history';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { data } = $props();

	let showResetConfirm = $state(false);
	let testingAws = $state(false);
	let testingAzure = $state(false);
	let testingGcp = $state(false);

	// Editable copy of the per-dev connection (persisted to localStorage on save).
	let awsEndpoint = $state(connectionSettings.aws.endpoint);
	let awsRegion = $state(connectionSettings.aws.region);
	let awsAccessKeyId = $state(connectionSettings.aws.accessKeyId);
	let awsSecretAccessKey = $state(connectionSettings.aws.secretAccessKey);
	let azureEndpoint = $state(connectionSettings.azure.endpoint);
	let azureAccountName = $state(connectionSettings.azure.accountName);
	let gcpEndpoint = $state(connectionSettings.gcp.endpoint);
	let gcpProject = $state(connectionSettings.gcp.project);

	async function saveAwsConnection() {
		connectionSettings.saveAws({
			endpoint: awsEndpoint,
			region: awsRegion,
			accessKeyId: awsAccessKeyId,
			secretAccessKey: awsSecretAccessKey
		});
		testingAws = true;
		try {
			const status = await checkConnection();
			await invalidateAll();
			if (!status.ok) throw new Error(status.error ?? 'Could not connect');
			return { success: `AWS connected to ${status.endpoint}` };
		} finally {
			testingAws = false;
		}
	}

	async function saveAzureConnection() {
		connectionSettings.saveAzure({ endpoint: azureEndpoint, accountName: azureAccountName });
		testingAzure = true;
		try {
			await checkAzureConnection();
			await invalidateAll();
			return { success: `Azure connected to ${azureEndpoint}` };
		} finally {
			testingAzure = false;
		}
	}

	async function saveGcpConnection() {
		connectionSettings.saveGcp({ endpoint: gcpEndpoint, project: gcpProject });
		testingGcp = true;
		try {
			await checkGcpConnection();
			await invalidateAll();
			return { success: `GCP connected to ${gcpEndpoint}` };
		} finally {
			testingGcp = false;
		}
	}

	function restoreAwsDefaults() {
		awsEndpoint = DEFAULT_AWS_CONNECTION.endpoint;
		awsRegion = DEFAULT_AWS_CONNECTION.region;
		awsAccessKeyId = DEFAULT_AWS_CONNECTION.accessKeyId;
		awsSecretAccessKey = DEFAULT_AWS_CONNECTION.secretAccessKey;
	}

	function restoreAzureDefaults() {
		azureEndpoint = DEFAULT_AZURE_CONNECTION.endpoint;
		azureAccountName = DEFAULT_AZURE_CONNECTION.accountName;
	}

	function restoreGcpDefaults() {
		gcpEndpoint = DEFAULT_GCP_CONNECTION.endpoint;
		gcpProject = DEFAULT_GCP_CONNECTION.project;
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
			<h2 class="text-sm font-semibold">Floci runtime connections</h2>
		</div>
		<p class="text-xs text-muted-foreground/70">
			The UI talks directly from this browser to your local Floci AWS, Floci-AZ, and Floci-GCP runtimes.
			All values are stored only on this device.
		</p>

		<form
			method="POST"
			use:enhance={clientAction(saveAwsConnection)}
			class="console-panel space-y-3 p-4"
		>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">AWS / Floci core</p>
				<p class="mt-0.5 text-xs text-muted-foreground/60">AWS-compatible services exposed by Floci or LocalStack.</p>
			</div>
			<div class="space-y-1.5">
				<Label for="aws-endpoint" class="text-xs">Endpoint URL</Label>
				<Input id="aws-endpoint" bind:value={awsEndpoint} placeholder={DEFAULT_AWS_CONNECTION.endpoint} class="h-8 font-mono text-xs" />
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div class="space-y-1.5">
					<Label for="aws-region" class="text-xs">Region</Label>
					<Input id="aws-region" bind:value={awsRegion} placeholder="us-east-1" class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="aws-accessKeyId" class="text-xs">Access key ID</Label>
					<Input id="aws-accessKeyId" bind:value={awsAccessKeyId} placeholder="test" class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="aws-secretAccessKey" class="text-xs">Secret access key</Label>
					<Input id="aws-secretAccessKey" bind:value={awsSecretAccessKey} type="password" placeholder="test" class="h-8 font-mono text-xs" />
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm" disabled={testingAws}>
					{testingAws ? 'Testing…' : 'Save & test AWS'}
				</Button>
				<Button type="button" variant="ghost" size="sm" onclick={restoreAwsDefaults}>Restore defaults</Button>
			</div>
		</form>

		<form
			method="POST"
			use:enhance={clientAction(saveAzureConnection)}
			class="console-panel space-y-3 p-4"
		>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Azure / Floci-AZ</p>
				<p class="mt-0.5 text-xs text-muted-foreground/60">Default runtime at port 4577 using the local storage account.</p>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="azure-endpoint" class="text-xs">Endpoint URL</Label>
					<Input id="azure-endpoint" bind:value={azureEndpoint} placeholder={DEFAULT_AZURE_CONNECTION.endpoint} class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="azure-account" class="text-xs">Account name</Label>
					<Input id="azure-account" bind:value={azureAccountName} placeholder={DEFAULT_AZURE_CONNECTION.accountName} class="h-8 font-mono text-xs" />
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm" disabled={testingAzure}>
					{testingAzure ? 'Testing…' : 'Save & test Azure'}
				</Button>
				<Button type="button" variant="ghost" size="sm" onclick={restoreAzureDefaults}>Restore defaults</Button>
			</div>
		</form>

		<form
			method="POST"
			use:enhance={clientAction(saveGcpConnection)}
			class="console-panel space-y-3 p-4"
		>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">GCP / Floci-GCP</p>
				<p class="mt-0.5 text-xs text-muted-foreground/60">Default runtime at port 4588 scoped by project ID.</p>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<Label for="gcp-endpoint" class="text-xs">Endpoint URL</Label>
					<Input id="gcp-endpoint" bind:value={gcpEndpoint} placeholder={DEFAULT_GCP_CONNECTION.endpoint} class="h-8 font-mono text-xs" />
				</div>
				<div class="space-y-1.5">
					<Label for="gcp-project" class="text-xs">Project ID</Label>
					<Input id="gcp-project" bind:value={gcpProject} placeholder={DEFAULT_GCP_CONNECTION.project} class="h-8 font-mono text-xs" />
				</div>
			</div>
			<div class="flex gap-2">
				<Button type="submit" size="sm" disabled={testingGcp}>
					{testingGcp ? 'Testing…' : 'Save & test GCP'}
				</Button>
				<Button type="button" variant="ghost" size="sm" onclick={restoreGcpDefaults}>Restore defaults</Button>
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
