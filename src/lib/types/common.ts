export type ServiceStatus = {
	name: string;
	available: boolean;
	error?: string;
};

export type ConnectionStatus = {
	ok: boolean;
	endpoint: string;
	error?: string;
};

export type CloudProvider = 'aws' | 'azure' | 'gcp';

export type MultiCloudConnectionStatus = Record<CloudProvider, ConnectionStatus>;
