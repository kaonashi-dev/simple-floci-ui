import { toast } from '$lib/stores/toast.svelte';
import type { SubmitFunction } from '@sveltejs/kit';

type Options = {
	/** Toast shown on success (unless the handler returns a `success` string). */
	successMessage?: string;
	/** Called with the handler's return value after a successful run. */
	onSuccess?: (data: Record<string, unknown>) => void;
	/** Called after a successful run (e.g. to close a dialog). */
	closeOnSuccess?: () => void;
};

/**
 * Drop-in replacement for the server-backed `toastingEnhance` that runs a
 * mutation entirely in the browser. Wire it the same way:
 *
 *   <form use:enhance={clientAction(handler, opts)}>
 *
 * It cancels the SvelteKit form POST (there is no server endpoint anymore) and
 * invokes `handler(formData)` against the per-dev Floci instance instead.
 */
export function clientAction(
	handler: (formData: FormData) => Promise<Record<string, unknown> | void>,
	opts: Options = {}
): SubmitFunction {
	return ({ formData, cancel }) => {
		cancel();
		void (async () => {
			try {
				const data = (await handler(formData)) ?? {};
				const msg = (data.success as string | undefined) ?? opts.successMessage;
				if (msg) toast.success(msg);
				opts.onSuccess?.(data);
				opts.closeOnSuccess?.();
			} catch (e) {
				toast.error('Action failed', e instanceof Error ? e.message : String(e));
			}
		})();
	};
}
