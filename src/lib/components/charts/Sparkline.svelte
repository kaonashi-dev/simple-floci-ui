<script lang="ts">
	/** Tiny axis-less multi-series sparkline for dense table rows. */
	export type SparkSeries = { color: string; values: number[] };

	let {
		series = [],
		width = 110,
		height = 26
	}: {
		series?: SparkSeries[];
		width?: number;
		height?: number;
	} = $props();

	const PAD = 2;

	const maxLen = $derived(Math.max(0, ...series.map((s) => s.values.length)));
	const maxVal = $derived.by(() => {
		let m = 0;
		for (const s of series) for (const v of s.values) if (v > m) m = v;
		return m <= 0 ? 1 : m;
	});
	const hasData = $derived(maxLen > 1 && series.some((s) => s.values.some((v) => v > 0)));

	function sx(i: number): number {
		if (maxLen <= 1) return PAD;
		return PAD + (i / (maxLen - 1)) * (width - PAD * 2);
	}
	function sy(v: number): number {
		return height - PAD - (v / maxVal) * (height - PAD * 2);
	}
	function path(values: number[]): string {
		return values
			.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`)
			.join(' ');
	}
</script>

{#if hasData}
	<svg {width} {height} viewBox="0 0 {width} {height}" class="block" aria-hidden="true">
		{#each series as s}
			<path
				d={path(s.values)}
				fill="none"
				stroke={s.color}
				stroke-width="1.25"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{/each}
	</svg>
{:else}
	<svg {width} {height} viewBox="0 0 {width} {height}" class="block" aria-hidden="true">
		<line
			x1={PAD}
			y1={height / 2}
			x2={width - PAD}
			y2={height / 2}
			class="text-border"
			stroke="currentColor"
			stroke-width="1"
			stroke-dasharray="2 3"
			stroke-opacity="0.5"
		/>
	</svg>
{/if}
