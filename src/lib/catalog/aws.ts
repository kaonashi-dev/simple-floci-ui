import type { ServiceDefinition } from './types';

/**
 * AWS services exposed through the AWS SDK against the local Floci/LocalStack
 * runtime. Order here drives the AWS sidebar order and the dashboard count
 * order (via `$lib/floci/registry`).
 *
 * `icon` preserves the historical per-service icons: SNS uses `notifications`
 * (radio tower), IAM uses `shield`, and Secrets Manager uses `secret` (lock),
 * which differ from the generic `messaging`/`identity`/`security` role icons.
 */
export const AWS_SERVICES: ServiceDefinition[] = [
	{
		provider: 'aws',
		id: 'sqs',
		name: 'SQS',
		route: '/aws/sqs',
		category: 'Messaging',
		subtitle: 'Simple Queue Service',
		description: 'Inspect message flow and queue depth.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'messaging',
		countKey: 'sqs',
		unit: 'queue'
	},
	{
		provider: 'aws',
		id: 's3',
		name: 'S3',
		route: '/aws/s3',
		category: 'Storage',
		subtitle: 'Simple Storage Service',
		description: 'Browse objects, prefixes, and uploads.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'storage',
		countKey: 's3',
		unit: 'bucket'
	},
	{
		provider: 'aws',
		id: 'cognito',
		name: 'Cognito',
		route: '/aws/cognito',
		category: 'Identity',
		subtitle: 'Identity Provider',
		description: 'Manage local users, groups, and identities.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'identity',
		countKey: 'cognito',
		unit: 'pool'
	},
	{
		provider: 'aws',
		id: 'kms',
		name: 'KMS',
		route: '/aws/kms',
		category: 'Security',
		subtitle: 'Key Management Service',
		description: 'Review keys, aliases, and rotation settings.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'security',
		countKey: 'kms',
		unit: 'key'
	},
	{
		provider: 'aws',
		id: 'lambda',
		name: 'Lambda',
		route: '/aws/lambda',
		category: 'Compute',
		subtitle: 'Serverless Compute',
		description: 'List and invoke local Lambda functions.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'serverless',
		countKey: 'lambda',
		unit: 'function'
	},
	{
		provider: 'aws',
		id: 'dynamodb',
		name: 'DynamoDB',
		route: '/aws/dynamodb',
		category: 'Database',
		subtitle: 'NoSQL Database',
		description: 'Browse tables and scan items.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'database',
		countKey: 'dynamodb',
		unit: 'table'
	},
	{
		provider: 'aws',
		id: 'sns',
		name: 'SNS',
		route: '/aws/sns',
		category: 'Messaging',
		subtitle: 'Simple Notification Service',
		description: 'Manage topics and publish messages.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'notifications',
		countKey: 'sns',
		unit: 'topic'
	},
	{
		provider: 'aws',
		id: 'apigateway',
		name: 'API Gateway',
		route: '/aws/apigateway',
		category: 'Networking',
		subtitle: 'REST & HTTP APIs',
		description: 'Inspect REST and HTTP APIs and their routes.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'networking',
		countKey: 'apigateway',
		unit: 'REST API'
	},
	{
		provider: 'aws',
		id: 'iam',
		name: 'IAM',
		route: '/aws/iam',
		category: 'Identity',
		subtitle: 'Identity & Access Management',
		description: 'Browse users, roles, and local policies.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'shield',
		countKey: 'iam',
		unit: 'user'
	},
	{
		provider: 'aws',
		id: 'logs',
		name: 'CloudWatch Logs',
		route: '/aws/logs',
		category: 'Observability',
		subtitle: 'Log Management',
		description: 'Browse log groups, streams, and events.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'observability',
		countKey: 'logs',
		unit: 'log group'
	},
	{
		provider: 'aws',
		id: 'eventbridge',
		name: 'EventBridge',
		route: '/aws/eventbridge',
		category: 'Messaging',
		subtitle: 'Event Bus',
		description: 'Manage event buses and rules.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'compute',
		countKey: 'eventbridge',
		unit: 'bus'
	},
	{
		provider: 'aws',
		id: 'secrets',
		name: 'Secrets Manager',
		route: '/aws/secrets',
		category: 'Security',
		subtitle: 'Secret Storage',
		description: 'View and manage application secrets.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'secret',
		countKey: 'secrets',
		unit: 'secret'
	},
	{
		provider: 'aws',
		id: 'ssm',
		name: 'SSM Params',
		route: '/aws/ssm',
		category: 'Configuration',
		subtitle: 'Parameter Store',
		description: 'Browse and update SSM parameters.',
		protocols: ['AWS SDK'],
		status: 'available',
		icon: 'config',
		countKey: 'ssm',
		unit: 'parameter'
	}
];
