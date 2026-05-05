<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	let sidebarOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<title>simple-floci-ui</title>
</svelte:head>

{#if sidebarOpen}
	<div
		class="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm lg:hidden"
		role="button"
		tabindex="-1"
		onclick={() => (sidebarOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
		aria-label="Close sidebar"
	></div>
{/if}

<div class="flex h-dvh flex-col overflow-hidden bg-background">
	<Header connection={data.connection} onMenuToggle={() => (sidebarOpen = !sidebarOpen)} />

	<div class="flex min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_30%_0%,oklch(0.92_0.035_75_/_0.55),transparent_32rem)]">
		<div class="hidden lg:block">
			<Sidebar />
		</div>

		{#if sidebarOpen}
			<div class="fixed inset-y-0 left-0 z-40 mt-14 animate-slide-in-left lg:hidden">
				<Sidebar onNavigate={() => (sidebarOpen = false)} />
			</div>
		{/if}

		<main class="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
			{@render children()}
		</main>
	</div>
</div>
