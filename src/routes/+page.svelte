<script lang="ts">
	import { browser } from '$app/environment';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LockIcon from '@lucide/svelte/icons/lock';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import NetworkIcon from '@lucide/svelte/icons/network';
	import RadioTowerIcon from '@lucide/svelte/icons/radio-tower';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import StarIcon from '@lucide/svelte/icons/star';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import ZapIcon from '@lucide/svelte/icons/zap';

	let { data } = $props();

	let searchQuery = $state('');

	let favorites = $state<string[]>(
		browser ? JSON.parse(localStorage.getItem('dashboard-favorites') ?? '[]') : []
	);

	$effect(() => {
		if (browser) localStorage.setItem('dashboard-favorites', JSON.stringify(favorites));
	});

	function toggleFavorite(href: string) {
		favorites = favorites.includes(href)
			? favorites.filter((f) => f !== href)
			: [...favorites, href];
	}

	const services = $derived([
		{
			href: '/sqs',
			label: 'SQS',
			subtitle: 'Simple Queue Service',
			description: 'Inspect message flow and queue depth.',
			count: data.sqsCount,
			error: data.sqsError,
			unit: 'queue',
			icon: MessageSquareIcon
		},
		{
			href: '/s3',
			label: 'S3',
			subtitle: 'Simple Storage Service',
			description: 'Browse objects, prefixes, and uploads.',
			count: data.s3Count,
			error: data.s3Error,
			unit: 'bucket',
			icon: HardDriveIcon
		},
		{
			href: '/cognito',
			label: 'Cognito',
			subtitle: 'Identity Provider',
			description: 'Manage local users, groups, and identities.',
			count: data.cognitoCount,
			error: data.cognitoError,
			unit: 'pool',
			icon: UsersRoundIcon
		},
		{
			href: '/kms',
			label: 'KMS',
			subtitle: 'Key Management Service',
			description: 'Review keys, aliases, and rotation settings.',
			count: data.kmsCount,
			error: data.kmsError,
			unit: 'key',
			icon: KeyRoundIcon
		},
		{
			href: '/lambda',
			label: 'Lambda',
			subtitle: 'Serverless Compute',
			description: 'List and invoke local Lambda functions.',
			count: data.lambdaCount,
			error: data.lambdaError,
			unit: 'function',
			icon: SigmaIcon
		},
		{
			href: '/dynamodb',
			label: 'DynamoDB',
			subtitle: 'NoSQL Database',
			description: 'Browse tables and scan items.',
			count: data.dynamoCount,
			error: data.dynamoError,
			unit: 'table',
			icon: DatabaseIcon
		},
		{
			href: '/sns',
			label: 'SNS',
			subtitle: 'Simple Notification Service',
			description: 'Manage topics and publish messages.',
			count: data.snsCount,
			error: data.snsError,
			unit: 'topic',
			icon: RadioTowerIcon
		},
		{
			href: '/apigateway',
			label: 'API Gateway',
			subtitle: 'REST & HTTP APIs',
			description: 'Inspect REST and HTTP APIs and their routes.',
			count: data.apiGwCount,
			error: data.apiGwError,
			unit: 'REST API',
			icon: NetworkIcon
		},
		{
			href: '/iam',
			label: 'IAM',
			subtitle: 'Identity & Access Management',
			description: 'Browse users, roles, and local policies.',
			count: data.iamCount,
			error: data.iamError,
			unit: 'user',
			icon: ShieldIcon
		},
		{
			href: '/logs',
			label: 'CloudWatch Logs',
			subtitle: 'Log Management',
			description: 'Browse log groups, streams, and events.',
			count: data.logsCount,
			error: data.logsError,
			unit: 'log group',
			icon: ScrollTextIcon
		},
		{
			href: '/eventbridge',
			label: 'EventBridge',
			subtitle: 'Event Bus',
			description: 'Manage event buses and rules.',
			count: data.eventBridgeCount,
			error: data.eventBridgeError,
			unit: 'bus',
			icon: ZapIcon
		},
		{
			href: '/secrets',
			label: 'Secrets Manager',
			subtitle: 'Secret Storage',
			description: 'View and manage application secrets.',
			count: data.secretsCount,
			error: data.secretsError,
			unit: 'secret',
			icon: LockIcon
		},
		{
			href: '/ssm',
			label: 'SSM Params',
			subtitle: 'Parameter Store',
			description: 'Browse and update SSM parameters.',
			count: data.ssmCount,
			error: data.ssmError,
			unit: 'parameter',
			icon: SlidersIcon
		}
	]);

	const filteredServices = $derived(
		services.filter(
			(s) =>
				s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const favServices = $derived(filteredServices.filter((s) => favorites.includes(s.href)));
	const otherServices = $derived(filteredServices.filter((s) => !favorites.includes(s.href)));

	const upcoming: { label: string; icon: typeof MessageSquareIcon }[] = [];
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<!-- Page header -->
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Overview</p>
			<h1 class="mt-1.5 page-title">Local AWS Console</h1>
			<p class="mt-1 page-subtitle">Operational view for Floci local cloud resources.</p>
		</div>

		<!-- Connection status card -->
		<div class="console-panel flex min-w-64 items-center gap-3 p-3">
			<span class="flex size-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
				<ZapIcon class="size-4 {data.connection.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}" />
			</span>
			<div class="min-w-0">
				<p class="text-sm font-medium leading-none">{data.connection.ok ? 'Connected' : 'Disconnected'}</p>
				<code class="mt-1 block truncate font-mono text-[11px] text-muted-foreground">{data.connection.endpoint}</code>
			</div>
		</div>
	</div>

	{#if !data.connection.ok}
		<div class="flex items-start gap-3 rounded border border-destructive/30 bg-destructive/8 px-4 py-3">
			<ShieldAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
			<div class="min-w-0">
				<p class="text-sm font-medium text-destructive">Floci is not reachable</p>
				<p class="mt-0.5 break-words font-mono text-xs text-destructive/65">Check that the Floci container is running at {data.connection.endpoint}</p>
			</div>
		</div>
	{/if}

	<!-- Shared row snippet -->
	{#snippet serviceRow(service: (typeof services)[number])}
		{@const Icon = service.icon}
		{@const isFav = favorites.includes(service.href)}
		<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
			<td class="px-2 py-3 text-center">
				<button
					onclick={() => toggleFavorite(service.href)}
					class="rounded p-0.5 transition-colors hover:text-amber-500 {isFav ? 'text-amber-500' : 'text-muted-foreground/30'}"
					aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
				>
					<StarIcon class="size-3.5 {isFav ? 'fill-amber-500' : ''}" />
				</button>
			</td>
			<td class="px-4 py-3">
				<div class="flex items-center gap-2.5">
					<span class="flex size-7 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
						<Icon class="size-3.5 text-primary" />
					</span>
					<div>
						<a href={service.href} class="font-medium text-foreground transition-colors hover:text-primary leading-none">
							{service.label}
						</a>
						<p class="mt-0.5 text-xs text-muted-foreground leading-none">{service.subtitle}</p>
					</div>
				</div>
			</td>
			<td class="px-4 py-3 text-sm text-muted-foreground">{service.description}</td>
			<td class="px-4 py-3 text-right font-mono tabular-nums">
				{#if service.error}
					<span class="console-tag border-destructive/30 text-destructive bg-destructive/8">error</span>
				{:else if service.count != null}
					<span class="font-semibold text-foreground">{service.count}</span>
					<span class="ml-1 text-xs text-muted-foreground">{service.count === 1 ? service.unit : service.unit + 's'}</span>
				{:else}
					<span class="text-muted-foreground/50">—</span>
				{/if}
			</td>
			<td class="px-4 py-3 text-right">
				<a href={service.href} class="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
					Open
					<ArrowRightIcon class="size-3" />
				</a>
			</td>
		</tr>
	{/snippet}

	<!-- Shared table head snippet -->
	{#snippet tableHead()}
		<thead>
			<tr class="border-b border-border">
				<th class="table-th w-8"></th>
				<th class="table-th">Service</th>
				<th class="table-th">Description</th>
				<th class="table-th-right">Resources</th>
				<th class="table-th-right w-24">Status</th>
			</tr>
		</thead>
	{/snippet}

	<!-- Services grid -->
	<div class="space-y-4">
		<!-- Search header -->
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Available Services</h2>
			<div class="relative">
				<SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
				<input
					bind:value={searchQuery}
					placeholder="Search services…"
					class="h-8 w-52 rounded border border-border bg-muted/30 pl-8 pr-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
				/>
			</div>
		</div>

		<!-- Favorites section -->
		{#if favServices.length > 0}
			<div>
				<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500/80">
					<StarIcon class="size-3 fill-amber-500/80" />
					Favorites
				</p>
				<div class="console-table-shell">
					<table class="w-full text-sm">
						{@render tableHead()}
						<tbody>
							{#each favServices as service}
								{@render serviceRow(service)}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<!-- All / remaining services -->
		{#if otherServices.length > 0 || filteredServices.length === 0}
			<div>
				{#if favServices.length > 0}
					<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">All Services</p>
				{/if}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						{@render tableHead()}
						<tbody>
							{#each otherServices as service}
								{@render serviceRow(service)}
							{/each}
							{#if filteredServices.length === 0}
								<tr>
									<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/50">
										No services match "{searchQuery}"
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>

	<!-- Upcoming services -->
	{#if upcoming.length > 0}
	<div>
		<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Upcoming Services</h2>
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<tbody>
					{#each upcoming as service}
						{@const Icon = service.icon}
						<tr class="border-b border-border/40 last:border-0">
							<td class="px-4 py-2.5">
								<div class="flex items-center gap-2.5 text-muted-foreground/50">
									<span class="flex size-7 shrink-0 items-center justify-center rounded border border-border/50 bg-muted/25">
										<Icon class="size-3.5" />
									</span>
									<span>{service.label}</span>
								</div>
							</td>
							<td class="px-4 py-2.5 text-right">
								<span class="console-tag border-border/50 bg-muted/30 text-muted-foreground/50">soon</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	{/if}
</div>
