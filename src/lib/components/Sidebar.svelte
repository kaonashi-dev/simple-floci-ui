<script lang="ts">
	import { page } from '$app/stores';
	import { servicesForProvider, serviceIcons, type ServiceDefinition } from '$lib/catalog';
	import { activeCloud, type CloudId } from '$lib/stores/activeCloud.svelte';
	import { cn } from '$lib/utils';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

	const dashboardLink = { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon };
	const DashboardIcon = dashboardLink.icon;

	type SidebarLink = { href: string; label: string; icon: typeof LayoutDashboardIcon; status: string; exact?: boolean };
	type SidebarDisabled = { label: string; icon: typeof LayoutDashboardIcon };
	type SidebarGroup = { label: string; prefix: string; links: SidebarLink[]; disabled: SidebarDisabled[] };

	function serviceLink(service: ServiceDefinition): SidebarLink {
		return {
			href: service.route,
			label: service.shortName ?? service.name,
			icon: serviceIcons[service.icon],
			status: service.status,
			exact: false
		};
	}

	function overviewLink(href: string): SidebarLink {
		return { href, label: 'Overview', icon: BoxesIcon, status: 'available', exact: true };
	}

	const groups: Record<CloudId, SidebarGroup> = {
		azure: {
			label: 'Azure',
			prefix: '/azure',
			links: [overviewLink('/azure'), ...servicesForProvider('azure').map(serviceLink)],
			disabled: []
		},
		gcp: {
			label: 'GCP',
			prefix: '/gcp',
			links: [overviewLink('/gcp'), ...servicesForProvider('gcp').map(serviceLink)],
			disabled: []
		},
		aws: {
			label: 'AWS',
			prefix: '/aws',
			links: servicesForProvider('aws').map(serviceLink),
			disabled: []
		}
	};

	const activeGroup = $derived(groups[activeCloud.cloud]);

	let { onNavigate }: { onNavigate?: () => void } = $props();

	function isActive(href: string, exact = false) {
		if (href === '/') return $page.url.pathname === '/';
		if (exact) return $page.url.pathname === href;
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
		<p class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">Console</p>

		<a
			href={dashboardLink.href}
			onclick={onNavigate}
			class={cn(
				'group flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors mb-3',
				isActive(dashboardLink.href)
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_2px_0_0_var(--sidebar-primary)]'
					: 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
			)}
		>
			<DashboardIcon class={cn('size-4 shrink-0', isActive(dashboardLink.href) ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80')} />
			<span class="truncate">{dashboardLink.label}</span>
		</a>

		<div class="mb-3">
			<div class="mb-1.5 flex items-center justify-between px-2">
				<p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">{activeGroup.label}</p>
				<code class="rounded border border-sidebar-border/50 px-1 py-px font-mono text-[9px] text-sidebar-foreground/35">{activeGroup.prefix}</code>
			</div>

			{#each activeGroup.links as link}
				{@const Icon = link.icon}
				<a
					href={link.href}
					onclick={onNavigate}
					class={cn(
						'group flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors mb-0.5',
						isActive(link.href, 'exact' in link && link.exact)
							? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[inset_2px_0_0_var(--sidebar-primary)]'
							: 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
					)}
				>
					<Icon class={cn('size-4 shrink-0', isActive(link.href, 'exact' in link && link.exact) ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80')} />
					<span class="truncate">{link.label}</span>
					{#if link.status === 'planned'}
						<span class="ml-auto rounded border border-sidebar-border/50 px-1 py-px font-mono text-[9px] text-sidebar-foreground/30">soon</span>
					{/if}
				</a>
			{/each}

			{#if activeGroup.disabled.length > 0}
				<div class="mt-1.5 space-y-0.5">
					{#each activeGroup.disabled as item}
						{@const Icon = item.icon}
						<div class="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm text-sidebar-foreground/25">
							<Icon class="size-4 shrink-0" />
							<span class="truncate">{item.label}</span>
							<span class="ml-auto rounded border border-sidebar-border/50 px-1 py-px font-mono text-[9px] text-sidebar-foreground/30">soon</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</nav>
