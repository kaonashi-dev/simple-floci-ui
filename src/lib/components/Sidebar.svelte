<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LockIcon from '@lucide/svelte/icons/lock';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import NetworkIcon from '@lucide/svelte/icons/network';
	import RadioTowerIcon from '@lucide/svelte/icons/radio-tower';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import SlidersIcon from '@lucide/svelte/icons/sliders';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import ZapIcon from '@lucide/svelte/icons/zap';

	const links = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/azure/storage', label: 'Azure Blob', icon: HardDriveIcon },
		{ href: '/gcp/storage', label: 'GCP Storage', icon: HardDriveIcon },
		{ href: '/sqs', label: 'SQS', icon: MessageSquareIcon },
		{ href: '/s3', label: 'S3', icon: HardDriveIcon },
		{ href: '/cognito', label: 'Cognito', icon: UsersRoundIcon },
		{ href: '/kms', label: 'KMS', icon: KeyRoundIcon },
		{ href: '/lambda', label: 'Lambda', icon: SigmaIcon },
		{ href: '/dynamodb', label: 'DynamoDB', icon: DatabaseIcon },
		{ href: '/sns', label: 'SNS', icon: RadioTowerIcon },
		{ href: '/apigateway', label: 'API Gateway', icon: NetworkIcon },
		{ href: '/iam', label: 'IAM', icon: ShieldIcon },
		{ href: '/logs', label: 'CloudWatch Logs', icon: ScrollTextIcon },
		{ href: '/eventbridge', label: 'EventBridge', icon: ZapIcon },
		{ href: '/secrets', label: 'Secrets Manager', icon: LockIcon },
		{ href: '/ssm', label: 'SSM Params', icon: SlidersIcon }
	];

	const disabled: { label: string; icon: typeof LayoutDashboardIcon }[] = [
		{ label: 'Azure Messaging', icon: MessageSquareIcon },
		{ label: 'Azure Cosmos DB', icon: DatabaseIcon },
		{ label: 'Azure Functions', icon: SigmaIcon },
		{ label: 'Azure Key Vault', icon: LockIcon },
		{ label: 'GCP Pub/Sub', icon: MessageSquareIcon },
		{ label: 'GCP Firestore', icon: DatabaseIcon },
		{ label: 'GCP Serverless', icon: SigmaIcon },
		{ label: 'GCP Secret Manager', icon: LockIcon }
	];

	let { onNavigate }: { onNavigate?: () => void } = $props();

	function isActive(href: string) {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="flex h-full w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
	<!-- Brand info block -->
	<div class="border-b border-sidebar-border px-4 py-3">
		<div class="flex items-center gap-2 text-xs text-sidebar-foreground/70">
			<BoxesIcon class="size-3.5 text-primary shrink-0" />
			<span class="font-medium">Local Cloud Services</span>
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto px-2 py-3">
		<p class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">Services</p>

		{#each links as link}
			{@const Icon = link.icon}
			<a
				href={link.href}
				onclick={onNavigate}
				class={cn(
					'group flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors mb-0.5',
					isActive(link.href)
						? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_2px_0_0_var(--sidebar-primary)]'
						: 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
				)}
			>
				<Icon class={cn('size-4 shrink-0', isActive(link.href) ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80')} />
				<span class="truncate">{link.label}</span>
			</a>
		{/each}

		{#if disabled.length > 0}
		<div class="my-3 h-px bg-sidebar-border/70"></div>
		<p class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/30">Coming Soon</p>

		{#each disabled as item}
			{@const Icon = item.icon}
			<div class="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm text-sidebar-foreground/25 mb-0.5">
				<Icon class="size-4 shrink-0" />
				<span class="truncate">{item.label}</span>
				<span class="ml-auto rounded border border-sidebar-border/50 px-1 py-px font-mono text-[9px] text-sidebar-foreground/30">soon</span>
			</div>
		{/each}
		{/if}
	</div>
</nav>
