/**
 * The service catalog is the single source of truth for every cloud service the
 * UI knows about — its identity (id, name, route), how it is presented (icon,
 * category, status), and how the dashboard counts it (`countKey`, `unit`).
 *
 * It is deliberately pure display metadata with NO SDK/runtime imports, so it is
 * cheap to pull into always-loaded surfaces like the sidebar. The behaviour that
 * fetches live counts (the AWS SDK / REST `list` functions) is bound separately
 * in `$lib/floci/registry`, keyed by `countKey`.
 */

export type ServiceProvider = 'aws' | 'azure' | 'gcp';

export type ServiceStatus = 'available' | 'planned';

/**
 * Logical icon name. Mapped to a concrete component in `./icons`. Names are
 * role-based (what the service does) so the same name reuses one component
 * across providers; a few AWS-specific names (`notifications`, `shield`,
 * `secret`) preserve icons that differ from the generic role icon.
 */
export type ServiceIcon =
	| 'storage'
	| 'messaging'
	| 'notifications'
	| 'database'
	| 'serverless'
	| 'compute'
	| 'containers'
	| 'config'
	| 'security'
	| 'secret'
	| 'shield'
	| 'networking'
	| 'observability'
	| 'identity';

export type ServiceDefinition = {
	/** Cloud this service belongs to; matches its route prefix (`/aws`, `/azure`, `/gcp`). */
	provider: ServiceProvider;
	/** Stable id, unique within a provider. */
	id: string;
	/** Display name, e.g. `Blob Storage`. */
	name: string;
	/** Shorter label for dense surfaces (sidebar); falls back to `name`. */
	shortName?: string;
	/** Absolute route to the service view. */
	route: string;
	/** Grouping label for overview pages and related-service lists. */
	category: string;
	/** Secondary line on the dashboard card; falls back to `category`. */
	subtitle?: string;
	description: string;
	/** Protocol/API hints surfaced on catalog pages. */
	protocols: string[];
	status: ServiceStatus;
	icon: ServiceIcon;
	/** Key into the dashboard count map; present when the service reports a live count. */
	countKey?: string;
	/** Singular noun for the counted resource, e.g. `bucket`. */
	unit?: string;
};
