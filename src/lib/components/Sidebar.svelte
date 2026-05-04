<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	const links = [
		{
			href: '/',
			label: 'Dashboard',
			icon: `<svg viewBox="0 0 16 16" fill="currentColor" class="size-3.5 shrink-0"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>`
		},
		{
			href: '/sqs',
			label: 'SQS',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="size-3.5 shrink-0"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="12" x2="12" y2="12"/></svg>`
		},
		{
			href: '/s3',
			label: 'S3',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><ellipse cx="8" cy="4.5" rx="5" ry="2"/><path d="M3 4.5v7C3 12.88 5.24 14 8 14s5-1.12 5-2.5v-7"/></svg>`
		},
		{
			href: '/cognito',
			label: 'Cognito',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"/></svg>`
		},
		{
			href: '/kms',
			label: 'KMS',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><circle cx="6" cy="8" r="3"/><path d="M9 8h5M12 6.5V8M14 6.5V8"/></svg>`
		}
	];

	const disabled = [
		{
			label: 'DynamoDB',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><ellipse cx="8" cy="4" rx="5" ry="1.75"/><path d="M3 4v3.5C3 8.55 5.24 9.5 8 9.5s5-.95 5-2V4"/><path d="M3 7.5V12C3 13.05 5.24 14 8 14s5-.95 5-2v-4.5"/></svg>`
		},
		{
			label: 'Lambda',
			icon: `<svg viewBox="0 0 16 16" fill="currentColor" class="size-3.5 shrink-0"><path d="M5.5 2 2.5 14h2l1.5-5.5 1.5 5.5h2L8 8l2.5-4.5h-2L7 6.5 5.5 2z"/></svg>`
		},
		{
			label: 'SNS',
			icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><path d="M9 3 3 6.5H1v3h2L9 13V3z"/><path d="M12 5a3 3 0 0 1 0 6"/></svg>`
		}
	];

	let { onNavigate }: { onNavigate?: () => void } = $props();

	function isActive(href: string) {
		if (href === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(href);
	}
</script>

<nav class="flex w-52 shrink-0 flex-col gap-px border-r border-sidebar-border bg-sidebar px-2 py-3 h-full">
	<p class="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
		Services
	</p>

	{#each links as link}
		<a
			href={link.href}
			onclick={onNavigate}
			class={cn(
				'flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm transition-colors',
				isActive(link.href)
					? 'bg-accent text-foreground font-medium'
					: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
			)}
		>
			{#if isActive(link.href)}
				<span class="text-primary">{@html link.icon}</span>
			{:else}
				<span>{@html link.icon}</span>
			{/if}
			{link.label}
			{#if isActive(link.href)}
				<span class="ml-auto size-1.5 rounded-full bg-primary"></span>
			{/if}
		</a>
	{/each}

	<div class="my-2 h-px bg-border"></div>

	{#each disabled as item}
		<div class="flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm text-muted-foreground/30">
			<span>{@html item.icon}</span>
			<span>{item.label}</span>
			<span class="ml-auto rounded bg-muted/30 px-1 py-px font-mono text-[9px] text-muted-foreground/40">soon</span>
		</div>
	{/each}
</nav>
