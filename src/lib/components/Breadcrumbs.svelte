<script lang="ts">
	let {
		bucket,
		prefix,
		rootHref = '/aws/s3',
		rootLabel = 'S3'
	}: { bucket: string; prefix: string; rootHref?: string; rootLabel?: string } = $props();

	const parts = $derived(() => {
		const segments = prefix.split('/').filter(Boolean);
		return segments.map((seg, i) => ({
			label: seg,
			prefix: segments.slice(0, i + 1).join('/') + '/'
		}));
	});
</script>

<nav class="flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
	<a href={rootHref} class="rounded px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{rootLabel}</a>
	<svg class="size-3 shrink-0 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
	</svg>
	<a href="{rootHref}/{encodeURIComponent(bucket)}" class="max-w-[14rem] truncate rounded px-1.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-primary">{bucket}</a>
	{#each parts() as part}
		<svg class="size-3 shrink-0 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
		</svg>
		<a
			href="{rootHref}/{encodeURIComponent(bucket)}?prefix={encodeURIComponent(part.prefix)}"
			class="max-w-[10rem] truncate rounded px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			{part.label}
		</a>
	{/each}
</nav>
