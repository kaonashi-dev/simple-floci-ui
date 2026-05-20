type ToastKind = 'success' | 'error' | 'info';

export type Toast = {
	id: number;
	kind: ToastKind;
	message: string;
	hint?: string;
};

function createToastStore() {
	let nextId = 1;
	let items = $state<Toast[]>([]);

	function push(kind: ToastKind, message: string, hint?: string) {
		const id = nextId++;
		items.push({ id, kind, message, hint });
		setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
	}

	function dismiss(id: number) {
		const idx = items.findIndex((t) => t.id === id);
		if (idx !== -1) items.splice(idx, 1);
	}

	return {
		get items() {
			return items;
		},
		success: (message: string, hint?: string) => push('success', message, hint),
		error: (message: string, hint?: string) => push('error', message, hint),
		info: (message: string, hint?: string) => push('info', message, hint),
		dismiss
	};
}

export const toast = createToastStore();
