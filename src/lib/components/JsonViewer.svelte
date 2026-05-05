<script lang="ts">
	let { value }: { value: unknown } = $props();
	const formatted = $derived(JSON.stringify(value, null, 2));
</script>

<pre class="max-h-96 overflow-auto rounded-xl border border-border/80 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 shadow-inner scrollbar-thin">{formatted}</pre>
