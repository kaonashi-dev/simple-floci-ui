<script lang="ts">
	let { bucket, prefix }: { bucket: string; prefix: string } = $props();

	const parts = $derived(() => {
		const segments = prefix.split('/').filter(Boolean);
		return segments.map((seg, i) => ({
			label: seg,
			prefix: segments.slice(0, i + 1).join('/') + '/'
		}));
	});
</script>

<nav class="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
	<a href="/s3" class="text-muted-foreground hover:text-foreground transition-colors text-xs">S3</a>
	<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
	</svg>
	<a href="/s3/{bucket}" class="font-medium text-foreground hover:text-primary transition-colors">{bucket}</a>
	{#each parts() as part}
		<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
		</svg>
		<a
			href="/s3/{bucket}?prefix={encodeURIComponent(part.prefix)}"
			class="text-muted-foreground hover:text-foreground transition-colors"
		>
			{part.label}
		</a>
	{/each}
</nav>
