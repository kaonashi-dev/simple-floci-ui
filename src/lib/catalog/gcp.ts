import type { ServiceDefinition } from './types';

/**
 * GCP services under `/gcp`. Cloud Storage is browser-direct against Floci-GCP
 * today; the rest are `planned` placeholders reserved for future service-shaped
 * explorers.
 */
export const GCP_SERVICES: ServiceDefinition[] = [
	{
		provider: 'gcp',
		id: 'storage',
		name: 'Cloud Storage',
		route: '/gcp/storage',
		category: 'Storage',
		description: 'Buckets and objects exposed by Floci-GCP Cloud Storage.',
		protocols: ['REST', 'JSON', 'XML'],
		status: 'available',
		icon: 'storage',
		countKey: 'gcp-storage',
		unit: 'bucket'
	},
	{
		provider: 'gcp',
		id: 'pubsub',
		name: 'Pub/Sub',
		route: '/gcp/pubsub',
		category: 'Messaging',
		description: 'Topics, subscriptions, and message publishing.',
		protocols: ['gRPC'],
		status: 'planned',
		icon: 'messaging',
		unit: 'topic'
	},
	{
		provider: 'gcp',
		id: 'firestore',
		name: 'Firestore',
		route: '/gcp/firestore',
		category: 'Database',
		description: 'Documents, collections, and real-time NoSQL operations.',
		protocols: ['gRPC'],
		status: 'planned',
		icon: 'database',
		unit: 'collection'
	},
	{
		provider: 'gcp',
		id: 'datastore',
		name: 'Datastore',
		route: '/gcp/datastore',
		category: 'Database',
		description: 'Entity kinds and legacy Datastore key-value operations.',
		protocols: ['HTTP', 'protobuf'],
		status: 'planned',
		icon: 'database',
		unit: 'kind'
	},
	{
		provider: 'gcp',
		id: 'secret-manager',
		name: 'Secret Manager',
		shortName: 'Secrets',
		route: '/gcp/secret-manager',
		category: 'Security',
		description: 'Secrets, versions, and access control policies.',
		protocols: ['gRPC'],
		status: 'planned',
		icon: 'security',
		unit: 'secret'
	},
	{
		provider: 'gcp',
		id: 'iam',
		name: 'IAM',
		route: '/gcp/iam',
		category: 'Security',
		description: 'Service accounts, roles, and IAM policy bindings.',
		protocols: ['REST', 'JSON'],
		status: 'planned',
		icon: 'identity',
		unit: 'binding'
	},
	{
		provider: 'gcp',
		id: 'managed-kafka',
		name: 'Managed Kafka',
		shortName: 'Kafka',
		route: '/gcp/managed-kafka',
		category: 'Messaging',
		description: 'Kafka clusters and topics via Redpanda-compatible APIs.',
		protocols: ['REST', 'JSON', 'Redpanda'],
		status: 'planned',
		icon: 'messaging',
		unit: 'cluster'
	},
	{
		provider: 'gcp',
		id: 'tasks',
		name: 'Cloud Tasks',
		shortName: 'Tasks',
		route: '/gcp/tasks',
		category: 'Compute',
		description: 'Task queues, tasks, and async HTTP dispatch.',
		protocols: ['gRPC', 'v2'],
		status: 'planned',
		icon: 'compute',
		unit: 'queue'
	},
	{
		provider: 'gcp',
		id: 'run',
		name: 'Cloud Run',
		shortName: 'Run',
		route: '/gcp/run',
		category: 'Compute',
		description: 'Containerized services and revisions on Cloud Run.',
		protocols: ['REST', 'JSON'],
		status: 'planned',
		icon: 'containers',
		unit: 'service'
	},
	{
		provider: 'gcp',
		id: 'sql',
		name: 'Cloud SQL',
		shortName: 'SQL',
		route: '/gcp/sql',
		category: 'Database',
		description: 'Cloud SQL instances and databases backed by local Postgres.',
		protocols: ['REST', 'JSON', 'Postgres'],
		status: 'planned',
		icon: 'database',
		unit: 'instance'
	},
	{
		provider: 'gcp',
		id: 'functions',
		name: 'Cloud Functions',
		shortName: 'Functions',
		route: '/gcp/functions',
		category: 'Compute',
		description: 'Serverless function deployments and HTTP triggers.',
		protocols: ['REST', 'JSON'],
		status: 'planned',
		icon: 'serverless',
		unit: 'function'
	},
	{
		provider: 'gcp',
		id: 'kms',
		name: 'Cloud KMS',
		shortName: 'KMS',
		route: '/gcp/kms',
		category: 'Security',
		description: 'Key rings, crypto keys, and versions.',
		protocols: ['gRPC', 'REST', 'JSON'],
		status: 'planned',
		icon: 'security',
		unit: 'key'
	},
	{
		provider: 'gcp',
		id: 'logging',
		name: 'Cloud Logging',
		shortName: 'Logging',
		route: '/gcp/logging',
		category: 'Observability',
		description: 'Log sinks, log entries, and query-oriented log exploration.',
		protocols: ['gRPC', 'REST', 'JSON'],
		status: 'planned',
		icon: 'observability',
		unit: 'log'
	},
	{
		provider: 'gcp',
		id: 'monitoring',
		name: 'Cloud Monitoring',
		shortName: 'Monitoring',
		route: '/gcp/monitoring',
		category: 'Observability',
		description: 'Metrics, time series, and alerting policies.',
		protocols: ['gRPC', 'REST', 'JSON'],
		status: 'planned',
		icon: 'observability',
		unit: 'metric'
	},
	{
		provider: 'gcp',
		id: 'scheduler',
		name: 'Cloud Scheduler',
		shortName: 'Scheduler',
		route: '/gcp/scheduler',
		category: 'Compute',
		description: 'Cron jobs and HTTP/Pub-Sub schedule triggers.',
		protocols: ['gRPC', 'REST', 'JSON'],
		status: 'planned',
		icon: 'compute',
		unit: 'job'
	}
];
