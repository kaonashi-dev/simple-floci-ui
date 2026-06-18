import { browser } from '$app/environment';
import { getConnectionSettings } from '$lib/stores/settings.svelte';

/**
 * Resolve the active connection at call time.
 *
 * - In the browser the endpoint/region/credentials come from the per-dev
 *   settings (localStorage), so each developer's session talks to their own
 *   local Floci/LocalStack instance.
 * - On the server (used only by not-yet-migrated routes) we fall back to env
 *   vars, matching the previous behaviour.
 */
function resolve() {
	if (browser) {
		const s = getConnectionSettings();
		return {
			region: s.region || 'us-east-1',
			endpoint: s.endpoint || 'https://localhost.localstack.cloud:4566',
			accessKeyId: s.accessKeyId || 'test',
			secretAccessKey: s.secretAccessKey || 'test'
		};
	}
	return {
		region: process.env.AWS_REGION || 'us-east-1',
		endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
	};
}

/** Current endpoint as a string (for display / connection status). */
export function getEndpoint(): string {
	return resolve().endpoint;
}

// AWS SDK v3 accepts providers (functions) for region/endpoint/credentials and
// invokes them per request, so a single long-lived client always picks up the
// latest per-dev settings without needing to be recreated.
function endpointProvider() {
	return async () => {
		const url = new URL(resolve().endpoint);
		return {
			protocol: url.protocol,
			hostname: url.hostname,
			port: url.port ? Number(url.port) : undefined,
			path: url.pathname || '/'
		};
	};
}

function regionProvider() {
	return async () => resolve().region;
}

function credentialsProvider() {
	return async () => {
		const { accessKeyId, secretAccessKey } = resolve();
		return { accessKeyId, secretAccessKey };
	};
}

export const awsConfig = {
	region: regionProvider(),
	endpoint: endpointProvider(),
	credentials: credentialsProvider(),
	forcePathStyle: true
};

export const awsConfigNoPathStyle = {
	region: regionProvider(),
	endpoint: endpointProvider(),
	credentials: credentialsProvider()
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeClient<T>(Cls: new (cfg: any) => T, cfg: object = awsConfig): T {
	return new Cls(cfg);
}

export async function paginateAll<T>(
	fetcher: (token?: string) => Promise<{ items: T[]; nextToken?: string }>
): Promise<T[]> {
	const all: T[] = [];
	let token: string | undefined;
	do {
		const { items, nextToken } = await fetcher(token);
		all.push(...items);
		token = nextToken;
	} while (token);
	return all;
}
