<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { text, label = 'Copy' }: { text: string; label?: string } = $props();
	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={copy}
	class="h-7 gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors {copied ? 'text-emerald-600 dark:text-emerald-400' : 'hover:bg-muted hover:text-foreground'}"
>
	{#if copied}
		<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		</svg>
	{:else}
		<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
			<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
		</svg>
	{/if}
	{#if copied}Copied{:else}{label}{/if}
</Button>
