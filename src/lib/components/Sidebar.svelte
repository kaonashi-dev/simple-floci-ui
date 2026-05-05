<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import RadioTowerIcon from '@lucide/svelte/icons/radio-tower';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';

	const links = [
		{
			href: '/',
			label: 'Dashboard',
			description: 'Overview',
			icon: LayoutDashboardIcon
		},
		{
			href: '/sqs',
			label: 'SQS',
			description: 'Queues',
			icon: MessageSquareIcon
		},
		{
			href: '/s3',
			label: 'S3',
			description: 'Buckets',
			icon: HardDriveIcon
		},
		{
			href: '/cognito',
			label: 'Cognito',
			description: 'Identity',
			icon: UsersRoundIcon
		},
		{
			href: '/kms',
			label: 'KMS',
			description: 'Keys',
			icon: KeyRoundIcon
		}
	];

	const disabled = [
		{
			label: 'DynamoDB',
			icon: DatabaseIcon
		},
		{
			label: 'Lambda',
			icon: SigmaIcon
		},
		{
			label: 'SNS',
			icon: RadioTowerIcon
		}
	];

	let { onNavigate }: { onNavigate?: () => void } = $props();

	function isActive(href: string) {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground shadow-[var(--shadow-lg)] lg:w-64 lg:shadow-none">
	<div class="mb-4 rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-3">
		<div class="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/90">
			<BoxesIcon class="size-4 text-primary" />
			AWS Local Services
		</div>
		<p class="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">Browse queues, buckets, identities, and keys in your Floci environment.</p>
	</div>

	<p class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">Navigation</p>

	{#each links as link}
		{@const Icon = link.icon}
		<a
			href={link.href}
			onclick={onNavigate}
			class={cn(
				'group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
				isActive(link.href)
					? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--sidebar-primary)]'
					: 'text-sidebar-foreground/64 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
			)}
		>
			<span class={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar/70 transition-colors', isActive(link.href) && 'border-primary/35 bg-primary/15 text-primary')}>
				<Icon class="size-4" />
			</span>
			<span class="min-w-0">
				<span class="block font-medium">{link.label}</span>
				<span class="block text-[11px] text-sidebar-foreground/42 group-hover:text-sidebar-foreground/60">{link.description}</span>
			</span>
			{#if isActive(link.href)}
				<span class="ml-auto size-1.5 rounded-full bg-primary"></span>
			{/if}
		</a>
	{/each}

	<div class="my-3 h-px bg-sidebar-border"></div>
	<p class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">Planned</p>

	{#each disabled as item}
		{@const Icon = item.icon}
		<div class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/28">
			<span class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/70 bg-sidebar/45">
				<Icon class="size-4" />
			</span>
			<span>{item.label}</span>
			<span class="ml-auto rounded-md border border-sidebar-border bg-sidebar-accent/30 px-1.5 py-0.5 font-mono text-[9px] text-sidebar-foreground/38">soon</span>
		</div>
	{/each}
</nav>
