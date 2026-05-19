import { toast } from '$lib/stores/toast.svelte';
import type { SubmitFunction } from '@sveltejs/kit';

type Options = {
	onSuccess?: (data: Record<string, unknown>) => void;
	onFailure?: (data: Record<string, unknown>) => void;
	successMessage?: string;
	closeOnSuccess?: () => void;
};

export function toastingEnhance(opts: Options = {}): SubmitFunction {
	return () =>
		({ result, update }) => {
			if (result.type === 'success') {
				const data = (result.data ?? {}) as Record<string, unknown>;
				const msg = (data.success as string | undefined) ?? opts.successMessage;
				if (msg) toast.success(msg);
				opts.onSuccess?.(data);
				opts.closeOnSuccess?.();
			} else if (result.type === 'failure') {
				const data = (result.data ?? {}) as Record<string, unknown>;
				const err = (data.actionError as string | undefined) ?? (data.error as string | undefined);
				if (err) toast.error('Action failed', err);
				opts.onFailure?.(data);
			} else if (result.type === 'error') {
				toast.error('Action failed', String(result.error?.message ?? result.error));
			}
			return update();
		};
}
