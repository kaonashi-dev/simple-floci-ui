<script lang="ts">
	import { browser } from '$app/environment';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import ClockIcon from '@lucide/svelte/icons/clock';
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
	import XIcon from '@lucide/svelte/icons/x';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import { AZURE_SERVICES, type AzureServiceIcon } from '$lib/floci/azure-catalog';

	let { data } = $props();

	let searchQuery = $state('');
	let showErrorsOnly = $state(false);
	let showFavoritesOnly = $state(false);

	let favorites = $state<string[]>(
		browser ? JSON.parse(localStorage.getItem('dashboard-favorites') ?? '[]') : []
	);

	let recents = $state<string[]>(
		browser ? JSON.parse(localStorage.getItem('dashboard-recents') ?? '[]') : []
	);

	$effect(() => {
		if (browser) localStorage.setItem('dashboard-favorites', JSON.stringify(favorites));
	});

	function toggleFavorite(href: string) {
		favorites = favorites.includes(href)
			? favorites.filter((f) => f !== href)
			: [...favorites, href];
	}

	function trackVisit(href: string) {
		if (!browser) return;
		const next = [href, ...recents.filter((r) => r !== href)].slice(0, 4);
		recents = next;
		localStorage.setItem('dashboard-recents', JSON.stringify(next));
	}

	const providerPrefixes = [
		{ label: 'Azure', prefix: '/azure' },
		{ label: 'GCP', prefix: '/gcp' },
		{ label: 'AWS', prefix: '/' }
	];

	function prefixFor(href: string) {
		if (href.startsWith('/azure')) return '/azure';
		if (href.startsWith('/gcp')) return '/gcp';
		return '/';
	}

	const azureIconMap: Record<AzureServiceIcon, typeof HardDriveIcon> = {
		storage: HardDriveIcon,
		messaging: MessageSquareIcon,
		database: DatabaseIcon,
		serverless: SigmaIcon,
		config: SlidersIcon,
		security: KeyRoundIcon,
		networking: NetworkIcon,
		compute: ZapIcon,
		containers: BoxesIcon,
		observability: ScrollTextIcon,
		identity: UsersRoundIcon
	};

	const cloudStatuses = $derived([
		{ label: 'AWS', status: data.connection.aws },
		{ label: 'Azure', status: data.connection.azure },
		{ label: 'GCP', status: data.connection.gcp }
	]);
	const connectedClouds = $derived(cloudStatuses.filter((cloud) => cloud.status.ok).length);
	const disconnectedClouds = $derived(cloudStatuses.filter((cloud) => !cloud.status.ok));

	const services = $derived([
		...AZURE_SERVICES.map((service) => ({
			href: service.route,
			label: service.name,
			subtitle: service.category,
			description: service.description,
			count: service.countKey ? data.counts[service.countKey]?.count ?? null : null,
			error: service.countKey ? data.counts[service.countKey]?.error ?? null : null,
			unit: service.unit ?? 'resource',
			icon: azureIconMap[service.icon],
			status: service.status,
			protocols: service.protocols
		})),
		{ href: '/gcp/storage', label: 'GCP Storage', subtitle: 'Cloud Storage', description: 'Browse local Floci-GCP buckets and objects.', count: data.counts['gcp-storage']?.count ?? null, error: data.counts['gcp-storage']?.error ?? null, unit: 'bucket', icon: HardDriveIcon, status: 'available', protocols: ['REST', 'JSON'] },
		{ href: '/sqs', label: 'SQS', subtitle: 'Simple Queue Service', description: 'Inspect message flow and queue depth.', count: data.counts.sqs?.count ?? null, error: data.counts.sqs?.error ?? null, unit: 'queue', icon: MessageSquareIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/s3', label: 'S3', subtitle: 'Simple Storage Service', description: 'Browse objects, prefixes, and uploads.', count: data.counts.s3?.count ?? null, error: data.counts.s3?.error ?? null, unit: 'bucket', icon: HardDriveIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/cognito', label: 'Cognito', subtitle: 'Identity Provider', description: 'Manage local users, groups, and identities.', count: data.counts.cognito?.count ?? null, error: data.counts.cognito?.error ?? null, unit: 'pool', icon: UsersRoundIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/kms', label: 'KMS', subtitle: 'Key Management Service', description: 'Review keys, aliases, and rotation settings.', count: data.counts.kms?.count ?? null, error: data.counts.kms?.error ?? null, unit: 'key', icon: KeyRoundIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/lambda', label: 'Lambda', subtitle: 'Serverless Compute', description: 'List and invoke local Lambda functions.', count: data.counts.lambda?.count ?? null, error: data.counts.lambda?.error ?? null, unit: 'function', icon: SigmaIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/dynamodb', label: 'DynamoDB', subtitle: 'NoSQL Database', description: 'Browse tables and scan items.', count: data.counts.dynamodb?.count ?? null, error: data.counts.dynamodb?.error ?? null, unit: 'table', icon: DatabaseIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/sns', label: 'SNS', subtitle: 'Simple Notification Service', description: 'Manage topics and publish messages.', count: data.counts.sns?.count ?? null, error: data.counts.sns?.error ?? null, unit: 'topic', icon: RadioTowerIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/apigateway', label: 'API Gateway', subtitle: 'REST & HTTP APIs', description: 'Inspect REST and HTTP APIs and their routes.', count: data.counts.apigateway?.count ?? null, error: data.counts.apigateway?.error ?? null, unit: 'REST API', icon: NetworkIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/iam', label: 'IAM', subtitle: 'Identity & Access Management', description: 'Browse users, roles, and local policies.', count: data.counts.iam?.count ?? null, error: data.counts.iam?.error ?? null, unit: 'user', icon: ShieldIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/logs', label: 'CloudWatch Logs', subtitle: 'Log Management', description: 'Browse log groups, streams, and events.', count: data.counts.logs?.count ?? null, error: data.counts.logs?.error ?? null, unit: 'log group', icon: ScrollTextIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/eventbridge', label: 'EventBridge', subtitle: 'Event Bus', description: 'Manage event buses and rules.', count: data.counts.eventbridge?.count ?? null, error: data.counts.eventbridge?.error ?? null, unit: 'bus', icon: ZapIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/secrets', label: 'Secrets Manager', subtitle: 'Secret Storage', description: 'View and manage application secrets.', count: data.counts.secrets?.count ?? null, error: data.counts.secrets?.error ?? null, unit: 'secret', icon: LockIcon, status: 'available', protocols: ['AWS SDK'] },
		{ href: '/ssm', label: 'SSM Params', subtitle: 'Parameter Store', description: 'Browse and update SSM parameters.', count: data.counts.ssm?.count ?? null, error: data.counts.ssm?.error ?? null, unit: 'parameter', icon: SlidersIcon, status: 'available', protocols: ['AWS SDK'] }
	]);

	const comingSoon = [
		{ label: 'Messaging', detail: 'Azure Queue/Service Bus and GCP Pub/Sub', icon: MessageSquareIcon },
		{ label: 'Database', detail: 'Azure Cosmos DB and GCP Firestore/Datastore', icon: DatabaseIcon },
		{ label: 'Serverless', detail: 'Azure Functions and GCP Cloud Functions/Run', icon: SigmaIcon },
		{ label: 'Secrets & Keys', detail: 'Azure Key Vault and GCP Secret Manager/KMS', icon: LockIcon }
	];

	const totalResources = $derived(services.reduce((s, x) => s + (x.count ?? 0), 0));
	const erroringCount = $derived(services.filter((s) => s.error).length);
	const availableServices = $derived(services.filter((s) => s.status === 'available'));
	const plannedCount = $derived(services.filter((s) => s.status === 'planned').length);
	const healthyCount = $derived(availableServices.filter((s) => !s.error).length);
	const emptyCount = $derived(availableServices.filter((s) => !s.error && (s.count ?? 0) === 0).length);

	const filteredServices = $derived(
		services.filter((s) => {
			const matchesSearch =
				s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesError = !showErrorsOnly || !!s.error;
			const matchesFav = !showFavoritesOnly || favorites.includes(s.href);
			return matchesSearch && matchesError && matchesFav;
		})
	);

	const favServices = $derived(filteredServices.filter((s) => favorites.includes(s.href)));
	const otherServices = $derived(filteredServices.filter((s) => !favorites.includes(s.href)));
	const favServiceGroups = $derived(
		providerPrefixes
			.map((group) => ({
				...group,
				services: favServices.filter((service) => prefixFor(service.href) === group.prefix)
			}))
			.filter((group) => group.services.length > 0)
	);
	const otherServiceGroups = $derived(
		providerPrefixes
			.map((group) => ({
				...group,
				services: otherServices.filter((service) => prefixFor(service.href) === group.prefix)
			}))
			.filter((group) => group.services.length > 0)
	);

	const recentServices = $derived(
		recents
			.map((href) => services.find((s) => s.href === href))
			.filter((s): s is (typeof services)[number] => !!s)
	);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<!-- Page header -->
	<div class="page-header">
		<div>
			<p class="console-subtle-label">Overview</p>
			<h1 class="mt-1.5 page-title">Local Multi-Cloud Console</h1>
			<p class="mt-1 page-subtitle">Operational view for Floci AWS, Azure, and GCP local resources.</p>
		</div>

		<!-- Connection status card -->
		<div class="console-panel min-w-72 space-y-2 p-3">
			<div class="flex items-center gap-3">
			<span class="flex size-8 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
				<ZapIcon class="size-4 {connectedClouds === 3 ? 'text-emerald-600 dark:text-emerald-400' : connectedClouds > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}" />
			</span>
			<div class="min-w-0">
				<p class="text-sm font-medium leading-none">{connectedClouds}/3 runtimes connected</p>
				<p class="mt-1 text-[11px] text-muted-foreground">Configured in Settings per browser.</p>
			</div>
			</div>
			<div class="grid grid-cols-3 gap-1.5">
				{#each cloudStatuses as cloud}
					<div
						class="rounded border px-2 py-1 text-[10px]
							{cloud.status.ok
								? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
								: 'border-destructive/25 bg-destructive/8 text-destructive'}"
						title={`${cloud.status.endpoint}${cloud.status.error ? ` - ${cloud.status.error}` : ''}`}
					>
						<span class="font-semibold">{cloud.label}</span>
						<span class="ml-1 opacity-75">{cloud.status.ok ? 'ok' : 'off'}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	{#if disconnectedClouds.length > 0}
		<div class="flex items-start gap-3 rounded border border-destructive/30 bg-destructive/8 px-4 py-3">
			<ShieldAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" />
			<div class="min-w-0">
				<p class="text-sm font-medium text-destructive">Some Floci runtimes are not reachable</p>
				<p class="mt-0.5 break-words font-mono text-xs text-destructive/65">
					{disconnectedClouds.map((cloud) => `${cloud.label}: ${cloud.status.endpoint}`).join(' | ')}
				</p>
			</div>
		</div>
	{/if}

	<!-- Stats strip -->
	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Resources</p>
			<p class="mt-1 font-mono text-lg font-semibold text-foreground">{totalResources.toLocaleString()}</p>
			<p class="text-[10px] text-muted-foreground/60">across {services.length} services</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Healthy</p>
			<p class="mt-1 font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">{healthyCount}</p>
			<p class="text-[10px] text-muted-foreground/60">{emptyCount} empty, {plannedCount} planned</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Errors</p>
			<p class="mt-1 font-mono text-lg font-semibold {erroringCount > 0 ? 'text-destructive' : 'text-muted-foreground'}">{erroringCount}</p>
			<p class="text-[10px] text-muted-foreground/60">service{erroringCount !== 1 ? 's' : ''} reporting</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Favorites</p>
			<p class="mt-1 font-mono text-lg font-semibold text-amber-600 dark:text-amber-400">{favorites.length}</p>
			<p class="text-[10px] text-muted-foreground/60">pinned</p>
		</div>
	</div>

	{#if recentServices.length > 0 && !showErrorsOnly && !showFavoritesOnly && !searchQuery}
		<div>
			<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
				<ClockIcon class="size-3" />
				Recent
			</p>
			<div class="flex flex-wrap gap-2">
				{#each recentServices as s}
					{@const Icon = s.icon}
					<a
						href={s.href}
						onclick={() => trackVisit(s.href)}
						class="group flex items-center gap-2 rounded border border-border bg-card px-2.5 py-1.5 text-xs hover:border-primary/40 hover:bg-muted/40 transition-colors"
					>
						<Icon class="size-3.5 text-muted-foreground group-hover:text-primary" />
						<span class="font-medium">{s.label}</span>
						{#if s.count != null && !s.error}
							<span class="text-muted-foreground/60">{s.count}</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<div class="grid gap-2.5 md:grid-cols-4">
		{#each comingSoon as item}
			{@const Icon = item.icon}
			<div class="console-surface p-3 opacity-80">
				<div class="flex items-center gap-2">
					<span class="flex size-7 shrink-0 items-center justify-center rounded border border-border bg-muted/40">
						<Icon class="size-3.5 text-muted-foreground" />
					</span>
					<div class="min-w-0">
						<p class="text-xs font-semibold text-foreground">{item.label}</p>
						<p class="truncate text-[10px] text-muted-foreground" title={item.detail}>{item.detail}</p>
					</div>
				</div>
				<p class="mt-2 inline-flex rounded border border-sidebar-border/50 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">proxy/API phase</p>
			</div>
		{/each}
	</div>

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
						<a href={service.href} onclick={() => trackVisit(service.href)} class="font-medium text-foreground transition-colors hover:text-primary leading-none">
							{service.label}
						</a>
						<div class="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground leading-none">
							<span>{service.subtitle}</span>
							<code class="rounded border border-border/60 px-1 py-px font-mono text-[9px] text-muted-foreground/70">{prefixFor(service.href)}</code>
							{#if service.status === 'planned'}
								<span class="console-tag border-border bg-muted/40 text-muted-foreground">planned</span>
							{/if}
						</div>
					</div>
				</div>
			</td>
			<td class="px-4 py-3 text-sm text-muted-foreground">{service.description}</td>
			<td class="px-4 py-3 text-right font-mono tabular-nums">
				{#if service.error}
					<span class="console-tag border-destructive/30 text-destructive bg-destructive/8" title={service.error}>error</span>
				{:else if service.count != null}
					<span class="font-semibold text-foreground">{service.count}</span>
					<span class="ml-1 text-xs text-muted-foreground">{service.count === 1 ? service.unit : service.unit + 's'}</span>
				{:else}
					<span class="text-muted-foreground/50">—</span>
				{/if}
			</td>
			<td class="px-4 py-3 text-right">
				<a href={service.href} onclick={() => trackVisit(service.href)} class="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
					{service.status === 'planned' ? 'Details' : 'Open'}
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
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Available Services</h2>
			<div class="flex flex-wrap items-center gap-2">
				<label class="flex items-center gap-1.5 rounded border border-border bg-muted/30 px-2 py-1 text-xs hover:bg-muted/50 cursor-pointer">
					<input type="checkbox" bind:checked={showFavoritesOnly} class="size-3" />
					<StarIcon class="size-3 text-amber-500" />
					Favorites
				</label>
				<label class="flex items-center gap-1.5 rounded border border-border bg-muted/30 px-2 py-1 text-xs hover:bg-muted/50 cursor-pointer">
					<input type="checkbox" bind:checked={showErrorsOnly} class="size-3" />
					<span class="size-2 rounded-full bg-destructive"></span>
					Errors only
				</label>
				<div class="relative">
					<SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
					<input
						bind:value={searchQuery}
						placeholder="Search services…"
						class="h-8 w-52 rounded border border-border bg-muted/30 pl-8 pr-7 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
					/>
					{#if searchQuery}
						<button type="button" aria-label="Clear search" class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground" onclick={() => (searchQuery = '')}>
							<XIcon class="size-3.5" />
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Favorites section -->
		{#if favServices.length > 0 && !showFavoritesOnly}
			{#each favServiceGroups as group}
				<div>
					<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500/80">
						<StarIcon class="size-3 fill-amber-500/80" />
						Favorites / {group.label}
						<code class="rounded border border-amber-500/30 px-1 py-px font-mono text-[9px] text-amber-500/80">{group.prefix}</code>
					</p>
					<div class="console-table-shell">
						<table class="w-full text-sm">
							{@render tableHead()}
							<tbody>
								{#each group.services as service}
									{@render serviceRow(service)}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		{/if}

		<!-- All / remaining services -->
		{#if otherServices.length > 0 || filteredServices.length === 0 || showFavoritesOnly}
			{#if filteredServices.length === 0}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						{@render tableHead()}
						<tbody>
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-sm text-muted-foreground/50">
									{#if searchQuery}
										No services match "{searchQuery}"
									{:else if showErrorsOnly}
										No services are reporting errors.
									{:else if showFavoritesOnly}
										No favorites — star services to pin them.
									{:else}
										No services to display.
									{/if}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			{:else if showFavoritesOnly}
				{#each favServiceGroups as group}
					<div>
						<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
							{group.label}
							<code class="rounded border border-border/60 px-1 py-px font-mono text-[9px] text-muted-foreground/70">{group.prefix}</code>
						</p>
						<div class="console-table-shell">
							<table class="w-full text-sm">
								{@render tableHead()}
								<tbody>
									{#each group.services as service}
										{@render serviceRow(service)}
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			{:else}
				{#each otherServiceGroups as group}
					<div>
						<p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
							{favServices.length > 0 ? 'All Services / ' : ''}{group.label}
							<code class="rounded border border-border/60 px-1 py-px font-mono text-[9px] text-muted-foreground/70">{group.prefix}</code>
						</p>
						<div class="console-table-shell">
							<table class="w-full text-sm">
								{@render tableHead()}
								<tbody>
									{#each group.services as service}
										{@render serviceRow(service)}
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
</div>
