import { browser } from '$app/environment';
import { getAzureConnectionSettings } from '$lib/stores/settings.svelte';
import type {
	CloudStorageDownloadedObject,
	CloudStorageObjectListing,
	CloudStorageObjectSummary,
	CloudStorageResource
} from '$lib/types/cloud-storage';

type AzureFetchOptions = {
	emptyOnNotFound?: boolean;
};

function resolve() {
	if (browser) {
		const s = getAzureConnectionSettings();
		return {
			endpoint: s.endpoint || 'http://localhost:4577',
			accountName: s.accountName || 'devstoreaccount1'
		};
	}
	return {
		endpoint: process.env.FLOCI_AZURE_ENDPOINT || process.env.FLOCI_AZ_ENDPOINT || 'http://localhost:4577',
		accountName: process.env.FLOCI_AZURE_ACCOUNT_NAME || 'devstoreaccount1'
	};
}

export function getAzureEndpoint(): string {
	return resolve().endpoint;
}

export function getAzureAccountName(): string {
	return resolve().accountName;
}

async function azureFetch(
	path: string,
	init: RequestInit = {},
	options: AzureFetchOptions = {}
): Promise<Response | null> {
	const { endpoint } = resolve();
	let res: Response;
	try {
		res = await fetch(`${endpoint}${path}`, {
			...init,
			headers: {
				'x-ms-version': '2021-12-02',
				...(init.headers ?? {})
			}
		});
	} catch (error) {
		throw new Error(`Cannot reach Floci-AZ at ${endpoint}: ${errorMessage(error)}`);
	}

	if (options.emptyOnNotFound && res.status === 404) return null;
	if (!res.ok) {
		const detail = await safeResponseText(res);
		throw new Error(
			`Azure runtime request failed: HTTP ${res.status} ${path}${detail ? ` - ${detail}` : ''}`
		);
	}
	return res;
}

export async function checkAzureConnection(): Promise<void> {
	await listAzureBlobContainers();
}

export async function listAzureBlobContainers(): Promise<CloudStorageResource[]> {
	const res = await azureFetch(`${accountPath()}?comp=list`, { method: 'GET' }, { emptyOnNotFound: true });
	if (!res) return [];
	return parseContainers(await res.text());
}

export async function createAzureBlobContainer(name: string): Promise<void> {
	if (!isValidContainerName(name)) {
		throw new Error('Use a valid Azure container name: 3-63 lowercase letters, numbers, or single hyphens.');
	}
	await azureFetch(`${containerPath(name)}?restype=container`, { method: 'PUT' });
}

export async function deleteAzureBlobContainer(name: string): Promise<void> {
	await azureFetch(`${containerPath(name)}?restype=container`, { method: 'DELETE' });
}

export async function listAzureBlobObjects(
	container: string,
	prefix = ''
): Promise<CloudStorageObjectListing> {
	const qs = new URLSearchParams({ restype: 'container', comp: 'list', delimiter: '/' });
	if (prefix) qs.set('prefix', prefix);
	const res = await azureFetch(`${containerPath(container)}?${qs}`, { method: 'GET' }, { emptyOnNotFound: true });
	if (!res) return { resource: container, prefix, folders: [], files: [] };
	return { resource: container, prefix, ...parseBlobs(await res.text(), prefix) };
}

export async function uploadAzureBlobObject(
	container: string,
	key: string,
	body: Uint8Array,
	contentType?: string
): Promise<void> {
	await azureFetch(`${containerPath(container)}/${encodePath(key)}`, {
		method: 'PUT',
		body: copyBytes(body),
		headers: {
			'content-type': contentType || 'application/octet-stream',
			'x-ms-blob-type': 'BlockBlob'
		}
	});
}

export async function getAzureBlobObject(
	container: string,
	key: string
): Promise<CloudStorageDownloadedObject> {
	const res = await azureFetch(`${containerPath(container)}/${encodePath(key)}`, { method: 'GET' });
	if (!res) throw new Error('Azure blob not found');
	return {
		body: new Uint8Array(await res.arrayBuffer()),
		contentType: res.headers.get('content-type'),
		contentLength: numberValue(res.headers.get('content-length'))
	};
}

export async function deleteAzureBlobObject(container: string, key: string): Promise<void> {
	await azureFetch(`${containerPath(container)}/${encodePath(key)}`, { method: 'DELETE' });
}

function accountPath(): string {
	return `/${encodeURIComponent(resolve().accountName)}`;
}

function containerPath(containerName: string): string {
	return `${accountPath()}/${encodeURIComponent(containerName)}`;
}

function parseContainers(xml: string): CloudStorageResource[] {
	const matches = xml.matchAll(/<Container>\s*<Name>([^<]+)<\/Name>[\s\S]*?(?:<Last-Modified>([^<]+)<\/Last-Modified>)?[\s\S]*?<\/Container>/g);
	return [...matches].map((match) => {
		const name = decodeXml(match[1]);
		return {
			id: name,
			name,
			type: 'container' as const,
			createdAt: match[2] ? decodeXml(match[2]) : null,
			region: null,
			metadata: { provider: 'azure', storageService: 'blob' }
		};
	});
}

function parseBlobs(xml: string, prefix: string): Pick<CloudStorageObjectListing, 'folders' | 'files'> {
	const folders: CloudStorageObjectSummary[] = [...xml.matchAll(/<BlobPrefix>\s*<Name>([^<]+)<\/Name>\s*<\/BlobPrefix>/g)].map((match) => {
		const key = decodeXml(match[1]);
		return {
			key,
			name: objectName(key, prefix),
			type: 'folder',
			size: null,
			lastModified: null,
			metadata: { provider: 'azure', storageService: 'blob', prefix: key }
		};
	});

	const files: CloudStorageObjectSummary[] = [];
	for (const match of xml.matchAll(/<Blob>\s*<Name>([^<]+)<\/Name>[\s\S]*?<\/Blob>/g)) {
		const key = decodeXml(match[1]);
		if (key === prefix) continue;
		const blobXml = match[0];
		files.push({
			key,
			name: objectName(key, prefix),
			type: 'file',
			size: numberValue(xmlValue(blobXml, 'Content-Length')),
			lastModified: xmlValue(blobXml, 'Last-Modified') ?? null,
			contentType: xmlValue(blobXml, 'Content-Type') ?? null,
			metadata: {
				provider: 'azure',
				storageService: 'blob',
				etag: xmlValue(blobXml, 'Etag') ?? xmlValue(blobXml, 'ETag'),
				blobType: xmlValue(blobXml, 'BlobType'),
				accessTier: xmlValue(blobXml, 'AccessTier')
			}
		});
	}

	return { folders, files };
}

function decodeXml(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function xmlValue(xml: string, tagName: string): string | undefined {
	const match = xml.match(new RegExp(`<${escapeRegExp(tagName)}>([^<]+)<\\/${escapeRegExp(tagName)}>`, 'i'));
	return match?.[1] ? decodeXml(match[1]) : undefined;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function objectName(key: string, prefix: string): string {
	const relative = key.startsWith(prefix) ? key.slice(prefix.length) : key;
	return relative.replace(/\/$/, '') || key;
}

function encodePath(key: string): string {
	return key.split('/').map(encodeURIComponent).join('/');
}

function numberValue(value: string | null | undefined): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function copyBytes(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

function isValidContainerName(value: string): boolean {
	return /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,61}[a-z0-9]$/.test(value);
}

async function safeResponseText(res: Response): Promise<string> {
	try {
		return (await res.text()).trim().slice(0, 500);
	} catch {
		return '';
	}
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
