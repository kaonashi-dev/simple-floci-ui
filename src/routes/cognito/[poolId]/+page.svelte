<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import { cn } from '$lib/utils';

	let { data, form } = $props();

	type Tab = 'users' | 'groups';
	let activeTab: Tab = $state('users');
	let showCreateUser = $state(false);
	let showCreateGroup = $state(false);
	let confirmDeleteUser: string | null = $state(null);
	let confirmDeleteGroup: string | null = $state(null);
	let editUser: { username: string; email: string } | null = $state(null);
	let setPasswordUser: string | null = $state(null);

	function userStatusVariant(status?: string) {
		if (status === 'CONFIRMED') return 'default';
		if (status === 'FORCE_CHANGE_PASSWORD') return 'secondary';
		return 'outline';
	}

	function userStatusColor(status?: string) {
		if (status === 'CONFIRMED') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
		if (status === 'FORCE_CHANGE_PASSWORD') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
		return 'text-muted-foreground';
	}
</script>

<div class="max-w-5xl space-y-5 animate-fade-in-up">
	<!-- Breadcrumb + title -->
	<div>
		<nav class="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/cognito" class="transition-colors hover:text-foreground">Cognito</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="font-medium text-foreground">{data.pool?.name ?? data.poolId}</span>
		</nav>
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-semibold tracking-tight">{data.pool?.name ?? data.poolId}</h1>
			{#if data.pool}
				<Badge variant="outline" class="font-mono text-xs text-muted-foreground">
					{data.pool.estimatedNumberOfUsers ?? 0} users
				</Badge>
			{/if}
		</div>
		{#if data.pool}
			<div class="mt-2 flex items-center gap-1.5">
				<code class="font-mono text-xs text-muted-foreground">{data.pool.id}</code>
				<CopyButton text={data.pool.id} />
			</div>
		{/if}
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load user pool" hint={data.error} />
	{/if}

	{#if form?.actionError}
		<ErrorPanel message={form.actionError} />
	{/if}

	{#if form?.success}
		<div class="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-400">
			<svg class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
			{form.success}
		</div>
	{/if}

	<!-- Pool meta info -->
	{#if data.pool}
		<div class="grid grid-cols-3 gap-3">
			{#each [
				{ label: 'Created', value: formatDate(data.pool.creationDate) },
				{ label: 'Last Modified', value: formatDate(data.pool.lastModifiedDate) },
				{ label: 'Auto-verified', value: data.pool.autoVerifiedAttributes?.join(', ') || '—' }
			] as item}
				<div class="rounded border border-border bg-card p-3">
					<p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
					<p class="mt-1 text-sm text-foreground">{item.value}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="flex items-center gap-0 border-b border-border">
		{#each [{ id: 'users', label: 'Users', count: data.users.length }, { id: 'groups', label: 'Groups', count: data.groups.length }] as tab}
			<button
				type="button"
				onclick={() => (activeTab = tab.id as Tab)}
				class={cn(
					'flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
					activeTab === tab.id
						? 'border-primary text-foreground'
						: 'border-transparent text-muted-foreground hover:text-foreground'
				)}
			>
				{tab.label}
				<span class={cn(
					'rounded px-1.5 py-0.5 font-mono text-[10px]',
					activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
				)}>
					{tab.count}
				</span>
			</button>
		{/each}
	</div>

	<!-- Users tab -->
	{#if activeTab === 'users'}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">{data.users.length} user{data.users.length !== 1 ? 's' : ''}</p>
				<Button size="sm" onclick={() => (showCreateUser = !showCreateUser)}>
					<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Add User
				</Button>
			</div>

			{#if showCreateUser}
				<form
					method="POST"
					action="?/createUser"
					use:enhance={() => async ({ update }) => { showCreateUser = false; await update(); }}
					class="grid grid-cols-3 items-end gap-2 rounded border border-border bg-card p-4"
				>
					<div class="space-y-1.5">
						<Label for="username" class="text-xs">Username</Label>
						<Input id="username" name="username" placeholder="johndoe" required class="h-8 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="email" class="text-xs">Email</Label>
						<Input id="email" name="email" type="email" placeholder="john@example.com" required class="h-8 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="tempPassword" class="text-xs">Temp Password</Label>
						<Input id="tempPassword" name="tempPassword" type="password" placeholder="Temp@1234" required class="h-8 text-sm" />
					</div>
					<div class="col-span-3 flex justify-end gap-2">
						<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateUser = false)}>Cancel</Button>
						<Button type="submit" size="sm">Create User</Button>
					</div>
				</form>
			{/if}

			{#if data.users.length === 0}
				<EmptyState title="No users" description="Add a user to this pool." />
			{:else}
				<div class="overflow-hidden rounded border border-border">
					<Table.Root>
						<Table.Header>
							<Table.Row class="border-b border-border bg-muted/30 hover:bg-muted/30">
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Username</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">ID (sub)</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Email</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Enabled</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</Table.Head>
								<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.users as user}
								<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
									<Table.Cell class="font-medium">{user.username}</Table.Cell>
									<Table.Cell>
										{#if user.attributes['sub']}
											<div class="flex items-center gap-1">
												<code class="font-mono text-xs text-muted-foreground">{user.attributes['sub']}</code>
												<CopyButton text={user.attributes['sub']} />
											</div>
										{:else}
											<span class="text-sm text-muted-foreground">—</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">{user.email ?? '—'}</Table.Cell>
									<Table.Cell>
										<span class={cn('rounded border px-1.5 py-0.5 font-mono text-[10px]', userStatusColor(user.status))}>
											{user.status ?? '—'}
										</span>
									</Table.Cell>
									<Table.Cell>
										{#if user.enabled}
											<span class="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">enabled</span>
										{:else}
											<span class="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">disabled</span>
										{/if}
									</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">{formatDate(user.createdAt)}</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												class="h-7 px-2 text-xs"
												onclick={() => (editUser = { username: user.username, email: user.email ?? '' })}
											>
												Edit
											</Button>
											<Button
												variant="ghost"
												size="sm"
												class="h-7 px-2 text-xs"
												onclick={() => (setPasswordUser = user.username)}
											>
												Set PWD
											</Button>
											{#if user.enabled}
												<form method="POST" action="?/disableUser" use:enhance>
													<input type="hidden" name="username" value={user.username} />
													<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Disable</Button>
												</form>
											{:else}
												<form method="POST" action="?/enableUser" use:enhance>
													<input type="hidden" name="username" value={user.username} />
													<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Enable</Button>
												</form>
											{/if}
											<form method="POST" action="?/resetPassword" use:enhance>
												<input type="hidden" name="username" value={user.username} />
												<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Reset PWD</Button>
											</form>
											<Button
												variant="ghost"
												size="sm"
												class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
												onclick={() => (confirmDeleteUser = user.username)}
											>
												Delete
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Groups tab -->
	{#if activeTab === 'groups'}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">{data.groups.length} group{data.groups.length !== 1 ? 's' : ''}</p>
				<Button size="sm" onclick={() => (showCreateGroup = !showCreateGroup)}>
					<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Add Group
				</Button>
			</div>

			{#if showCreateGroup}
				<form
					method="POST"
					action="?/createGroup"
					use:enhance={() => async ({ update }) => { showCreateGroup = false; await update(); }}
					class="grid grid-cols-2 items-end gap-2 rounded border border-border bg-card p-4"
				>
					<div class="space-y-1.5">
						<Label for="group-name" class="text-xs">Group name</Label>
						<Input id="group-name" name="name" placeholder="admins" required class="h-8 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="group-desc" class="text-xs">Description (optional)</Label>
						<Input id="group-desc" name="description" placeholder="Administrator group" class="h-8 text-sm" />
					</div>
					<div class="col-span-2 flex justify-end gap-2">
						<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateGroup = false)}>Cancel</Button>
						<Button type="submit" size="sm">Create Group</Button>
					</div>
				</form>
			{/if}

			{#if data.groups.length === 0}
				<EmptyState title="No groups" description="Add a group to organize pool users." />
			{:else}
				<div class="overflow-hidden rounded border border-border">
					<Table.Root>
						<Table.Header>
							<Table.Row class="border-b border-border bg-muted/30 hover:bg-muted/30">
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Group Name</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</Table.Head>
								<Table.Head class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</Table.Head>
								<Table.Head class="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.groups as group}
								<Table.Row class="border-b border-border/50 last:border-0 hover:bg-muted/20">
									<Table.Cell class="font-medium">{group.name}</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">{group.description ?? '—'}</Table.Cell>
									<Table.Cell class="text-sm text-muted-foreground">{formatDate(group.creationDate)}</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
											onclick={() => (confirmDeleteGroup = group.name)}
										>
											Delete
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Set password dialog -->
<Dialog.Root open={!!setPasswordUser} onOpenChange={(o) => { if (!o) setPasswordUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Set password</Dialog.Title>
			<Dialog.Description>
				Set a new password directly for <strong>{setPasswordUser}</strong>. Useful in local environments where emails don't arrive.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/setPassword"
			use:enhance={() => async ({ update }) => { setPasswordUser = null; await update(); }}
			class="space-y-4 pt-2"
		>
			<input type="hidden" name="username" value={setPasswordUser} />
			<input type="hidden" name="permanent" value="true" />
			<div class="space-y-1.5">
				<Label for="set-pwd" class="text-xs">New password</Label>
				<Input id="set-pwd" name="password" type="password" placeholder="NewPass@123" required class="h-8 text-sm" />
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (setPasswordUser = null)}>Cancel</Button>
				<Button type="submit">Set Password</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit user dialog -->
<Dialog.Root open={!!editUser} onOpenChange={(o) => { if (!o) editUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit user</Dialog.Title>
			<Dialog.Description>Update attributes for <strong>{editUser?.username}</strong>.</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/updateUser"
			use:enhance={() => async ({ update }) => { editUser = null; await update(); }}
			class="space-y-4 pt-2"
		>
			<input type="hidden" name="username" value={editUser?.username} />
			<div class="space-y-1.5">
				<Label for="edit-email" class="text-xs">Email</Label>
				<Input id="edit-email" name="email" type="email" value={editUser?.email} required class="h-8 text-sm" />
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (editUser = null)}>Cancel</Button>
				<Button type="submit">Save</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete user dialog -->
<Dialog.Root open={!!confirmDeleteUser} onOpenChange={(o) => { if (!o) confirmDeleteUser = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete user</Dialog.Title>
			<Dialog.Description>
				Delete <strong>{confirmDeleteUser}</strong>? This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteUser = null)}>Cancel</Button>
			<form method="POST" action="?/deleteUser" use:enhance={() => async ({ update }) => { confirmDeleteUser = null; await update(); }}>
				<input type="hidden" name="username" value={confirmDeleteUser} />
				<Button type="submit" variant="destructive">Delete User</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete group dialog -->
<Dialog.Root open={!!confirmDeleteGroup} onOpenChange={(o) => { if (!o) confirmDeleteGroup = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete group</Dialog.Title>
			<Dialog.Description>
				Delete group <strong>{confirmDeleteGroup}</strong>? This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteGroup = null)}>Cancel</Button>
			<form method="POST" action="?/deleteGroup" use:enhance={() => async ({ update }) => { confirmDeleteGroup = null; await update(); }}>
				<input type="hidden" name="name" value={confirmDeleteGroup} />
				<Button type="submit" variant="destructive">Delete Group</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
