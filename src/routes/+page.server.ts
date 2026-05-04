import { listQueues } from '$lib/server/sqs';
import { listBuckets } from '$lib/server/s3';
import { listUserPools } from '$lib/server/cognito';
import { listKeys } from '$lib/server/kms';

export async function load() {
	const [queues, buckets, pools, keys] = await Promise.allSettled([
		listQueues(),
		listBuckets(),
		listUserPools(),
		listKeys()
	]);

	return {
		sqsCount: queues.status === 'fulfilled' ? queues.value.length : null,
		sqsError: queues.status === 'rejected' ? String(queues.reason) : null,
		s3Count: buckets.status === 'fulfilled' ? buckets.value.length : null,
		s3Error: buckets.status === 'rejected' ? String(buckets.reason) : null,
		cognitoCount: pools.status === 'fulfilled' ? pools.value.length : null,
		cognitoError: pools.status === 'rejected' ? String(pools.reason) : null,
		kmsCount: keys.status === 'fulfilled' ? keys.value.length : null,
		kmsError: keys.status === 'rejected' ? String(keys.reason) : null
	};
}
