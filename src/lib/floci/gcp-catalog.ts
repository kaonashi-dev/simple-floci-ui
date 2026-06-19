export type GcpServiceStatus = 'available' | 'planned';

export type GcpServiceIcon =
	| 'storage'
	| 'messaging'
	| 'database'
	| 'serverless'
	| 'security'
	| 'identity'
	| 'containers'
	| 'compute'
	| 'observability';

export type GcpServiceDefinition = {
	id: string;
	name: string;
	shortName?: string;
	route: string;
	category: string;
	description: string;
	protocols: string[];
	status: GcpServiceStatus;
	icon: GcpServiceIcon;
	countKey?: string;
	unit?: string;
};

export const GCP_SERVICES: GcpServiceDefinition[] = [
	{
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

export function getGcpService(id: string): GcpServiceDefinition | undefined {
	return GCP_SERVICES.find((service) => service.id === id);
}
