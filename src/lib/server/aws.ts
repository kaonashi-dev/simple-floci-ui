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
