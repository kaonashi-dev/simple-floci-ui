import type { ServiceDefinition } from './types';

/**
 * Azure services under `/azure`. Blob Storage is browser-direct against Floci-AZ
 * today; the rest are `planned` placeholders reserved so each can grow into its
 * own service-shaped explorer.
 */
export const AZURE_SERVICES: ServiceDefinition[] = [
	{
		provider: 'azure',
		id: 'storage',
		name: 'Blob Storage',
		route: '/azure/storage',
		category: 'Storage',
		description: 'Containers and blobs exposed by Floci-AZ Blob Storage.',
		protocols: ['REST', 'XML', 'JSON'],
		status: 'available',
		icon: 'storage',
		countKey: 'azure-storage',
		unit: 'container'
	},
	{
		provider: 'azure',
		id: 'queue-storage',
		name: 'Queue Storage',
		route: '/azure/queue-storage',
		category: 'Messaging',
		description: 'Storage queues for local message workflows.',
		protocols: ['REST', 'JSON'],
		status: 'planned',
		icon: 'messaging',
		unit: 'queue'
	},
	{
		provider: 'azure',
		id: 'table-storage',
		name: 'Table Storage',
		route: '/azure/table-storage',
		category: 'Storage',
		description: 'OData table entities and partitioned key-value records.',
		protocols: ['OData', 'REST', 'JSON'],
		status: 'planned',
		icon: 'database',
		unit: 'table'
	},
	{
		provider: 'azure',
		id: 'functions',
		name: 'Azure Functions',
		route: '/azure/functions',
		category: 'Serverless',
		description: 'Function apps, HTTP triggers, timers, and runtime-backed invocation.',
		protocols: ['HTTP', 'Timer Triggers'],
		status: 'planned',
		icon: 'serverless',
		unit: 'function'
	},
	{
		provider: 'azure',
		id: 'app-configuration',
		name: 'App Configuration',
		route: '/azure/app-configuration',
		category: 'Configuration',
		description: 'Key-values, labels, feature flags, snapshots, and revisions.',
		protocols: ['REST', 'JSON', 'Labels'],
		status: 'planned',
		icon: 'config',
		unit: 'key'
	},
	{
		provider: 'azure',
		id: 'key-vault',
		name: 'Key Vault',
		route: '/azure/key-vault',
		category: 'Security',
		description: 'Secrets, keys, versions, and local vault operations.',
		protocols: ['REST', 'Secrets', 'Keys'],
		status: 'planned',
		icon: 'security',
		unit: 'secret'
	},
	{
		provider: 'azure',
		id: 'event-hubs',
		name: 'Event Hubs',
		route: '/azure/event-hubs',
		category: 'Messaging',
		description: 'Event streaming through AMQP and optional Kafka-compatible endpoints.',
		protocols: ['AMQP', 'Kafka', 'REST'],
		status: 'planned',
		icon: 'messaging',
		unit: 'hub'
	},
	{
		provider: 'azure',
		id: 'service-bus',
		name: 'Service Bus',
		route: '/azure/service-bus',
		category: 'Messaging',
		description: 'Queues, topics, subscriptions, and AMQP data plane workflows.',
		protocols: ['AMQP', 'Topics', 'Queues'],
		status: 'planned',
		icon: 'messaging',
		unit: 'entity'
	},
	{
		provider: 'azure',
		id: 'cosmos-db',
		name: 'Cosmos DB',
		route: '/azure/cosmos-db',
		category: 'Database',
		description: 'Cosmos DB APIs including NoSQL, MongoDB, Cassandra, Gremlin, Table, and PostgreSQL.',
		protocols: ['SQL', 'Mongo', 'Cassandra', 'Gremlin', 'Table'],
		status: 'planned',
		icon: 'database',
		unit: 'database'
	},
	{
		provider: 'azure',
		id: 'aks',
		name: 'AKS',
		route: '/azure/aks',
		category: 'Containers',
		description: 'Kubernetes clusters, kubeconfig, and k3s-backed local control plane.',
		protocols: ['REST', 'JSON', 'k3s'],
		status: 'planned',
		icon: 'containers',
		unit: 'cluster'
	},
	{
		provider: 'azure',
		id: 'sql',
		name: 'Azure SQL',
		route: '/azure/sql',
		category: 'Database',
		description: 'SQL servers and databases backed by local SQL Server-compatible containers.',
		protocols: ['ARM', 'SQL Server'],
		status: 'planned',
		icon: 'database',
		unit: 'database'
	},
	{
		provider: 'azure',
		id: 'api-management',
		name: 'API Management',
		route: '/azure/api-management',
		category: 'Networking',
		description: 'APIM services, APIs, products, subscriptions, policies, and gateway routes.',
		protocols: ['ARM', 'REST', 'JSON'],
		status: 'planned',
		icon: 'networking',
		unit: 'service'
	},
	{
		provider: 'azure',
		id: 'virtual-machines',
		name: 'Virtual Machines',
		route: '/azure/virtual-machines',
		category: 'Compute',
		description: 'VM lifecycle resources exposed through Azure Compute ARM routes.',
		protocols: ['ARM', 'REST', 'JSON'],
		status: 'planned',
		icon: 'compute',
		unit: 'vm'
	},
	{
		provider: 'azure',
		id: 'redis',
		name: 'Cache for Redis',
		route: '/azure/redis',
		category: 'Database',
		description: 'Redis-compatible caches backed by local Valkey/Redis containers.',
		protocols: ['ARM', 'Redis'],
		status: 'planned',
		icon: 'database',
		unit: 'cache'
	},
	{
		provider: 'azure',
		id: 'container-registry',
		name: 'Container Registry',
		route: '/azure/container-registry',
		category: 'Containers',
		description: 'ACR management and Docker Registry v2 local push/pull flows.',
		protocols: ['ARM', 'registry:2'],
		status: 'planned',
		icon: 'containers',
		unit: 'registry'
	},
	{
		provider: 'azure',
		id: 'virtual-network',
		name: 'Virtual Network',
		route: '/azure/virtual-network',
		category: 'Networking',
		description: 'VNets, subnets, NICs, public IPs, and network security groups.',
		protocols: ['ARM', 'REST', 'JSON'],
		status: 'planned',
		icon: 'networking',
		unit: 'network'
	},
	{
		provider: 'azure',
		id: 'monitor',
		name: 'Azure Monitor',
		route: '/azure/monitor',
		category: 'Observability',
		description: 'Logs, metrics, and query-oriented observability data.',
		protocols: ['Logs', 'Metrics', 'KQL'],
		status: 'planned',
		icon: 'observability',
		unit: 'signal'
	},
	{
		provider: 'azure',
		id: 'entra-id',
		name: 'Microsoft Entra ID',
		route: '/azure/entra-id',
		category: 'Identity',
		description: 'OpenID Connect, OAuth2, JWT token issuance, and local identity flows.',
		protocols: ['OAuth2', 'OIDC', 'JWT'],
		status: 'planned',
		icon: 'identity',
		unit: 'identity'
	},
	{
		provider: 'azure',
		id: 'email-communication',
		name: 'Email Communication',
		route: '/azure/email-communication',
		category: 'Messaging',
		description: 'Email communication resources and REST JSON control plane routes.',
		protocols: ['REST', 'JSON', 'ARM'],
		status: 'planned',
		icon: 'messaging',
		unit: 'resource'
	}
];
