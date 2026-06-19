<script lang="ts">
	import MenuIcon from '@lucide/svelte/icons/menu';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import ServerCogIcon from '@lucide/svelte/icons/server-cog';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme.svelte';
	import { activeCloud, CLOUD_LANDING, type CloudId } from '$lib/stores/activeCloud.svelte';
	import type { MultiCloudConnectionStatus } from '$lib/types/common';

	let { connection, onMenuToggle }: { connection: MultiCloudConnectionStatus; onMenuToggle?: () => void } = $props();

	const cloudStatuses = $derived([
		{ id: 'aws' as CloudId, label: 'AWS', status: connection.aws },
		{ id: 'azure' as CloudId, label: 'Azure', status: connection.azure },
		{ id: 'gcp' as CloudId, label: 'GCP', status: connection.gcp }
	]);
	const connectedCount = $derived(cloudStatuses.filter((cloud) => cloud.status.ok).length);

	function selectCloud(id: CloudId) {
		activeCloud.set(id);
		goto(CLOUD_LANDING[id]);
	}
</script>

<header class="flex h-11 shrink-0 items-center gap-3 border-b border-header-border bg-header px-3 text-header-foreground sm:px-4">
	{#if onMenuToggle}
		<button
			class="flex size-8 items-center justify-center rounded text-header-foreground/75 transition-colors hover:bg-header-foreground/10 hover:text-header-foreground lg:hidden"
			onclick={onMenuToggle}
			aria-label="Toggle sidebar"
		>
			<MenuIcon class="size-4" />
		</button>
	{/if}

	<a href="/" class="flex items-center gap-2.5 shrink-0">
		<span class="flex size-6 shrink-0 items-center justify-center rounded bg-header-foreground/15 text-header-foreground">
			<ServerCogIcon class="size-3.5" />
		</span>
		<span class="text-sm font-semibold tracking-tight text-header-foreground leading-none">Floci Explorer</span>
	</a>

	<div class="hidden h-4 w-px bg-header-foreground/20 sm:block"></div>

	<code class="hidden max-w-[28vw] truncate rounded border border-header-foreground/20 bg-header-foreground/10 px-2 py-0.5 font-mono text-[11px] text-header-foreground/70 lg:block">
		{connectedCount}/3 runtimes connected
	</code>

	<!-- Cloud switcher: re-skins the whole UI (chrome, nav, type, geometry) and navigates to the cloud's landing route -->
	<div
		class="flex items-center gap-0.5 rounded-md border border-header-foreground/15 bg-header-foreground/10 p-0.5"
		role="tablist"
		aria-label="Active cloud"
	>
		{#each cloudStatuses as cloud}
			{@const selected = activeCloud.cloud === cloud.id}
			<button
				type="button"
				role="tab"
				aria-selected={selected}
				onclick={() => selectCloud(cloud.id)}
				title={`Switch to ${cloud.label}`}
				class="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium leading-none transition-colors
					{selected
						? 'bg-header-foreground text-header shadow-[var(--shadow-2xs)]'
						: 'text-header-foreground/65 hover:bg-header-foreground/10 hover:text-header-foreground'}"
			>
				<span
					class="size-1.5 shrink-0 rounded-full {cloud.status.ok
						? 'bg-emerald-500'
						: selected
							? 'bg-header/40'
							: 'bg-red-400/70'}"
				></span>
				<span>{cloud.label}</span>
			</button>
		{/each}
	</div>

	<div class="ml-auto flex items-center gap-2">
		<button
			onclick={theme.toggle}
			class="flex size-7 items-center justify-center rounded text-header-foreground/65 transition-colors hover:bg-header-foreground/10 hover:text-header-foreground"
			aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{#if theme.dark}
				<SunIcon class="size-3.5" />
			{:else}
				<MoonIcon class="size-3.5" />
			{/if}
		</button>

		<a
			href="/settings"
			aria-label="Settings"
			class="flex size-7 items-center justify-center rounded transition-colors hover:bg-header-foreground/10
				{$page.url.pathname === '/settings'
					? 'bg-header-foreground/15 text-header-foreground'
					: 'text-header-foreground/65 hover:text-header-foreground'}"
		>
			<SettingsIcon class="size-3.5" />
		</a>

		<div class="hidden items-center gap-1 xl:flex">
			{#each cloudStatuses as cloud}
				<div
					class="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]
						{cloud.status.ok
							? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-50'
							: 'border-red-300/30 bg-red-400/15 text-red-50'}
						{activeCloud.cloud === cloud.id ? 'ring-1 ring-header-foreground/40' : ''}"
					title={`${cloud.label}: ${cloud.status.endpoint}${cloud.status.error ? ` - ${cloud.status.error}` : ''}`}
				>
					<span class="size-1.5 rounded-full {cloud.status.ok ? 'bg-emerald-400' : 'bg-red-400'}"></span>
					<span>{cloud.label}</span>
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-1.5 rounded-full border border-header-foreground/20 bg-header-foreground/10 px-2.5 py-1 text-[11px] text-header-foreground/80 xl:hidden">
			<span class="size-1.5 rounded-full {connectedCount === 3 ? 'bg-emerald-400' : connectedCount > 0 ? 'bg-amber-400' : 'bg-red-400'}"></span>
			<span>{connectedCount}/3</span>
		</div>
	</div>
</header>
