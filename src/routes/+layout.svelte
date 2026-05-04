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

<!-- Mobile overlay -->
{#if sidebarOpen}
	<div
		class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
		role="button"
		tabindex="-1"
		onclick={() => (sidebarOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
		aria-label="Close sidebar"
	></div>
{/if}

<div class="flex h-screen flex-col overflow-hidden">
	<Header connection={data.connection} onMenuToggle={() => (sidebarOpen = !sidebarOpen)} />

	<div class="flex flex-1 overflow-hidden">
		<!-- Desktop sidebar (always visible lg+) -->
		<div class="hidden lg:block">
			<Sidebar />
		</div>

		<!-- Mobile sidebar (slide-in drawer) -->
		{#if sidebarOpen}
			<div class="fixed inset-y-0 left-0 z-40 mt-12 animate-slide-in-left lg:hidden">
				<Sidebar onNavigate={() => (sidebarOpen = false)} />
			</div>
		{/if}

		<main class="flex-1 overflow-y-auto p-5 sm:p-7">
			{@render children()}
		</main>
	</div>
</div>
