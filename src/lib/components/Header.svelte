<script lang="ts">
	import MenuIcon from '@lucide/svelte/icons/menu';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import ServerCogIcon from '@lucide/svelte/icons/server-cog';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme.svelte';
	import type { ConnectionStatus } from '$lib/types/common';

	let { connection, onMenuToggle }: { connection: ConnectionStatus; onMenuToggle?: () => void } = $props();
</script>

<header class="flex h-11 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground sm:px-4">
	{#if onMenuToggle}
		<button
			class="flex size-8 items-center justify-center rounded text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
			onclick={onMenuToggle}
			aria-label="Toggle sidebar"
		>
			<MenuIcon class="size-4" />
		</button>
	{/if}

	<a href="/" class="flex items-center gap-2.5 shrink-0">
		<span class="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
			<ServerCogIcon class="size-3.5" />
		</span>
		<span class="text-sm font-semibold tracking-tight text-sidebar-foreground leading-none">Floci Explorer</span>
	</a>

	<div class="hidden h-4 w-px bg-sidebar-border/60 sm:block"></div>

	<code class="hidden max-w-[28vw] truncate rounded border border-sidebar-border/70 bg-sidebar-accent/35 px-2 py-0.5 font-mono text-[11px] text-sidebar-foreground/55 md:block">
		{connection.endpoint}
	</code>

	<div class="ml-auto flex items-center gap-2">
		<button
			onclick={theme.toggle}
			class="flex size-7 items-center justify-center rounded text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
			class="flex size-7 items-center justify-center rounded transition-colors hover:bg-sidebar-accent
				{$page.url.pathname === '/settings'
					? 'text-sidebar-accent-foreground bg-sidebar-accent'
					: 'text-sidebar-foreground/60 hover:text-sidebar-accent-foreground'}"
		>
			<SettingsIcon class="size-3.5" />
		</a>

		{#if connection.ok}
			<div class="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px]">
				<span class="pulse-dot size-1.5 rounded-full bg-emerald-500"></span>
				<span class="hidden text-emerald-300/80 sm:block">Connected</span>
			</div>
		{:else}
			<div class="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/12 px-2.5 py-1 text-[11px]">
				<span class="size-1.5 rounded-full bg-destructive"></span>
				<span class="hidden text-destructive/80 sm:block">Disconnected</span>
			</div>
		{/if}
	</div>
</header>
