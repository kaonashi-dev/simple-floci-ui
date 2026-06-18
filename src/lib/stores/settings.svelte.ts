import { browser } from '$app/environment';

const STORAGE_KEY = 'floci-connection';

export const DEFAULT_CONNECTION = {
	// LocalStack serves trusted HTTPS on this loopback domain, which keeps the
	// browser-direct connection working in every browser (incl. Safari) without
	// mixed-content/cert warnings. Each dev points at their own local instance.
	endpoint: 'https://localhost.localstack.cloud:4566',
	region: 'us-east-1',
	accessKeyId: 'test',
	secretAccessKey: 'test'
};

export type ConnectionSettings = typeof DEFAULT_CONNECTION;

function read(): ConnectionSettings {
	if (!browser) return { ...DEFAULT_CONNECTION };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return { ...DEFAULT_CONNECTION, ...JSON.parse(raw) };
	} catch {
		/* fall back to defaults on corrupt data */
	}
	return { ...DEFAULT_CONNECTION };
}

function createConnectionSettings() {
	let current = $state<ConnectionSettings>(read());

	return {
		get all(): ConnectionSettings {
			return current;
		},
		get endpoint() {
			return current.endpoint;
		},
		save(next: ConnectionSettings) {
			current = { ...next };
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
		},
		reset() {
			current = { ...DEFAULT_CONNECTION };
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
	return browser ? connectionSettings.all : { ...DEFAULT_CONNECTION };
}
