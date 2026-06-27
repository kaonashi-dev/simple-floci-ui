<script lang="ts">
	/**
	 * Dependency-free grouped bar chart. Used for throughput-over-time (multiple
	 * series per time bucket) and the latency histogram (a single series).
	 */
	export type BarSeries = { name: string; color: string };
	export type BarGroup = { label: string; values: number[] };

	let {
		series = [],
		groups = [],
		height = 200,
		formatValue = (v: number) => String(v),
		showLegend = true,
		emptyText = 'No data in range'
	}: {
		series?: BarSeries[];
		groups?: BarGroup[];
		height?: number;
		formatValue?: (v: number) => string;
		showLegend?: boolean;
		emptyText?: string;
	} = $props();

	let containerWidth = $state(640);

	const PAD = { top: 10, right: 12, bottom: 26, left: 40 };

	const hasData = $derived(
		groups.length > 0 && groups.some((g) => g.values.some((v) => v > 0))
	);

	const width = $derived(Math.max(280, containerWidth));
	const plotW = $derived(width - PAD.left - PAD.right);
	const plotH = $derived(height - PAD.top - PAD.bottom);

	const maxVal = $derived.by(() => {
		let m = 0;
		for (const g of groups) for (const v of g.values) if (v > m) m = v;
		return m <= 0 ? 1 : m * 1.12; // headroom
	});

	const slotW = $derived(groups.length > 0 ? plotW / groups.length : plotW);
	const groupGap = $derived(Math.min(6, slotW * 0.2));
	const barAreaW = $derived(slotW - groupGap);
	const barW = $derived(series.length > 0 ? barAreaW / series.length : barAreaW);

	function barX(groupIdx: number, seriesIdx: number): number {
		return PAD.left + groupIdx * slotW + groupGap / 2 + seriesIdx * barW;
	}
	function barY(v: number): number {
		return PAD.top + plotH - (v / maxVal) * plotH;
	}
	function barH(v: number): number {
		return Math.max(0, (v / maxVal) * plotH);
	}

	const yTicks = $derived.by(() => {
		const n = 4;
		return Array.from({ length: n + 1 }, (_, i) => (maxVal * i) / n);
	});

	// Thin out x labels when there are many buckets so they don't overlap.
	const labelStep = $derived(Math.max(1, Math.ceil(groups.length / 10)));
</script>

<div class="w-full" bind:clientWidth={containerWidth}>
	{#if !hasData}
		<div
			class="flex items-center justify-center rounded border border-dashed border-border/60 text-xs text-muted-foreground/60"
			style="height: {height}px"
		>
			{emptyText}
		</div>
	{:else}
		<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="bar chart">
			{#each yTicks as t}
				<line
					x1={PAD.left}
					y1={barY(t)}
					x2={width - PAD.right}
					y2={barY(t)}
					class="text-border"
					stroke="currentColor"
					stroke-width="1"
					stroke-opacity="0.35"
				/>
				<text
					x={PAD.left - 6}
					y={barY(t)}
					text-anchor="end"
					dominant-baseline="middle"
					class="fill-current text-muted-foreground/70"
					font-size="9"
				>
					{formatValue(t)}
				</text>
			{/each}

			{#each groups as g, gi}
				{#each g.values as v, si}
					{#if v > 0}
						<rect
							x={barX(gi, si)}
							y={barY(v)}
							width={Math.max(1, barW - 1)}
							height={barH(v)}
							fill={series[si]?.color ?? 'currentColor'}
							rx="1"
						>
							<title>{g.label} · {series[si]?.name ?? ''}: {formatValue(v)}</title>
						</rect>
					{/if}
				{/each}
				{#if gi % labelStep === 0}
					<text
						x={PAD.left + gi * slotW + slotW / 2}
						y={height - 8}
						text-anchor="middle"
						class="fill-current text-muted-foreground/60"
						font-size="9"
					>
						{g.label}
					</text>
				{/if}
			{/each}
		</svg>
	{/if}

	{#if showLegend && series.length > 1}
		<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
			{#each series as s}
				<span class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<span class="inline-block h-2 w-2 rounded-sm" style="background:{s.color}"></span>
					{s.name}
				</span>
			{/each}
		</div>
	{/if}
</div>
