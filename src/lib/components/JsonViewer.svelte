<script lang="ts">
	let { value }: { value: unknown } = $props();
	const formatted = $derived(JSON.stringify(value, null, 2));
</script>

<pre class="max-h-96 overflow-auto rounded border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground/80 scrollbar-thin">{formatted}</pre>
