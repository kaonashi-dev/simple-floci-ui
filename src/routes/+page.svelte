<script lang="ts">
	let { data } = $props();
</script>

<div class="max-w-2xl space-y-8 animate-fade-in-up">
	<!-- Page header -->
	<div>
		<h1 class="text-xl font-semibold tracking-tight">Dashboard</h1>
		<p class="mt-1 text-sm text-muted-foreground">Local AWS services for Floci.</p>
	</div>

	<!-- Connection error -->
	{#if !data.connection.ok}
		<div class="flex items-start gap-3 rounded border border-destructive/25 bg-destructive/8 px-4 py-3">
			<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
			</svg>
			<div>
				<p class="text-sm font-medium text-destructive">Floci is not reachable</p>
				<p class="mt-0.5 font-mono text-xs text-destructive/60">
					Check that the Floci container is running at {data.connection.endpoint}
				</p>
			</div>
		</div>
	{/if}

	<!-- Service cards -->
	<div class="grid grid-cols-2 gap-4">
		<!-- SQS -->
		<a href="/sqs" class="group block rounded border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex h-9 w-9 items-center justify-center rounded bg-muted/60">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="h-4 w-4 text-primary">
						<line x1="2" y1="4" x2="14" y2="4" />
						<line x1="2" y1="8" x2="10" y2="8" />
						<line x1="2" y1="12" x2="12" y2="12" />
					</svg>
				</div>
				{#if data.sqsError}
					<span class="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">error</span>
				{:else}
					<svg class="h-3.5 w-3.5 translate-x-0 translate-y-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10" />
					</svg>
				{/if}
			</div>
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.sqsCount ?? '—'}
			</p>
			<p class="mt-1 text-sm font-medium text-foreground">SQS Queues</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Simple Queue Service</p>
		</a>

		<!-- S3 -->
		<a href="/s3" class="group block rounded border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex h-9 w-9 items-center justify-center rounded bg-muted/60">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-primary">
						<ellipse cx="8" cy="4.5" rx="5" ry="2" />
						<path d="M3 4.5v7C3 12.88 5.24 14 8 14s5-1.12 5-2.5v-7" />
					</svg>
				</div>
				{#if data.s3Error}
					<span class="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">error</span>
				{:else}
					<svg class="h-3.5 w-3.5 translate-x-0 translate-y-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10" />
					</svg>
				{/if}
			</div>
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.s3Count ?? '—'}
			</p>
			<p class="mt-1 text-sm font-medium text-foreground">S3 Buckets</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Simple Storage Service</p>
		</a>

		<!-- Cognito -->
		<a href="/cognito" class="group block rounded border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex h-9 w-9 items-center justify-center rounded bg-muted/60">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-primary">
						<circle cx="8" cy="5.5" r="2.5" />
						<path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />
					</svg>
				</div>
				{#if data.cognitoError}
					<span class="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">error</span>
				{:else}
					<svg class="h-3.5 w-3.5 translate-x-0 translate-y-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10" />
					</svg>
				{/if}
			</div>
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.cognitoCount ?? '—'}
			</p>
			<p class="mt-1 text-sm font-medium text-foreground">Cognito Pools</p>
			<p class="mt-0.5 text-xs text-muted-foreground">User Pool Identity</p>
		</a>

		<!-- KMS -->
		<a href="/kms" class="group block rounded border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex h-9 w-9 items-center justify-center rounded bg-muted/60">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-primary">
						<circle cx="6" cy="8" r="3" />
						<path d="M9 8h5M12 6.5V8M14 6.5V8" />
					</svg>
				</div>
				{#if data.kmsError}
					<span class="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">error</span>
				{:else}
					<svg class="h-3.5 w-3.5 translate-x-0 translate-y-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10" />
					</svg>
				{/if}
			</div>
			<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
				{data.kmsCount ?? '—'}
			</p>
			<p class="mt-1 text-sm font-medium text-foreground">KMS Keys</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Key Management Service</p>
		</a>
	</div>

	<!-- Coming soon -->
	<div>
		<p class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/50">Coming Soon</p>
		<div class="grid grid-cols-3 gap-2">
			{#each ['DynamoDB', 'Lambda', 'SNS'] as service}
				<div class="rounded border border-border/50 bg-card/50 p-3">
					<p class="text-sm text-muted-foreground/40">{service}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
