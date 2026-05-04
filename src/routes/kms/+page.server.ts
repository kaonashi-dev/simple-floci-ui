import { listKeys, createKey, scheduleKeyDeletion, enableKey, disableKey } from '$lib/server/kms';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const keys = await listKeys();
		return { keys, error: null };
	} catch (e) {
		return { keys: [], error: String(e) };
	}
}

export const actions = {
	createKey: async ({ request }) => {
		const data = await request.formData();
		const description = (data.get('description') as string)?.trim();
		try {
			const keyId = await createKey(description || undefined);
			return { success: `Key ${keyId} created` };
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	scheduleDelete: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		const days = parseInt(data.get('days') as string, 10) || 7;
		try {
			await scheduleKeyDeletion(keyId, days);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	enableKey: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		try {
			await enableKey(keyId);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	disableKey: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		try {
			await disableKey(keyId);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
