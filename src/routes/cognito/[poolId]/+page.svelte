<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import {
		createUser,
		updateUserAttributes,
		deleteUser,
		enableUser,
		disableUser,
		setUserPassword,
		createGroup,
		deleteGroup
	} from '$lib/floci/cognito';
	import { formatDate } from '$lib/utils/formatDate';
	import { cn } from '$lib/utils';

	let { data } = $props();

	type Tab = 'users' | 'groups';
	let activeTab: Tab = $state('users');
	let showCreateUser = $state(false);
	let showCreateGroup = $state(false);
	let confirmDeleteUser: string | null = $state(null);
	let confirmDeleteGroup: string | null = $state(null);
	let editUser: { username: string; email: string } | null = $state(null);
	let setPasswordUser: string | null = $state(null);

	async function handleCreateUser(fd: FormData) {
		const username = (fd.get('username') as string)?.trim();
		const email = (fd.get('email') as string)?.trim();
		const tempPassword = (fd.get('tempPassword') as string)?.trim();
		if (!username || !email || !tempPassword)
			throw new Error('Username, email and password are required');
		await createUser(data.poolId, username, email, tempPassword);
		return { success: `User ${username} created` };
	}

	async function handleUpdateUser(fd: FormData) {
		const username = fd.get('username') as string;
		const email = (fd.get('email') as string)?.trim();
		if (!email) throw new Error('Email is required');
		await updateUserAttributes(data.poolId, username, { email });
		return { success: `User ${username} updated` };
	}

	async function handleDeleteUser(fd: FormData) {
		const username = fd.get('username') as string;
		await deleteUser(data.poolId, username);
		return { success: `User ${username} deleted` };
	}

	async function handleEnableUser(fd: FormData) {
		const username = fd.get('username') as string;
		await enableUser(data.poolId, username);
		return { success: `User ${username} enabled` };
	}

	async function handleDisableUser(fd: FormData) {
		const username = fd.get('username') as string;
		await disableUser(data.poolId, username);
		return { success: `User ${username} disabled` };
	}

	async function handleSetPassword(fd: FormData) {
		const username = fd.get('username') as string;
		const password = (fd.get('password') as string)?.trim();
		const permanent = fd.get('permanent') === 'true';
		if (!password) throw new Error('Password is required');
		await setUserPassword(data.poolId, username, password, permanent);
		return { success: `Password updated for ${username}` };
	}

	async function handleCreateGroup(fd: FormData) {
		const name = (fd.get('name') as string)?.trim();
		const description = (fd.get('description') as string)?.trim() || undefined;
		if (!name) throw new Error('Group name is required');
		await createGroup(data.poolId, name, description);
		return { success: `Group ${name} created` };
	}

	async function handleDeleteGroup(fd: FormData) {
		const name = fd.get('name') as string;
		await deleteGroup(data.poolId, name);
		return { success: `Group ${name} deleted` };
	}

	function userStatusClass(status?: string) {
		if (status === 'CONFIRMED') return 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400';
		if (status === 'FORCE_CHANGE_PASSWORD') return 'text-amber-600 border-amber-500/30 bg-amber-500/10 dark:text-amber-400';
		return 'text-muted-foreground border-border bg-muted/30';
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div>
		<nav class="mb-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<a href="/cognito" class="rounded px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground">Cognito</a>
			<svg class="h-3 w-3 text-border" fill="none" viewBox="0 0 6 10" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4-4 4" />
			</svg>
			<span class="truncate font-medium text-foreground">{data.pool?.name ?? data.poolId}</span>
		</nav>
		<div class="flex flex-wrap items-center gap-2.5">
			<h1 class="truncate page-title">{data.pool?.name ?? data.poolId}</h1>
			{#if data.pool}
				<span class="console-tag border-border/60 bg-muted/40 text-muted-foreground font-mono">
					{data.pool.estimatedNumberOfUsers ?? 0} users
				</span>
			{/if}
		</div>
		{#if data.pool}
			<div class="mt-1.5 flex items-center gap-1.5">
				<code class="truncate font-mono text-xs text-muted-foreground">{data.pool.id}</code>
				<CopyButton text={data.pool.id} />
			</div>
		{/if}
	</div>

	{#if data.error}
		<ErrorPanel message="Could not load user pool" hint={data.error} />
	{/if}

	<!-- Pool meta -->
	{#if data.pool}
		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
			{#each [
				{ label: 'Created', value: formatDate(data.pool.creationDate) },
				{ label: 'Last Modified', value: formatDate(data.pool.lastModifiedDate) },
				{ label: 'Auto-verified', value: data.pool.autoVerifiedAttributes?.join(', ') || '—' }
			] as item}
				<div class="console-surface p-3">
					<p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{item.label}</p>
					<p class="mt-1 text-sm text-foreground">{item.value}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tabs -->
	<div class="flex overflow-x-auto border-b border-border">
		{#each [{ id: 'users', label: 'Users', count: data.users.length }, { id: 'groups', label: 'Groups', count: data.groups.length }] as tab}
			<button
				type="button"
				onclick={() => (activeTab = tab.id as Tab)}
				class={cn(
					'flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors shrink-0',
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
			<div class="page-header">
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
					use:enhance={clientAction(handleCreateUser, {
						onSuccess: () => invalidateAll(),
						closeOnSuccess: () => (showCreateUser = false)
					})}
					class="console-panel grid grid-cols-1 items-end gap-3 p-4 md:grid-cols-3"
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
					<div class="flex justify-end gap-2 md:col-span-3">
						<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateUser = false)}>Cancel</Button>
						<Button type="submit" size="sm">Create User</Button>
					</div>
				</form>
			{/if}

			{#if data.users.length === 0}
				<EmptyState title="No users" description="Add a user to this pool." />
			{:else}
				<div class="console-table-shell overflow-x-auto">
					<table class="w-full min-w-[700px] text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Username</th>
								<th class="table-th">ID (sub)</th>
								<th class="table-th">Email</th>
								<th class="table-th w-36">Status</th>
								<th class="table-th w-24">Enabled</th>
								<th class="table-th w-36">Created</th>
								<th class="table-th-right w-52">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.users as user}
								<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
									<td class="px-4 py-2.5 font-medium">{user.username}</td>
									<td class="px-4 py-2.5">
										{#if user.attributes['sub']}
											<div class="flex items-center gap-1">
												<code class="font-mono text-xs text-muted-foreground">{user.attributes['sub']}</code>
												<CopyButton text={user.attributes['sub']} />
											</div>
										{:else}
											<span class="text-muted-foreground/50">—</span>
										{/if}
									</td>
									<td class="px-4 py-2.5 text-sm text-muted-foreground">{user.email ?? '—'}</td>
									<td class="px-4 py-2.5">
										<span class={cn('console-tag', userStatusClass(user.status))}>
											{user.status ?? '—'}
										</span>
									</td>
									<td class="px-4 py-2.5">
										{#if user.enabled}
											<span class="console-tag border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">on</span>
										{:else}
											<span class="console-tag border-border text-muted-foreground/60">off</span>
										{/if}
									</td>
									<td class="px-4 py-2.5 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
									<td class="px-4 py-2.5 text-right">
										<div class="flex items-center justify-end gap-0.5">
											<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => (editUser = { username: user.username, email: user.email ?? '' })}>
												Edit
											</Button>
											<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => (setPasswordUser = user.username)}>
												Set PWD
											</Button>
											{#if user.enabled}
												<form method="POST" use:enhance={clientAction(handleDisableUser, { onSuccess: () => invalidateAll() })}>
													<input type="hidden" name="username" value={user.username} />
													<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Disable</Button>
												</form>
											{:else}
												<form method="POST" use:enhance={clientAction(handleEnableUser, { onSuccess: () => invalidateAll() })}>
													<input type="hidden" name="username" value={user.username} />
													<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" type="submit">Enable</Button>
												</form>
											{/if}
											<Button
												variant="ghost"
												size="sm"
												class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
												onclick={() => (confirmDeleteUser = user.username)}
											>
												Delete
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Groups tab -->
	{#if activeTab === 'groups'}
		<div class="space-y-3">
			<div class="page-header">
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
					use:enhance={clientAction(handleCreateGroup, {
						onSuccess: () => invalidateAll(),
						closeOnSuccess: () => (showCreateGroup = false)
					})}
					class="console-panel grid grid-cols-1 items-end gap-3 p-4 md:grid-cols-2"
				>
					<div class="space-y-1.5">
						<Label for="group-name" class="text-xs">Group name</Label>
						<Input id="group-name" name="name" placeholder="admins" required class="h-8 text-sm" />
					</div>
					<div class="space-y-1.5">
						<Label for="group-desc" class="text-xs">Description (optional)</Label>
						<Input id="group-desc" name="description" placeholder="Administrator group" class="h-8 text-sm" />
					</div>
					<div class="flex justify-end gap-2 md:col-span-2">
						<Button type="button" variant="ghost" size="sm" onclick={() => (showCreateGroup = false)}>Cancel</Button>
						<Button type="submit" size="sm">Create Group</Button>
					</div>
				</form>
			{/if}

			{#if data.groups.length === 0}
				<EmptyState title="No groups" description="Add a group to organize pool users." />
			{:else}
				<div class="console-table-shell">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="table-th">Group Name</th>
								<th class="table-th">Description</th>
								<th class="table-th w-36">Created</th>
								<th class="table-th-right w-24">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each data.groups as group}
								<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
									<td class="px-4 py-2.5 font-medium">{group.name}</td>
									<td class="px-4 py-2.5 text-sm text-muted-foreground">{group.description ?? '—'}</td>
									<td class="px-4 py-2.5 text-sm text-muted-foreground">{formatDate(group.creationDate)}</td>
									<td class="px-4 py-2.5 text-right">
										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
											onclick={() => (confirmDeleteGroup = group.name)}
										>
											Delete
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
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
				Set a new password directly for <strong>{setPasswordUser}</strong>.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			use:enhance={clientAction(handleSetPassword, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => (setPasswordUser = null)
			})}
			class="space-y-4 pt-2"
		>
			<input type="hidden" name="username" value={setPasswordUser} />
			<input type="hidden" name="permanent" value="true" />
			<div class="space-y-1.5 px-6">
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
			use:enhance={clientAction(handleUpdateUser, {
				onSuccess: () => invalidateAll(),
				closeOnSuccess: () => (editUser = null)
			})}
			class="space-y-4 pt-2"
		>
			<input type="hidden" name="username" value={editUser?.username} />
			<div class="space-y-1.5 px-6">
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
			<Dialog.Description>Delete <strong>{confirmDeleteUser}</strong>? This cannot be undone.</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteUser = null)}>Cancel</Button>
			<form method="POST" use:enhance={clientAction(handleDeleteUser, { onSuccess: () => invalidateAll(), closeOnSuccess: () => (confirmDeleteUser = null) })}>
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
			<Dialog.Description>Delete group <strong>{confirmDeleteGroup}</strong>? This cannot be undone.</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteGroup = null)}>Cancel</Button>
			<form method="POST" use:enhance={clientAction(handleDeleteGroup, { onSuccess: () => invalidateAll(), closeOnSuccess: () => (confirmDeleteGroup = null) })}>
				<input type="hidden" name="name" value={confirmDeleteGroup} />
				<Button type="submit" variant="destructive">Delete Group</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
