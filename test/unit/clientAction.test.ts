import { describe, expect, it, vi } from 'vitest';
import { toast } from '$lib/stores/toast.svelte';
import { clientAction } from '$lib/utils/clientAction';

describe('clientAction', () => {
	it('cancels the form submit and reports successful actions', async () => {
		const handler = vi.fn().mockResolvedValue({ success: 'Saved', id: 1 });
		const onSuccess = vi.fn();
		const closeOnSuccess = vi.fn();
		const cancel = vi.fn();
		const success = vi.spyOn(toast, 'success').mockImplementation(() => undefined);

		clientAction(handler, { onSuccess, closeOnSuccess })({ formData: new FormData(), cancel } as never);

		expect(cancel).toHaveBeenCalledOnce();
		await vi.waitFor(() => expect(success).toHaveBeenCalledWith('Saved'));
		expect(onSuccess).toHaveBeenCalledWith({ success: 'Saved', id: 1 });
		expect(closeOnSuccess).toHaveBeenCalledOnce();
	});

	it('uses a default success message and reports errors', async () => {
		const successHandler = vi.fn().mockResolvedValue({});
		const failHandler = vi.fn().mockRejectedValue(new Error('boom'));
		const success = vi.spyOn(toast, 'success').mockImplementation(() => undefined);
		const error = vi.spyOn(toast, 'error').mockImplementation(() => undefined);

		clientAction(successHandler, { successMessage: 'Done' })({ formData: new FormData(), cancel: vi.fn() } as never);
		await vi.waitFor(() => expect(success).toHaveBeenCalledWith('Done'));

		clientAction(failHandler)({ formData: new FormData(), cancel: vi.fn() } as never);
		await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Action failed', 'boom'));
	});
});
