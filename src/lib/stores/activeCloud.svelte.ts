import { browser } from '$app/environment';

export type CloudId = 'aws' | 'azure' | 'gcp';

const STORAGE_KEY = 'floci-active-cloud';
const CLOUDS: CloudId[] = ['aws', 'azure', 'gcp'];

/** Landing route each cloud switches to when selected from the navbar. */
export const CLOUD_LANDING: Record<CloudId, string> = {
	aws: '/aws/s3',
	azure: '/azure',
	gcp: '/gcp/storage'
};

function isCloudId(value: unknown): value is CloudId {
	return typeof value === 'string' && (CLOUDS as string[]).includes(value);
}

function readInitial(): CloudId {
	if (!browser) return 'aws';
	const stored = localStorage.getItem(STORAGE_KEY);
	return isCloudId(stored) ? stored : 'aws';
}

/**
 * Resolve the cloud a given pathname belongs to. Returns `null` for neutral
 * routes (`/`, `/settings`) so navigation there does not force a switch.
 */
export function cloudFromPathname(pathname: string): CloudId | null {
	if (pathname === '/azure' || pathname.startsWith('/azure/')) return 'azure';
	if (pathname === '/gcp' || pathname.startsWith('/gcp/')) return 'gcp';
	if (pathname === '/aws' || pathname.startsWith('/aws/')) return 'aws';

	// Neutral routes ('/', '/settings', anything else) — don't force a switch.
	return null;
}

function applyAttribute(cloud: CloudId) {
	if (browser) document.documentElement.setAttribute('data-cloud', cloud);
}

function createActiveCloud() {
	let cloud = $state<CloudId>(readInitial());

	function set(next: CloudId) {
		if (next === cloud) {
			applyAttribute(next);
			return;
		}
		cloud = next;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, next);
			applyAttribute(next);
		}
	}

	return {
		get cloud() {
			return cloud;
		},
		set,
		init() {
			applyAttribute(cloud);
		}
	};
}

export const activeCloud = createActiveCloud();
