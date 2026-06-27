<script lang="ts">
	/**
	 * Minimal dependency-free multi-series line/area chart. Width is measured from
	 * the container so strokes stay crisp at any size; height is fixed via prop.
	 */
	export type LinePoint = { x: number; y: number };
	export type LineSeries = {
		name: string;
		color: string;
		points: LinePoint[];
		/** Fill the area under the line with a faint tint of `color`. */
		area?: boolean;
	};

	let {
		series = [],
		height = 180,
		formatX = (x: number) => String(x),
		formatY = (y: number) => String(y),
		yMin = 0,
		showLegend = true,
		yUnit = '',
		emptyText = 'No data in range'
	}: {
		series?: LineSeries[];
		height?: number;
		formatX?: (x: number) => string;
		formatY?: (y: number) => string;
		yMin?: number | null;
		showLegend?: boolean;
		yUnit?: string;
		emptyText?: string;
	} = $props();

	let containerWidth = $state(640);

	const PAD = { top: 10, right: 12, bottom: 22, left: 44 };

	const allPoints = $derived(series.flatMap((s) => s.points));
	const hasData = $derived(allPoints.length > 0);

	const width = $derived(Math.max(280, containerWidth));
	const plotW = $derived(width - PAD.left - PAD.right);
	const plotH = $derived(height - PAD.top - PAD.bottom);

	const domain = $derived.by(() => {
		if (!hasData) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
		let minX = Infinity,
			maxX = -Infinity,
			maxY = -Infinity,
			dataMinY = Infinity;
		for (const p of allPoints) {
			if (p.x < minX) minX = p.x;
			if (p.x > maxX) maxX = p.x;
			if (p.y > maxY) maxY = p.y;
			if (p.y < dataMinY) dataMinY = p.y;
		}
		const lo = yMin == null ? Math.min(0, dataMinY) : yMin;
		let hi = maxY;
		if (hi <= lo) hi = lo + 1; // flat series → give the axis some height
		else hi = hi + (hi - lo) * 0.12; // headroom
		return { minX, maxX: maxX === minX ? minX + 1 : maxX, minY: lo, maxY: hi };
	});

	function sx(x: number): number {
		const { minX, maxX } = domain;
		return PAD.left + ((x - minX) / (maxX - minX)) * plotW;
	}
	function sy(y: number): number {
		const { minY, maxY } = domain;
		return PAD.top + plotH - ((y - minY) / (maxY - minY)) * plotH;
	}

	const yTicks = $derived.by(() => {
		const { minY, maxY } = domain;
		const n = 4;
		return Array.from({ length: n + 1 }, (_, i) => minY + ((maxY - minY) * i) / n);
	});

	const xTicks = $derived.by(() => {
		if (!hasData) return [] as number[];
		const { minX, maxX } = domain;
		const n = Math.min(5, Math.max(2, Math.floor(plotW / 90)));
		return Array.from({ length: n + 1 }, (_, i) => minX + ((maxX - minX) * i) / n);
	});

	function linePath(points: LinePoint[]): string {
		if (points.length === 0) return '';
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
			.join(' ');
	}
	function areaPath(points: LinePoint[]): string {
		if (points.length === 0) return '';
		const base = sy(domain.minY).toFixed(1);
		const top = points
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
			.join(' ');
		return `${top} L${sx(points[points.length - 1].x).toFixed(1)},${base} L${sx(points[0].x).toFixed(1)},${base} Z`;
	}
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
		<svg
			{width}
			{height}
			viewBox="0 0 {width} {height}"
			role="img"
			aria-label="line chart"
			class="overflow-visible"
		>
			<!-- gridlines + y labels -->
			{#each yTicks as t}
				<line
					x1={PAD.left}
					y1={sy(t)}
					x2={width - PAD.right}
					y2={sy(t)}
					class="text-border"
					stroke="currentColor"
					stroke-width="1"
					stroke-opacity="0.35"
				/>
				<text
					x={PAD.left - 6}
					y={sy(t)}
					text-anchor="end"
					dominant-baseline="middle"
					class="fill-current text-muted-foreground/70"
					font-size="9"
				>
					{formatY(t)}
				</text>
			{/each}

			<!-- x labels -->
			{#each xTicks as t, i}
				<text
					x={sx(t)}
					y={height - 6}
					text-anchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
					class="fill-current text-muted-foreground/60"
					font-size="9"
				>
					{formatX(t)}
				</text>
			{/each}

			<!-- series -->
			{#each series as s}
				{#if s.area}
					<path d={areaPath(s.points)} fill={s.color} fill-opacity="0.10" stroke="none" />
				{/if}
				<path
					d={linePath(s.points)}
					fill="none"
					stroke={s.color}
					stroke-width="1.75"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
				{#if s.points.length === 1}
					<circle cx={sx(s.points[0].x)} cy={sy(s.points[0].y)} r="2.5" fill={s.color} />
				{/if}
				<!-- latest-value dot -->
				{#if s.points.length > 1}
					<circle
						cx={sx(s.points[s.points.length - 1].x)}
						cy={sy(s.points[s.points.length - 1].y)}
						r="2.5"
						fill={s.color}
					/>
				{/if}
			{/each}
		</svg>
	{/if}

	{#if showLegend && series.length > 0}
		<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
			{#each series as s}
				<span class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<span class="inline-block h-2 w-2 rounded-sm" style="background:{s.color}"></span>
					{s.name}
				</span>
			{/each}
			{#if yUnit}
				<span class="ml-auto text-[10px] text-muted-foreground/50">{yUnit}</span>
			{/if}
		</div>
	{/if}
</div>
