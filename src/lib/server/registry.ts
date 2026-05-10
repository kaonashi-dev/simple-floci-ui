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

export type ServiceEntry = {
	id: string;
	list: () => Promise<unknown[]>;
};

export const SERVICES: ServiceEntry[] = [
	{ id: 'sqs',         list: listQueues },
	{ id: 's3',          list: listBuckets },
	{ id: 'cognito',     list: listUserPools },
	{ id: 'kms',         list: listKeys },
	{ id: 'lambda',      list: listFunctions },
	{ id: 'dynamodb',    list: listTables },
	{ id: 'sns',         list: listTopics },
	{ id: 'apigateway',  list: listRestApis },
	{ id: 'iam',         list: listUsers },
	{ id: 'logs',        list: listLogGroups },
	{ id: 'eventbridge', list: listEventBuses },
	{ id: 'secrets',     list: listSecrets },
	{ id: 'ssm',         list: listParameters },
];
