import { browser } from '$app/environment';
import {
	DEFAULT_GCP_CONNECTION,
	getGcpConnectionSettings,
	resolveFlociRuntimeEndpoint
} from '$lib/stores/settings.svelte';
import type {
	CloudStorageDownloadedObject,
	CloudStorageObjectListing,
	CloudStorageObjectSummary,
	CloudStorageResource
} from '$lib/types/cloud-storage';
import {
	copyBytes,
	errorMessage,
	numberValue,
	objectName,
	safeResponseText
} from './cloud-storage-rest';

function resolve() {
	if (browser) {
		const s = getGcpConnectionSettings();
		const endpoint = s.endpoint || DEFAULT_GCP_CONNECTION.endpoint;
		return {
			endpoint,
			runtimeEndpoint: resolveFlociRuntimeEndpoint(endpoint),
			project: s.project || 'floci-local'
		};
	}
	const endpoint = process.env.FLOCI_GCP_ENDPOINT || process.env.FLOCI_GP_ENDPOINT || DEFAULT_GCP_CONNECTION.endpoint;
	return {
		endpoint,
		runtimeEndpoint: endpoint,
		project: process.env.FLOCI_GCP_PROJECT || 'floci-local'
	};
}

export function getGcpEndpoint(): string {
	return resolve().endpoint;
}

export function getGcpProject(): string {
	return resolve().project;
}

async function gcpFetch(path: string, init: RequestInit = {}, emptyOnNotFound = false): Promise<Response> {
	const { endpoint, runtimeEndpoint } = resolve();
	let res: Response;
	try {
		res = await fetch(`${runtimeEndpoint}${path}`, init);
	} catch (error) {
		throw new Error(`Cannot reach Floci-GCP at ${endpoint}: ${errorMessage(error)}`);
	}

	if (emptyOnNotFound && res.status === 404) return res;
	if (!res.ok) {
		const detail = await safeResponseText(res);
		throw new Error(`GCP Storage request failed: HTTP ${res.status}${detail ? ` - ${detail}` : ''}`);
	}
	return res;
}

async function gcpJson<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await gcpFetch(path, init);
	return (await res.json()) as T;
}

export async function checkGcpConnection(): Promise<void> {
	await listGcpBuckets();
}

export async function listGcpBuckets(): Promise<CloudStorageResource[]> {
	const { project } = resolve();
	const body = await gcpJson<{ items?: GcpBucket[] }>(`/storage/v1/b?project=${encodeURIComponent(project)}`);
	return (body.items ?? []).map(toBucketResource);
}

export async function createGcpBucket(name: string): Promise<void> {
	if (!isValidBucketName(name)) {
		throw new Error('Use a valid GCS bucket name: 3-63 lowercase characters, numbers, dots, underscores, or hyphens.');
	}
	const { project } = resolve();
	await gcpJson<GcpBucket>(`/storage/v1/b?project=${encodeURIComponent(project)}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ name })
	});
}

export async function deleteGcpBucket(name: string): Promise<void> {
	await gcpFetch(`/storage/v1/b/${encodeURIComponent(name)}`, { method: 'DELETE' }, true);
}

export async function listGcpObjects(bucket: string, prefix = ''): Promise<CloudStorageObjectListing> {
	const qs = new URLSearchParams({ delimiter: '/' });
	if (prefix) qs.set('prefix', prefix);
	const body = await gcpJson<{ items?: GcpObject[]; prefixes?: string[] }>(
		`/storage/v1/b/${encodeURIComponent(bucket)}/o?${qs}`
	);
	const folders: CloudStorageObjectSummary[] = (body.prefixes ?? []).map((key) => ({
		key,
		name: objectName(key, prefix),
		type: 'folder',
		size: null,
		lastModified: null,
		metadata: { provider: 'gcp', storageService: 'cloud-storage', prefix: key }
	}));
	const files: CloudStorageObjectSummary[] = (body.items ?? [])
		.filter((item) => item.name && item.name !== prefix)
		.map((item) => ({
			key: item.name ?? '',
			name: objectName(item.name ?? '', prefix),
			type: 'file',
			size: numberValue(item.size),
			lastModified: item.updated ?? item.timeCreated ?? null,
			contentType: item.contentType ?? null,
			metadata: {
				provider: 'gcp',
				storageService: 'cloud-storage',
				storageClass: item.storageClass,
				etag: item.etag
			}
		}));
	return { resource: bucket, prefix, folders, files };
}

export async function uploadGcpObject(
	bucket: string,
	key: string,
	body: Uint8Array,
	contentType?: string
): Promise<void> {
	await gcpFetch(
		`/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(key)}`,
		{
			method: 'POST',
			headers: { 'content-type': contentType || 'application/octet-stream' },
			body: copyBytes(body)
		}
	);
}

export async function getGcpObject(bucket: string, key: string): Promise<CloudStorageDownloadedObject> {
	const res = await gcpFetch(
		`/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}?alt=media`,
		{ method: 'GET' }
	);
	return {
		body: new Uint8Array(await res.arrayBuffer()),
		contentType: res.headers.get('content-type'),
		contentLength: numberValue(res.headers.get('content-length'))
	};
}

export async function deleteGcpObject(bucket: string, key: string): Promise<void> {
	await gcpFetch(
		`/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(key)}`,
		{ method: 'DELETE' },
		true
	);
}

type GcpBucket = {
	id?: string;
	name?: string;
	location?: string;
	timeCreated?: string;
	updated?: string;
	storageClass?: string;
};

type GcpObject = {
	name?: string;
	bucket?: string;
	size?: string;
	updated?: string;
	timeCreated?: string;
	contentType?: string;
	storageClass?: string;
	etag?: string;
};

function toBucketResource(bucket: GcpBucket): CloudStorageResource {
	const name = bucket.name ?? bucket.id ?? '';
	return {
		id: name,
		name,
		type: 'bucket',
		createdAt: bucket.timeCreated ?? null,
		region: bucket.location ?? null,
		metadata: {
			provider: 'gcp',
			storageService: 'cloud-storage',
			storageClass: bucket.storageClass,
			updated: bucket.updated
		}
	};
}

function isValidBucketName(value: string): boolean {
	return /^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/.test(value);
}
