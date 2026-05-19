<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import InfoIcon from '@lucide/svelte/icons/info';
	import XIcon from '@lucide/svelte/icons/x';
	import { toast, type Toast } from '$lib/stores/toast.svelte';

	function styles(kind: Toast['kind']) {
		switch (kind) {
			case 'success':
				return {
					ring: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
					icon: CheckCircleIcon,
					iconClass: 'text-emerald-600 dark:text-emerald-400'
				};
			case 'error':
				return {
					ring: 'border-destructive/30 bg-destructive/8 text-destructive',
					icon: AlertTriangleIcon,
					iconClass: 'text-destructive'
				};
			default:
				return {
					ring: 'border-border bg-card text-foreground',
					icon: InfoIcon,
					iconClass: 'text-primary'
				};
		}
	}
</script>

<div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
	{#each toast.items as t (t.id)}
		{@const s = styles(t.kind)}
		{@const Icon = s.icon}
		<div
			class="pointer-events-auto flex items-start gap-2.5 rounded border px-3 py-2.5 shadow-md backdrop-blur animate-fade-in-up {s.ring}"
			role="status"
		>
			<Icon class="mt-0.5 size-4 shrink-0 {s.iconClass}" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium leading-snug">{t.message}</p>
				{#if t.hint}
					<p class="mt-0.5 break-words font-mono text-[11px] opacity-80">{t.hint}</p>
				{/if}
			</div>
			<button
				type="button"
				class="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
				aria-label="Dismiss"
				onclick={() => toast.dismiss(t.id)}
			>
				<XIcon class="size-3.5" />
			</button>
		</div>
	{/each}
</div>
