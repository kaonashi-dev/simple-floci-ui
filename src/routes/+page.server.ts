import { SERVICES } from '$lib/server/registry';

export async function load() {
	const results = await Promise.allSettled(SERVICES.map((s) => s.list()));
	const counts = Object.fromEntries(
		SERVICES.map((s, i) => {
			const r = results[i];
			return r.status === 'fulfilled'
				? [s.id, { count: r.value.length, error: null }]
				: [s.id, { count: null, error: String(r.reason) }];
		})
	);
	return { counts };
}
