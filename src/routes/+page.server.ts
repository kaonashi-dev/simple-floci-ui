import { listQueues } from '$lib/server/sqs';
import { listBuckets } from '$lib/server/s3';
import { listUserPools } from '$lib/server/cognito';
import { listKeys } from '$lib/server/kms';
import { listFunctions } from '$lib/server/lambda';
import { listTables } from '$lib/server/dynamodb';
import { listTopics } from '$lib/server/sns';
import { listRestApis } from '$lib/server/apigateway';
import { listUsers } from '$lib/server/iam';
import { listLogGroups } from '$lib/server/logs';
import { listEventBuses } from '$lib/server/eventbridge';
import { listSecrets } from '$lib/server/secrets';
import { listParameters } from '$lib/server/ssm';

export async function load() {
	const [queues, buckets, pools, keys, functions_, tables, topics, restApis, users, logGroups, buses, secrets, parameters] = await Promise.allSettled([
		listQueues(),
		listBuckets(),
		listUserPools(),
		listKeys(),
		listFunctions(),
		listTables(),
		listTopics(),
		listRestApis(),
		listUsers(),
		listLogGroups(),
		listEventBuses(),
		listSecrets(),
		listParameters()
	]);

	return {
		sqsCount: queues.status === 'fulfilled' ? queues.value.length : null,
		sqsError: queues.status === 'rejected' ? String(queues.reason) : null,
		s3Count: buckets.status === 'fulfilled' ? buckets.value.length : null,
		s3Error: buckets.status === 'rejected' ? String(buckets.reason) : null,
		cognitoCount: pools.status === 'fulfilled' ? pools.value.length : null,
		cognitoError: pools.status === 'rejected' ? String(pools.reason) : null,
		kmsCount: keys.status === 'fulfilled' ? keys.value.length : null,
		kmsError: keys.status === 'rejected' ? String(keys.reason) : null,
		lambdaCount: functions_.status === 'fulfilled' ? functions_.value.length : null,
		lambdaError: functions_.status === 'rejected' ? String(functions_.reason) : null,
		dynamoCount: tables.status === 'fulfilled' ? tables.value.length : null,
		dynamoError: tables.status === 'rejected' ? String(tables.reason) : null,
		snsCount: topics.status === 'fulfilled' ? topics.value.length : null,
		snsError: topics.status === 'rejected' ? String(topics.reason) : null,
		apiGwCount: restApis.status === 'fulfilled' ? restApis.value.length : null,
		apiGwError: restApis.status === 'rejected' ? String(restApis.reason) : null,
		iamCount: users.status === 'fulfilled' ? users.value.length : null,
		iamError: users.status === 'rejected' ? String(users.reason) : null,
		logsCount: logGroups.status === 'fulfilled' ? logGroups.value.length : null,
		logsError: logGroups.status === 'rejected' ? String(logGroups.reason) : null,
		eventBridgeCount: buses.status === 'fulfilled' ? buses.value.length : null,
		eventBridgeError: buses.status === 'rejected' ? String(buses.reason) : null,
		secretsCount: secrets.status === 'fulfilled' ? secrets.value.length : null,
		secretsError: secrets.status === 'rejected' ? String(secrets.reason) : null,
		ssmCount: parameters.status === 'fulfilled' ? parameters.value.length : null,
		ssmError: parameters.status === 'rejected' ? String(parameters.reason) : null
	};
}
