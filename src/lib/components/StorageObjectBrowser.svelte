<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import FileIcon from '@lucide/svelte/icons/file';
	import FileArchiveIcon from '@lucide/svelte/icons/file-archive';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import FileImageIcon from '@lucide/svelte/icons/file-image';
	import FileJsonIcon from '@lucide/svelte/icons/file-json';
	import FileMusicIcon from '@lucide/svelte/icons/file-music';
	import FilePlayIcon from '@lucide/svelte/icons/file-play';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import FileTerminalIcon from '@lucide/svelte/icons/file-terminal';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import FileTypeIcon from '@lucide/svelte/icons/file-type';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import ErrorPanel from '$lib/components/ErrorPanel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { clientAction } from '$lib/utils/clientAction';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatBytes } from '$lib/utils/formatBytes';
	import { formatDate } from '$lib/utils/formatDate';
	import { openObjectPreview } from '$lib/utils/objectPreview';
	import type {
		CloudStorageDownloadedObject,
		CloudStorageObjectListing
	} from '$lib/types/cloud-storage';

	type Data = {
		listing: CloudStorageObjectListing;
		resource: string;
		prefix: string;
		error: string | null;
	};

	let {
		data,
		rootHref,
		rootLabel,
		resourceLabel = 'resource',
		uploadObject,
		getObject,
		deleteObject
	}: {
		data: Data;
		rootHref: string;
		rootLabel: string;
		resourceLabel?: string;
		uploadObject: (resource: string, key: string, body: Uint8Array, contentType?: string) => Promise<void>;
		getObject: (resource: string, key: string) => Promise<CloudStorageDownloadedObject>;
		deleteObject: (resource: string, key: string) => Promise<void>;
	} = $props();

	let confirmDeleteKey: string | null = $state(null);
	let fileInput: HTMLInputElement;

	const totalItems = $derived(data.listing.folders.length + data.listing.files.length);

	async function handleUpload(fd: FormData) {
		const file = fd.get('file') as File | null;
		if (!file || file.size === 0) throw new Error('No file selected');
		const key = data.prefix + file.name;
		const bytes = new Uint8Array(await file.arrayBuffer());
		await uploadObject(data.resource, key, bytes, file.type || undefined);
		return { success: `Uploaded ${file.name}` };
	}

	async function handleDelete(fd: FormData) {
		const key = fd.get('key') as string;
		if (!key) throw new Error('Object key is required');
		await deleteObject(data.resource, key);
		return { success: `Deleted ${key}` };
	}

	async function downloadFile(key: string) {
		try {
			const obj = await getObject(data.resource, key);
			const blob = new Blob([obj.body as BlobPart], { type: obj.contentType ?? 'application/octet-stream' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = key.split('/').pop() ?? 'download';
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (e) {
			toast.error('Download failed', e instanceof Error ? e.message : String(e));
		}
	}

	async function previewFile(key: string) {
		try {
			const obj = await getObject(data.resource, key);
			openObjectPreview(obj.body as BlobPart, obj.contentType);
		} catch (e) {
			toast.error('Preview failed', e instanceof Error ? e.message : String(e));
		}
	}

	const fileGroups = {
		image: ['avif', 'bmp', 'gif', 'heic', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'tif', 'tiff', 'webp'],
		json: ['json', 'jsonl', 'map'],
		code: ['css', 'go', 'html', 'java', 'js', 'jsx', 'php', 'py', 'rb', 'rs', 'svelte', 'ts', 'tsx', 'vue', 'xml'],
		spreadsheet: ['csv', 'ods', 'tsv', 'xls', 'xlsm', 'xlsx'],
		archive: ['7z', 'br', 'bz2', 'gz', 'rar', 'tar', 'tgz', 'xz', 'zip'],
		audio: ['aac', 'flac', 'm4a', 'mp3', 'ogg', 'wav'],
		video: ['avi', 'm4v', 'mkv', 'mov', 'mp4', 'webm'],
		text: ['log', 'md', 'rtf', 'text', 'txt', 'yaml', 'yml'],
		document: ['doc', 'docx', 'pdf', 'ppt', 'pptx']
	};

	function extensionFor(name: string) {
		const base = (name.split('/').pop() ?? name).split(/[?#]/)[0].toLowerCase();
		const dot = base.lastIndexOf('.');
		if (dot <= 0 || dot === base.length - 1) return '';
		return base.slice(dot + 1);
	}

	function fileMeta(name: string) {
		const ext = extensionFor(name);
		const lower = name.toLowerCase();

		if (fileGroups.image.includes(ext)) return { icon: FileImageIcon, label: ext || 'image', tone: 'border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300' };
		if (fileGroups.json.includes(ext)) return { icon: FileJsonIcon, label: ext || 'json', tone: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300' };
		if (fileGroups.code.includes(ext)) return { icon: FileCodeIcon, label: ext || 'code', tone: 'border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300' };
		if (fileGroups.spreadsheet.includes(ext) || /(charges?|payments?|report|ledger|invoice|statement|batch)/.test(lower)) return { icon: FileSpreadsheetIcon, label: ext || 'data', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300' };
		if (fileGroups.archive.includes(ext)) return { icon: FileArchiveIcon, label: ext || 'archive', tone: 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-300' };
		if (fileGroups.audio.includes(ext)) return { icon: FileMusicIcon, label: ext || 'audio', tone: 'border-pink-200 bg-pink-50 text-pink-600 dark:border-pink-500/25 dark:bg-pink-500/10 dark:text-pink-300' };
		if (fileGroups.video.includes(ext)) return { icon: FilePlayIcon, label: ext || 'video', tone: 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300' };
		if (fileGroups.document.includes(ext)) return { icon: FileTypeIcon, label: ext || 'doc', tone: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300' };
		if (fileGroups.text.includes(ext)) return { icon: FileTextIcon, label: ext || 'text', tone: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/25 dark:bg-slate-500/10 dark:text-slate-300' };
		if (['env', 'ini', 'properties', 'toml', 'conf', 'config'].includes(ext)) return { icon: FileTerminalIcon, label: ext, tone: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-500/25 dark:bg-zinc-500/10 dark:text-zinc-300' };

		return { icon: FileIcon, label: ext || 'file', tone: 'border-border bg-muted/50 text-muted-foreground' };
	}
</script>

<div class="mx-auto w-full max-w-7xl space-y-5 animate-fade-in-up">
	<div class="page-header">
		<div class="space-y-1">
			<Breadcrumbs bucket={data.resource} prefix={data.prefix} {rootHref} {rootLabel} />
			<p class="page-subtitle">{totalItems} item{totalItems !== 1 ? 's' : ''} in this {resourceLabel}</p>
		</div>
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={clientAction(handleUpload, { onSuccess: () => invalidateAll() })}
		>
			<input
				bind:this={fileInput}
				type="file"
				name="file"
				class="hidden"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			/>
			<Button type="button" size="sm" onclick={() => fileInput.click()}>
				<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
				</svg>
				Upload File
			</Button>
		</form>
	</div>

	{#if data.error}
		<ErrorPanel message="Could not list objects" hint={data.error} />
	{/if}

	{#if totalItems === 0 && !data.error}
		<EmptyState title="Empty" description="Upload a file or navigate to a different prefix." />
	{:else}
		<div class="console-table-shell">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="table-th">Name</th>
						<th class="table-th w-24">Type</th>
						<th class="table-th-right w-24">Size</th>
						<th class="table-th-right w-36">Modified</th>
						<th class="table-th-right w-44">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.listing.folders as folder}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-2.5">
								<a
									href="{rootHref}/{encodeURIComponent(data.resource)}?prefix={encodeURIComponent(folder.key)}"
									class="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
								>
									<span class="flex size-6 shrink-0 items-center justify-center rounded border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
										<FolderIcon class="size-3.5" />
									</span>
									{folder.name}
								</a>
							</td>
							<td class="px-4 py-2.5">
								<span class="console-tag border-border/60 bg-muted/40 text-muted-foreground">folder</span>
							</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">-</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">-</td>
							<td class="px-4 py-2.5 text-right">
								<CopyButton text={folder.key} label="Key" />
							</td>
						</tr>
					{/each}

					{#each data.listing.files as file}
						{@const meta = fileMeta(file.name)}
						{@const Icon = meta.icon}
						<tr class="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
							<td class="px-4 py-2.5">
								<div class="flex items-center gap-2">
									<span class="flex size-6 shrink-0 items-center justify-center rounded border {meta.tone}">
										<Icon class="size-3.5" />
									</span>
									<span class="max-w-[12rem] truncate font-medium sm:max-w-xs md:max-w-sm" title={file.name}>{file.name}</span>
								</div>
							</td>
							<td class="px-4 py-2.5">
								<span class="console-tag border-border/60 bg-muted/40 text-muted-foreground">{meta.label}</span>
							</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
								{file.size != null ? formatBytes(file.size) : '-'}
							</td>
							<td class="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{formatDate(file.lastModified ?? undefined)}</td>
							<td class="px-4 py-2.5 text-right">
								<div class="flex items-center justify-end gap-1">
									<CopyButton text={file.key} label="Key" />
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => previewFile(file.key)}>Preview</Button>
									<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => downloadFile(file.key)}>Download</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
										onclick={() => (confirmDeleteKey = file.key)}
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

<Dialog.Root open={!!confirmDeleteKey} onOpenChange={(o) => { if (!o) confirmDeleteKey = null; }}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete object</Dialog.Title>
			<Dialog.Description class="break-all">
				Delete <strong>{confirmDeleteKey}</strong>? This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmDeleteKey = null)}>Cancel</Button>
			<form method="POST" use:enhance={clientAction(handleDelete, { onSuccess: () => invalidateAll(), closeOnSuccess: () => (confirmDeleteKey = null) })}>
				<input type="hidden" name="key" value={confirmDeleteKey} />
				<Button type="submit" variant="destructive">Delete</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
