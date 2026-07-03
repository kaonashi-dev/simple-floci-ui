<script lang="ts">
	/**
	 * A depth stat card that reacts in real time. Each time `value` changes it
	 * flashes green/red, pops the number, and floats a `+N` / `−N` delta badge
	 * that fades out — so a developer watching the queue *sees* messages arrive
	 * and drain without reading the raw number. An optional sparkline shows the
	 * recent trend inline.
	 */
	import Sparkline from '$lib/components/charts/Sparkline.svelte';

	let {
		label,
		value,
		color,
		hint = '',
		spark = [],
		peak = null
	}: {
		label: string;
		value: number | null;
		color: string;
		hint?: string;
		spark?: number[];
		peak?: number | null;
	} = $props();

	// Non-reactive tracker so reading it inside the effect doesn't re-trigger it.
	let prevValue: number | null = null;

	let delta = $state(0);
	let flash = $state<'up' | 'down' | null>(null);
	// Bumped on every change so the CSS animations restart via `{#key}`.
	let pulse = $state(0);
	let deltaVisible = $state(false);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const v = value;
		if (v == null) return;
		if (prevValue === null) {
			prevValue = v;
			return;
		}
		if (v !== prevValue) {
			delta = v - prevValue;
			flash = delta > 0 ? 'up' : 'down';
			deltaVisible = true;
			pulse += 1;
			prevValue = v;
			clearTimeout(hideTimer);
			hideTimer = setTimeout(() => {
				deltaVisible = false;
				flash = null;
			}, 1600);
		}
	});

	$effect(() => () => clearTimeout(hideTimer));

	const display = $derived(value == null ? '—' : value.toLocaleString());
</script>

<div class="console-surface relative overflow-hidden p-3">
	<div class="flex items-center justify-between gap-2">
		<p class="console-subtle-label">{label}</p>
		{#if deltaVisible && delta !== 0}
			{#key pulse}
				<span
					class="animate-delta-pop rounded px-1 font-mono text-[10px] font-semibold {delta > 0
						? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
						: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}"
				>
					{delta > 0 ? '+' : '−'}{Math.abs(delta).toLocaleString()}
				</span>
			{/key}
		{/if}
	</div>

	{#key pulse}
		<span
			class="pointer-events-none absolute inset-0 -z-0 {flash === 'up'
				? 'flash-up'
				: flash === 'down'
					? 'flash-down'
					: ''}"
		></span>
		<p class="relative mt-1 inline-block animate-value-pop font-mono text-2xl font-semibold" style="color:{color}">
			{display}
		</p>
	{/key}

	<div class="relative mt-1 flex items-end justify-between gap-2">
		<p class="text-[10px] text-muted-foreground/60">{hint}</p>
		{#if spark.length > 1}
			<div class="shrink-0 opacity-80">
				<Sparkline series={[{ color, values: spark }]} width={72} height={22} />
			</div>
		{/if}
	</div>

	{#if peak != null}
		<p class="relative mt-1 text-[10px] text-muted-foreground/50">
			peak <span class="font-mono tabular-nums text-muted-foreground/70">{peak.toLocaleString()}</span>
		</p>
	{/if}
</div>
