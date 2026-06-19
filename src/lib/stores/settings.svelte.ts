import { browser, dev } from '$app/environment';

const STORAGE_KEY = 'floci-connection';
const DEV_CORS_PROXY_PREFIX = '/__floci-proxy';

export const DEFAULT_AWS_CONNECTION = {
	endpoint: 'http://localhost:4567',
	region: 'us-east-1',
	accessKeyId: 'test',
	secretAccessKey: 'test'
};

export const DEFAULT_AZURE_CONNECTION = {
	endpoint: 'http://localhost:4577',
	accountName: 'devstoreaccount1'
};

export const DEFAULT_GCP_CONNECTION = {
	endpoint: 'http://localhost:4588',
	project: 'floci-local'
};

export const DEFAULT_CONNECTION = {
	aws: DEFAULT_AWS_CONNECTION,
	azure: DEFAULT_AZURE_CONNECTION,
	gcp: DEFAULT_GCP_CONNECTION
};

export type AwsConnectionSettings = typeof DEFAULT_AWS_CONNECTION;
export type AzureConnectionSettings = typeof DEFAULT_AZURE_CONNECTION;
export type GcpConnectionSettings = typeof DEFAULT_GCP_CONNECTION;
export type ConnectionSettings = typeof DEFAULT_CONNECTION;

function mergeDefaults(value: Partial<ConnectionSettings>): ConnectionSettings {
	return {
		aws: { ...DEFAULT_AWS_CONNECTION, ...value.aws },
		azure: { ...DEFAULT_AZURE_CONNECTION, ...value.azure },
		gcp: { ...DEFAULT_GCP_CONNECTION, ...value.gcp }
	};
}

function migrateLegacy(value: unknown): ConnectionSettings | null {
	if (!value || typeof value !== 'object') return null;
	const legacy = value as Partial<AwsConnectionSettings> & Partial<ConnectionSettings>;
	if (legacy.aws || legacy.azure || legacy.gcp) return mergeDefaults(legacy);
	if ('endpoint' in legacy || 'region' in legacy || 'accessKeyId' in legacy || 'secretAccessKey' in legacy) {
		return mergeDefaults({
			aws: {
				endpoint: legacy.endpoint ?? DEFAULT_AWS_CONNECTION.endpoint,
				region: legacy.region ?? DEFAULT_AWS_CONNECTION.region,
				accessKeyId: legacy.accessKeyId ?? DEFAULT_AWS_CONNECTION.accessKeyId,
				secretAccessKey: legacy.secretAccessKey ?? DEFAULT_AWS_CONNECTION.secretAccessKey
			}
		});
	}
	return null;
}

function read(): ConnectionSettings {
	if (!browser) return mergeDefaults({});
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return migrateLegacy(JSON.parse(raw)) ?? mergeDefaults({});
	} catch {
		/* fall back to defaults on corrupt data */
	}
	return mergeDefaults({});
}

function createConnectionSettings() {
	let current = $state<ConnectionSettings>(read());

	return {
		get all(): ConnectionSettings {
			return current;
		},
		get aws() {
			return current.aws;
		},
		get azure() {
			return current.azure;
		},
		get gcp() {
			return current.gcp;
		},
		save(next: ConnectionSettings) {
			current = mergeDefaults(next);
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		},
		saveAws(next: AwsConnectionSettings) {
			current = mergeDefaults({ ...current, aws: next });
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		},
		saveAzure(next: AzureConnectionSettings) {
			current = mergeDefaults({ ...current, azure: next });
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		},
		saveGcp(next: GcpConnectionSettings) {
			current = mergeDefaults({ ...current, gcp: next });
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		},
		reset() {
			current = mergeDefaults({});
			if (browser) localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const connectionSettings = createConnectionSettings();

/**
 * Non-reactive accessor used by the AWS client factory to resolve the current
 * per-dev connection at request time (browser only; server falls back to env).
 */
export function getConnectionSettings(): ConnectionSettings {
	return browser ? connectionSettings.all : mergeDefaults({});
}

export function getAwsConnectionSettings(): AwsConnectionSettings {
	return getConnectionSettings().aws;
}

export function getAzureConnectionSettings(): AzureConnectionSettings {
	return getConnectionSettings().azure;
}

export function getGcpConnectionSettings(): GcpConnectionSettings {
	return getConnectionSettings().gcp;
}

export function resolveFlociRuntimeEndpoint(endpoint: string): string {
	if (!browser || !dev || !isLoopbackEndpoint(endpoint)) return endpoint;
	const target = endpoint.replace(/\/+$/, '');
	return `${window.location.origin}${DEV_CORS_PROXY_PREFIX}/${encodeURIComponent(target)}`;
}

function isLoopbackEndpoint(endpoint: string): boolean {
	try {
		const url = new URL(endpoint);
		return (
			(url.protocol === 'http:' || url.protocol === 'https:') &&
			['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(url.hostname)
		);
	} catch {
		return false;
	}
}
