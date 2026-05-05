<script lang="ts">
	let { title, description }: { title: string; description?: string } = $props();
</script>

<div class="console-panel flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in-up sm:py-20">
	<div class="mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 shadow-[var(--shadow-sm)]">
		<svg class="size-5 text-muted-foreground/55" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
		</svg>
	</div>
	<p class="text-base font-semibold text-foreground">{title}</p>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
	{/if}
</div>
