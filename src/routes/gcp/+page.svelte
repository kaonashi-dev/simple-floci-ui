<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BoxesIcon from '@lucide/svelte/icons/boxes';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import SigmaIcon from '@lucide/svelte/icons/sigma';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import { GCP_SERVICES, type GcpServiceIcon } from '$lib/floci/gcp-catalog';

	let { data } = $props();

	const gcpIconMap: Record<GcpServiceIcon, typeof HardDriveIcon> = {
		storage: HardDriveIcon,
		messaging: MessageSquareIcon,
		database: DatabaseIcon,
		serverless: SigmaIcon,
		security: KeyRoundIcon,
		identity: UsersRoundIcon,
		containers: BoxesIcon,
		compute: ZapIcon,
		observability: ScrollTextIcon
	};

	const categories = $derived(
		Array.from(new Set(GCP_SERVICES.map((service) => service.category))).map((category) => ({
			category,
			services: GCP_SERVICES.filter((service) => service.category === category)
		}))
	);
	const availableCount = $derived(GCP_SERVICES.filter((service) => service.status === 'available').length);
	const plannedCount = $derived(GCP_SERVICES.length - availableCount);
	const gcpStatus = $derived(data.connection.gcp);
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div>
			<p class="console-subtle-label">GCP / /gcp</p>
			<h1 class="mt-1.5 page-title">Floci-GCP Services</h1>
			<p class="mt-1 page-subtitle">Provider-specific GCP routes. Cloud Storage is functional today; the rest are reserved for service-shaped explorers.</p>
		</div>

		<div class="console-panel min-w-72 p-3">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Runtime</p>
			<div class="mt-2 flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-sm font-medium text-foreground">Floci-GCP</p>
					<p class="mt-0.5 truncate font-mono text-xs text-muted-foreground" title={gcpStatus.endpoint}>{gcpStatus.endpoint}</p>
				</div>
				<span class="console-tag {gcpStatus.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-destructive/30 bg-destructive/8 text-destructive'}">
					{gcpStatus.ok ? 'ok' : 'off'}
				</span>
			</div>
		</div>
	</div>

	{#if !gcpStatus.ok}
		<div class="rounded border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
			<p class="font-medium">Floci-GCP is not reachable.</p>
			<p class="mt-0.5 break-words font-mono text-xs text-destructive/65">{gcpStatus.error ?? gcpStatus.endpoint}</p>
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Services</p>
			<p class="mt-1 font-mono text-lg font-semibold text-foreground">{GCP_SERVICES.length}</p>
			<p class="text-[10px] text-muted-foreground/60">under /gcp</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Available</p>
			<p class="mt-1 font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">{availableCount}</p>
			<p class="text-[10px] text-muted-foreground/60">browser-direct</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Planned</p>
			<p class="mt-1 font-mono text-lg font-semibold text-muted-foreground">{plannedCount}</p>
			<p class="text-[10px] text-muted-foreground/60">placeholder routes</p>
		</div>
		<div class="console-surface p-3">
			<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Categories</p>
			<p class="mt-1 font-mono text-lg font-semibold text-foreground">{categories.length}</p>
			<p class="text-[10px] text-muted-foreground/60">service domains</p>
		</div>
	</div>

	<div class="space-y-5">
		{#each categories as category}
			<section>
				<div class="mb-2 flex items-center justify-between gap-3">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{category.category}</h2>
					<span class="font-mono text-[10px] text-muted-foreground/50">{category.services.length} service{category.services.length === 1 ? '' : 's'}</span>
				</div>

				<div class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
					{#each category.services as service}
						{@const Icon = gcpIconMap[service.icon]}
						<a href={service.route} class="group console-panel p-4 transition-colors hover:border-primary/40 hover:bg-muted/20">
							<div class="flex items-start gap-3">
								<span class="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-muted/50">
									<Icon class="size-4 text-primary" />
								</span>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<h3 class="truncate text-sm font-semibold text-foreground">{service.name}</h3>
										<span class="console-tag {service.status === 'available' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border bg-muted/40 text-muted-foreground'}">
											{service.status}
										</span>
									</div>
									<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
									<div class="mt-3 flex flex-wrap gap-1">
										{#each service.protocols.slice(0, 3) as protocol}
											<span class="rounded border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70">{protocol}</span>
										{/each}
									</div>
								</div>
								<ArrowRightIcon class="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
