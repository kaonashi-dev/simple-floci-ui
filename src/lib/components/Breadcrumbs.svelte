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

<nav class="flex min-w-0 flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
	<a href="/s3" class="rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">S3</a>
	<svg class="size-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
		<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
	</svg>
	<a href="/s3/{bucket}" class="max-w-[14rem] truncate rounded-md px-1.5 py-1 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary">{bucket}</a>
	{#each parts() as part}
		<svg class="size-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4"/>
		</svg>
		<a
			href="/s3/{bucket}?prefix={encodeURIComponent(part.prefix)}"
			class="max-w-[10rem] truncate rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			{part.label}
		</a>
	{/each}
</nav>
