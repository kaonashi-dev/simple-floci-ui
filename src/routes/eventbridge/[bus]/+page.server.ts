import { listRules, enableRule, disableRule } from '$lib/server/eventbridge';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const busName = decodeURIComponent(params.bus);
	const { data: rules, error } = await safeLoad(() => listRules(busName), []);
	return { busName, rules, error };
}

export const actions = {
	enableRule: async ({ request, params }) => {
		const busName = decodeURIComponent(params.bus);
		const data = await request.formData();
		const ruleName = data.get('ruleName') as string;
		if (!ruleName) return fail(400, { actionError: 'Rule name required', action: 'enable' });
		try {
			await enableRule(ruleName, busName);
			return { success: `Rule ${ruleName} enabled`, action: 'enable' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'enable' });
		}
	},
	disableRule: async ({ request, params }) => {
		const busName = decodeURIComponent(params.bus);
		const data = await request.formData();
		const ruleName = data.get('ruleName') as string;
		if (!ruleName) return fail(400, { actionError: 'Rule name required', action: 'disable' });
		try {
			await disableRule(ruleName, busName);
			return { success: `Rule ${ruleName} disabled`, action: 'disable' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'disable' });
		}
	}
};
