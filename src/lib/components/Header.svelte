<script lang="ts">
	import MenuIcon from '@lucide/svelte/icons/menu';
	import ServerCogIcon from '@lucide/svelte/icons/server-cog';
	import type { ConnectionStatus } from '$lib/types/common';

	let { connection, onMenuToggle }: { connection: ConnectionStatus; onMenuToggle?: () => void } = $props();
</script>

<header class="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground sm:px-4">
	{#if onMenuToggle}
		<button
			class="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
			onclick={onMenuToggle}
			aria-label="Toggle sidebar"
		>
			<MenuIcon class="size-4" />
		</button>
	{/if}

	<a href="/" class="flex min-w-0 items-center gap-3">
		<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-sm)]">
			<ServerCogIcon class="size-4" />
		</span>
		<span class="min-w-0">
			<span class="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">Floci Explorer</span>
			<span class="hidden text-[11px] text-sidebar-foreground/55 sm:block">Local AWS console</span>
		</span>
	</a>

	<div class="hidden h-6 w-px bg-sidebar-border sm:block"></div>
	<code class="hidden max-w-[30vw] truncate rounded-md border border-sidebar-border bg-sidebar-accent/55 px-2.5 py-1 font-mono text-[11px] text-sidebar-foreground/70 md:block">
		{connection.endpoint}
	</code>

	<div class="ml-auto flex items-center gap-2">
		{#if connection.ok}
			<div class="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs">
				<span class="pulse-dot size-1.5 rounded-full bg-emerald-500"></span>
				<span class="hidden text-emerald-200/90 sm:block">Connected</span>
			</div>
		{:else}
			<div class="flex items-center gap-1.5 rounded-full border border-destructive/35 bg-destructive/15 px-2.5 py-1 text-xs">
				<span class="size-1.5 rounded-full bg-destructive"></span>
				<span class="hidden text-destructive sm:block">Disconnected</span>
			</div>
		{/if}
	</div>
</header>
