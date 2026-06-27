import { listQueues } from './sqs';
import { listBuckets } from './s3';
import { listUserPools } from './cognito';
import { listKeys } from './kms';
import { listFunctions } from './lambda';
import { listTables } from './dynamodb';
import { listTopics } from './sns';
import { listRestApis } from './apigateway';
import { listUsers } from './iam';
import { listLogGroups } from './logs';
import { listEventBuses } from './eventbridge';
import { listSecrets } from './secrets';
import { listParameters } from './ssm';
import { listAzureBlobContainers } from './azure';
import { listGcpBuckets } from './gcp';
import { serviceCountSources } from '$lib/catalog';

export type ServiceEntry = {
	id: string;
	list: () => Promise<unknown[]>;
};

/**
 * Binds each catalog `countKey` to the runtime call that produces its dashboard
 * count. This is the one place that imports the AWS SDK / REST clients, keeping
 * `$lib/catalog` pure display metadata that lighter surfaces (the sidebar) can
 * import without pulling in the SDK.
 */
const LIST_BY_COUNT_KEY: Record<string, () => Promise<unknown[]>> = {
	sqs: listQueues,
	s3: listBuckets,
	cognito: listUserPools,
	kms: listKeys,
	lambda: listFunctions,
	dynamodb: listTables,
	sns: listTopics,
	apigateway: listRestApis,
	iam: listUsers,
	logs: listLogGroups,
	eventbridge: listEventBuses,
	secrets: listSecrets,
	ssm: listParameters,
	'azure-storage': listAzureBlobContainers,
	'gcp-storage': listGcpBuckets
};

/**
 * Dashboard count sources, derived from the catalog so service order and
 * membership stay in lockstep with the catalog rather than being hand-kept here.
 */
function listForCountKey(countKey: string): (() => Promise<unknown[]>) | undefined {
	return LIST_BY_COUNT_KEY[countKey];
}

export const SERVICES: ServiceEntry[] = serviceCountSources().flatMap((service) => {
	const list = listForCountKey(service.countKey!);
	return list ? [{ id: service.countKey!, list }] : [];
});
