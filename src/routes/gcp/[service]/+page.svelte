<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import { servicesForProvider, serviceIcons } from '$lib/catalog';

	let { data } = $props();

	const relatedServices = $derived(
		servicesForProvider('gcp')
			.filter((service) => service.category === data.service.category && service.id !== data.service.id)
			.slice(0, 4)
	);
	const Icon = $derived(serviceIcons[data.service.icon]);
</script>

<div class="mx-auto w-full max-w-5xl space-y-5 animate-fade-in-up">
	<a href="/gcp" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
		<ArrowLeftIcon class="size-4" />
		GCP catalog
	</a>

	<div class="page-header">
		<div>
			<p class="console-subtle-label">GCP / {data.service.category}</p>
			<h1 class="mt-1.5 page-title">{data.service.name}</h1>
			<p class="mt-1 page-subtitle">{data.service.description}</p>
		</div>

		<span class="console-tag {data.service.status === 'available' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-muted/40 text-muted-foreground'}">
			{data.service.status}
		</span>
	</div>

	<div class="console-panel overflow-hidden">
		<div class="border-b border-border bg-muted/30 p-5">
			<div class="flex items-start gap-4">
				<span class="flex size-12 shrink-0 items-center justify-center rounded border border-border bg-card">
					<Icon class="size-5 text-primary" />
				</span>
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="text-lg font-semibold text-foreground">Dedicated GCP view reserved</h2>
						<code class="rounded border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{data.service.route}</code>
					</div>
					<p class="mt-1 max-w-2xl text-sm text-muted-foreground">
						This route exists so {data.service.name} can grow into its own Floci-GCP explorer instead of being forced into a generic multi-cloud screen.
					</p>
				</div>
			</div>
		</div>

		<div class="grid gap-5 p-5 md:grid-cols-[1.2fr_0.8fr]">
			<div class="space-y-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Implementation target</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Wire this page to the Floci-GCP {data.service.name} endpoints when the service-specific list, detail, and mutation flows are ready.
					</p>
				</div>

				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Protocols / APIs</p>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each data.service.protocols as protocol}
							<span class="rounded border border-border bg-muted/30 px-2 py-1 font-mono text-xs text-muted-foreground">{protocol}</span>
						{/each}
					</div>
				</div>
			</div>

			<div class="rounded border border-border bg-muted/20 p-4">
				<div class="flex items-center gap-2">
					<WrenchIcon class="size-4 text-primary" />
					<p class="text-sm font-semibold text-foreground">Next build step</p>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Add a service-specific loader/client first, then replace this placeholder with a dedicated page under {data.service.route}.
				</p>
			</div>
		</div>
	</div>

	{#if relatedServices.length > 0}
		<div>
			<h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Related {data.service.category}</h2>
			<div class="grid gap-2.5 sm:grid-cols-2">
				{#each relatedServices as service}
					<a href={service.route} class="group console-surface flex items-center justify-between gap-3 p-3 transition-colors hover:border-primary/40 hover:bg-muted/20">
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-foreground">{service.name}</p>
							<p class="truncate text-xs text-muted-foreground">{service.description}</p>
						</div>
						<ArrowRightIcon class="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
