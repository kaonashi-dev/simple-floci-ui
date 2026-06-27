/**
 * Service catalog — the single home for cloud service identity and presentation.
 *
 * Consumers (sidebar, dashboard, provider overviews, service placeholders) read
 * services through this interface instead of hand-keeping parallel lists. The
 * live-count behaviour keyed off `countKey` is bound separately in
 * `$lib/floci/registry` to keep this module free of SDK/runtime imports.
 */
import { AWS_SERVICES } from './aws';
import { AZURE_SERVICES } from './azure';
import { GCP_SERVICES } from './gcp';
import type { ServiceDefinition, ServiceProvider } from './types';

export type { ServiceDefinition, ServiceProvider, ServiceStatus, ServiceIcon } from './types';
export { serviceIcons, type ServiceIconComponent } from './icons';
export { AWS_SERVICES, AZURE_SERVICES, GCP_SERVICES };

const BY_PROVIDER: Record<ServiceProvider, ServiceDefinition[]> = {
	aws: AWS_SERVICES,
	azure: AZURE_SERVICES,
	gcp: GCP_SERVICES
};

/** Every service across all providers, in provider order (AWS, Azure, GCP) then declared order. */
export const ALL_SERVICES: ServiceDefinition[] = [
	...AWS_SERVICES,
	...AZURE_SERVICES,
	...GCP_SERVICES
];

/** Services for one provider, in declared order. */
export function servicesForProvider(provider: ServiceProvider): ServiceDefinition[] {
	return BY_PROVIDER[provider];
}

/** Look up a single service by provider + id; `undefined` if it does not exist. */
export function getService(provider: ServiceProvider, id: string): ServiceDefinition | undefined {
	return BY_PROVIDER[provider].find((service) => service.id === id);
}

/** Services that report a live dashboard count, in dashboard order. Each has a `countKey`. */
export function serviceCountSources(): ServiceDefinition[] {
	return ALL_SERVICES.filter((service) => service.countKey);
}
