<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import XIcon from '@lucide/svelte/icons/x';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';

	let {
		search = $bindable(''),
		placeholder = 'Search…',
		total,
		shown,
		unit = 'item',
		children
	}: {
		search?: string;
		placeholder?: string;
		total: number;
		shown?: number;
		unit?: string;
		children?: Snippet;
	} = $props();

	let refreshing = $state(false);

	async function handleRefresh() {
		refreshing = true;
		try {
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}

	const filtered = $derived(shown !== undefined && shown !== total);
</script>

<div class="console-action-row">
	<p class="text-xs text-muted-foreground">
		{#if filtered}
			<span class="font-medium text-foreground">{shown}</span> of {total} {unit}{total !== 1 ? 's' : ''}
		{:else}
			<span class="font-medium text-foreground">{total}</span> {unit}{total !== 1 ? 's' : ''}
		{/if}
	</p>
	<div class="flex flex-wrap items-center gap-2">
		<div class="relative">
			<SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
			<input
				bind:value={search}
				{placeholder}
				class="h-8 w-56 rounded border border-border bg-muted/30 pl-8 pr-7 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
			/>
			{#if search}
				<button
					type="button"
					aria-label="Clear search"
					class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
					onclick={() => (search = '')}
				>
					<XIcon class="size-3.5" />
				</button>
			{/if}
		</div>
		<Button
			variant="ghost"
			size="sm"
			class="h-8 px-2"
			onclick={handleRefresh}
			disabled={refreshing}
			title="Refresh"
		>
			<RefreshCwIcon class="size-3.5 {refreshing ? 'animate-spin' : ''}" />
		</Button>
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
