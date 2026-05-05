<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	const services = $derived([
		{
			href: '/sqs',
			label: 'SQS Queues',
			description: 'Inspect message flow and queue depth.',
			count: data.sqsCount,
			error: data.sqsError,
			icon: MessageSquareIcon
		},
		{
			href: '/s3',
			label: 'S3 Buckets',
			description: 'Browse objects, prefixes, uploads, and downloads.',
			count: data.s3Count,
			error: data.s3Error,
			icon: HardDriveIcon
		},
		{
			href: '/cognito',
			label: 'Cognito Pools',
			description: 'Manage local users, groups, and identities.',
			count: data.cognitoCount,
			error: data.cognitoError,
			icon: UsersRoundIcon
		},
		{
			href: '/kms',
			label: 'KMS Keys',
			description: 'Review keys, aliases, and rotation settings.',
			count: data.kmsCount,
			error: data.kmsError,
			icon: KeyRoundIcon
		}
	]);
</script>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 animate-fade-in-up">
	<section class="console-panel overflow-hidden">
		<div class="grid gap-0 lg:grid-cols-[1.5fr_0.8fr]">
			<div class="p-5 sm:p-7 lg:p-8">
				<p class="console-subtle-label">Floci local cloud</p>
				<div class="mt-4 max-w-3xl space-y-3">
					<h1 class="console-heading">Operational view for local AWS resources.</h1>
					<p class="text-sm leading-6 text-muted-foreground sm:text-base">
						Navigate the services that matter during development: queues, buckets, users, and encryption keys.
						The layout keeps high-signal actions close while preserving a clean AWS-console workflow.
					</p>
				</div>

				<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Button href="/sqs">Open SQS</Button>
					<Button href="/s3" variant="outline">Browse S3</Button>
				</div>
			</div>

			<div class="border-t border-border/80 bg-muted/35 p-5 sm:p-7 lg:border-l lg:border-t-0">
				<p class="console-subtle-label">Endpoint</p>
				<code class="mt-3 block overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
					{data.connection.endpoint}
				</code>
				<div class="mt-5 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
					<span class="flex size-10 items-center justify-center rounded-lg bg-muted">
						<ZapIcon class="size-5 {data.connection.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}" />
					</span>
					<div>
						<p class="text-sm font-semibold">{data.connection.ok ? 'Connected' : 'Disconnected'}</p>
						<p class="text-xs text-muted-foreground">{data.connection.ok ? 'Local AWS endpoint is reachable.' : 'Start LocalStack or the Floci container.'}</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	{#if !data.connection.ok}
		<div class="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 shadow-[var(--shadow-sm)]">
			<ShieldAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
			<div class="min-w-0">
				<p class="text-sm font-medium text-destructive">Floci is not reachable</p>
				<p class="mt-0.5 break-words font-mono text-xs text-destructive/65">Check that the Floci container is running at {data.connection.endpoint}</p>
			</div>
		</div>
	{/if}

	<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each services as service}
			{@const Icon = service.icon}
			<Card.Root class="group relative min-h-56 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[var(--shadow-md)]">
				<Card.Header class="space-y-0 px-5 pb-0">
					<div class="flex items-start justify-between gap-3">
						<span class="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/55 text-primary transition-colors group-hover:bg-accent">
							<Icon class="size-5" />
						</span>
						{#if service.error}
							<span class="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-medium text-destructive">error</span>
						{:else}
							<ArrowUpRightIcon class="size-4 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
						{/if}
					</div>
				</Card.Header>
				<Card.Content class="flex flex-1 flex-col px-5 pb-5 pt-5">
					<p class="font-mono text-4xl font-semibold tracking-tight tabular-nums text-foreground">{service.count ?? '—'}</p>
					<div class="mt-4">
						<a href={service.href} class="text-base font-semibold text-foreground transition-colors hover:text-primary">{service.label}</a>
						<p class="mt-1 text-sm leading-5 text-muted-foreground">{service.description}</p>
					</div>
					<Button href={service.href} variant="ghost" size="sm" class="mt-auto w-fit px-0 text-primary hover:bg-transparent hover:text-primary/80">
						Open service
						<ArrowUpRightIcon class="size-3.5" />
					</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.7fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>Console Flow</Card.Title>
				<Card.Description>Optimized for quick local debugging without leaving the browser.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-3 sm:grid-cols-3">
					{#each ['Inspect resource state', 'Act with safe controls', 'Copy IDs and endpoints'] as item, i}
						<div class="rounded-xl border border-border bg-muted/35 p-4">
							<p class="font-mono text-xs text-primary">0{i + 1}</p>
							<p class="mt-2 text-sm font-medium text-foreground">{item}</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Coming Soon</Card.Title>
				<Card.Description>Reserved navigation targets for the next local services.</Card.Description>
			</Card.Header>
			<Card.Content class="grid gap-2">
				{#each [{ label: 'DynamoDB', icon: DatabaseIcon }, { label: 'Lambda', icon: ZapIcon }, { label: 'SNS', icon: MessageSquareIcon }] as service}
					{@const Icon = service.icon}
					<div class="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/25 px-3 py-2.5 text-sm text-muted-foreground">
						<Icon class="size-4" />
						<span>{service.label}</span>
						<span class="ml-auto rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]">soon</span>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</section>
</div>
