export type AzureServiceStatus = 'available' | 'planned';

export type AzureServiceIcon =
	| 'storage'
	| 'messaging'
	| 'database'
	| 'serverless'
	| 'config'
	| 'security'
	| 'networking'
	| 'compute'
	| 'containers'
	| 'observability'
	| 'identity';

export type AzureServiceDefinition = {
	id: string;
	name: string;
	shortName?: string;
	route: string;
	category: string;
	description: string;
	protocols: string[];
	status: AzureServiceStatus;
	icon: AzureServiceIcon;
	countKey?: string;
	unit?: string;
};

export const AZURE_SERVICES: AzureServiceDefinition[] = [
	{
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

export function getAzureService(id: string): AzureServiceDefinition | undefined {
	return AZURE_SERVICES.find((service) => service.id === id);
}
