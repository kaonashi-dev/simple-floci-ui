<script lang="ts">
	import type { ConnectionStatus } from '$lib/types/common';

	let { connection, onMenuToggle }: { connection: ConnectionStatus; onMenuToggle?: () => void } = $props();
</script>

<header class="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4">
	<!-- Mobile hamburger -->
	{#if onMenuToggle}
		<button
			class="flex h-7 w-7 items-center justify-center rounded hover:bg-accent lg:hidden"
			onclick={onMenuToggle}
			aria-label="Toggle sidebar"
		>
			<svg class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	{/if}

	<!-- Logo -->
	<a href="/" class="flex items-center gap-2.5">
		<svg
			class="h-4.5 w-4.5 shrink-0 text-primary"
			viewBox="0 0 20 20"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect x="0" y="0" width="20" height="6" rx="1.5" />
			<rect x="0" y="8" width="14" height="6" rx="1.5" opacity="0.6" />
			<rect x="0" y="16" width="9" height="4" rx="1.5" opacity="0.32" />
		</svg>
		<span class="text-sm font-semibold tracking-tight text-foreground">
			simple-floci-ui
		</span>
	</a>

	<!-- Separator + endpoint (hidden on very small screens) -->
	<div class="hidden h-4 w-px bg-border sm:block"></div>
	<code class="hidden rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground sm:block">
		{connection.endpoint}
	</code>

	<!-- Status -->
	<div class="ml-auto flex items-center gap-2">
		{#if connection.ok}
			<div class="flex items-center gap-1.5 rounded border border-border bg-muted/40 px-2 py-1 text-xs">
				<span class="pulse-dot size-1.5 rounded-full bg-emerald-500"></span>
				<span class="hidden text-muted-foreground sm:block">Connected</span>
			</div>
		{:else}
			<div class="flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs">
				<span class="size-1.5 rounded-full bg-destructive"></span>
				<span class="hidden text-destructive sm:block">Disconnected</span>
			</div>
		{/if}
	</div>
</header>
