import { describe, expect, it } from 'vitest';
import { AZURE_SERVICES, getAzureService } from '$lib/floci/azure-catalog';
import { GCP_SERVICES, getGcpService } from '$lib/floci/gcp-catalog';

describe('cloud service catalogs', () => {
	it('exposes the available Azure storage service and lookup helper', () => {
		expect(AZURE_SERVICES.length).toBeGreaterThan(10);
		expect(getAzureService('storage')).toEqual(expect.objectContaining({ route: '/azure/storage', status: 'available', countKey: 'azure-storage' }));
		expect(getAzureService('missing')).toBeUndefined();
	});

	it('exposes the available GCP storage service and lookup helper', () => {
		expect(GCP_SERVICES.length).toBeGreaterThan(10);
		expect(getGcpService('storage')).toEqual(expect.objectContaining({ route: '/gcp/storage', status: 'available', countKey: 'gcp-storage' }));
		expect(getGcpService('missing')).toBeUndefined();
	});
});
