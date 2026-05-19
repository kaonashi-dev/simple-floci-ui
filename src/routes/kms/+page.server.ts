import { listKeys, createKey, scheduleKeyDeletion, enableKey, disableKey } from '$lib/server/kms';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import { KeyUsageType } from '@aws-sdk/client-kms';

export async function load() {
	const { data: keys, error } = await safeLoad(listKeys, []);
	return { keys, error };
}

export const actions = {
	createKey: async ({ request }) => {
		const data = await request.formData();
		const description = (data.get('description') as string)?.trim();
		const usage = (data.get('keyUsage') as string) || 'ENCRYPT_DECRYPT';
		const keyUsage =
			usage === 'SIGN_VERIFY' ? KeyUsageType.SIGN_VERIFY : KeyUsageType.ENCRYPT_DECRYPT;
		try {
			const keyId = await createKey(description || undefined, keyUsage);
			return { success: `Key ${keyId} created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	scheduleDelete: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		const days = parseInt(data.get('days') as string, 10) || 7;
		try {
			await scheduleKeyDeletion(keyId, days);
			return { success: `Key scheduled for deletion in ${days} days` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	enableKey: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		try {
			await enableKey(keyId);
			return { success: 'Key enabled' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	disableKey: async ({ request }) => {
		const data = await request.formData();
		const keyId = data.get('keyId') as string;
		try {
			await disableKey(keyId);
			return { success: 'Key disabled' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
