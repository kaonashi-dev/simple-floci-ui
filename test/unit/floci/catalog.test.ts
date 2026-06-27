import { describe, expect, it } from 'vitest';
import {
	ALL_SERVICES,
	AWS_SERVICES,
	AZURE_SERVICES,
	GCP_SERVICES,
	getService,
	serviceCountSources,
	serviceIcons,
	servicesForProvider,
	type ServiceProvider
} from '$lib/catalog';

const PROVIDER_PREFIX: Record<ServiceProvider, string> = {
	aws: '/aws/',
	azure: '/azure/',
	gcp: '/gcp/'
};

describe('service catalog', () => {
	it('exposes the available Azure and GCP storage services via getService', () => {
		expect(getService('azure', 'storage')).toEqual(
			expect.objectContaining({ route: '/azure/storage', status: 'available', countKey: 'azure-storage' })
		);
		expect(getService('gcp', 'storage')).toEqual(
			expect.objectContaining({ route: '/gcp/storage', status: 'available', countKey: 'gcp-storage' })
		);
		expect(getService('azure', 'missing')).toBeUndefined();
	});

	it('groups every service under exactly one provider, in stable order', () => {
		expect(ALL_SERVICES).toEqual([...AWS_SERVICES, ...AZURE_SERVICES, ...GCP_SERVICES]);
		expect(servicesForProvider('aws')).toBe(AWS_SERVICES);
		expect(servicesForProvider('azure')).toBe(AZURE_SERVICES);
		expect(servicesForProvider('gcp')).toBe(GCP_SERVICES);
	});

	it('keeps each service consistent with its provider and a known icon', () => {
		for (const service of ALL_SERVICES) {
			expect(service.route.startsWith(PROVIDER_PREFIX[service.provider])).toBe(true);
			expect(serviceIcons[service.icon]).toBeDefined();
		}
	});

	it('uses unique count keys for the dashboard count sources', () => {
		const countKeys = serviceCountSources().map((service) => service.countKey);
		expect(countKeys).toEqual([
			'sqs',
			's3',
			'cognito',
			'kms',
			'lambda',
			'dynamodb',
			'sns',
			'apigateway',
			'iam',
			'logs',
			'eventbridge',
			'secrets',
			'ssm',
			'azure-storage',
			'gcp-storage'
		]);
		expect(new Set(countKeys).size).toBe(countKeys.length);
	});
});
