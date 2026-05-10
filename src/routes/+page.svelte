<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LockIcon from '@lucide/svelte/icons/lock';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import NetworkIcon from '@lucide/svelte/icons/network';
	import RadioTowerIcon from '@lucide/svelte/icons/radio-tower';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import ZapIcon from '@lucide/svelte/icons/zap';

	let { data } = $props();

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

	<!-- Services grid -->
	<div>
		<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Available Services</h2>
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Service</th>
						<th class="table-th">Description</th>
						<th class="table-th-right">Resources</th>
						<th class="table-th-right w-24">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each services as service}
						{@const Icon = service.icon}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
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
					{/each}
				</tbody>
			</table>
		</div>
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
