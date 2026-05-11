import { env } from '$env/dynamic/private';

export const awsConfig = {
	region: env.AWS_REGION || 'us-east-1',
	endpoint: env.AWS_ENDPOINT_URL || 'http://localhost:4566',
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID || 'test',
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'test'
	},
	forcePathStyle: true
};

export const awsConfigNoPathStyle = {
	region: awsConfig.region,
	endpoint: awsConfig.endpoint,
	credentials: awsConfig.credentials
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
