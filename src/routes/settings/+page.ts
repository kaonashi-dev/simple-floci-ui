import { getDbStats } from '$lib/floci/sqs-history';

export function load() {
	return { db: getDbStats() };
}
