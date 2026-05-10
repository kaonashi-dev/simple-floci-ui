import {
	describeKey,
	listAliases,
	enableKey,
	disableKey,
	scheduleKeyDeletion,
	cancelKeyDeletion,
	createAlias,
	deleteAlias,
	enableKeyRotation,
	disableKeyRotation
} from '$lib/server/kms';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { KmsKeyDetail, KmsAlias } from '$lib/types/kms';

export async function load({ params }) {
	const keyId = decodeURIComponent(params.keyId);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([describeKey(keyId), listAliases(keyId)]).then(([key, aliases]) => ({
				key,
				aliases
			})),
		{ key: null as KmsKeyDetail | null, aliases: [] as KmsAlias[] }
	);
	return { ...data, keyId, error };
}

export const actions = {
	enable: async ({ params }) => {
		const keyId = decodeURIComponent(params.keyId);
		try {
			await enableKey(keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	disable: async ({ params }) => {
		const keyId = decodeURIComponent(params.keyId);
		try {
			await disableKey(keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	scheduleDelete: async ({ request, params }) => {
		const keyId = decodeURIComponent(params.keyId);
		const data = await request.formData();
		const days = parseInt(data.get('days') as string, 10) || 7;
		try {
			await scheduleKeyDeletion(keyId, days);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	cancelDelete: async ({ params }) => {
		const keyId = decodeURIComponent(params.keyId);
		try {
			await cancelKeyDeletion(keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	createAlias: async ({ request, params }) => {
		const keyId = decodeURIComponent(params.keyId);
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Alias name is required' });
		try {
			await createAlias(name, keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deleteAlias: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		try {
			await deleteAlias(name);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	enableRotation: async ({ params }) => {
		const keyId = decodeURIComponent(params.keyId);
		try {
			await enableKeyRotation(keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	disableRotation: async ({ params }) => {
		const keyId = decodeURIComponent(params.keyId);
		try {
			await disableKeyRotation(keyId);
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
