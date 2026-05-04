export function basename(key: string): string {
	const stripped = key.endsWith('/') ? key.slice(0, -1) : key;
	return stripped.split('/').pop() ?? key;
}

export function parentPrefix(prefix: string): string {
	const stripped = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
	const idx = stripped.lastIndexOf('/');
	return idx === -1 ? '' : stripped.slice(0, idx + 1);
}

export function breadcrumbs(prefix: string): Array<{ label: string; prefix: string }> {
	if (!prefix) return [];
	const parts = prefix.split('/').filter(Boolean);
	return parts.map((label, i) => ({
		label,
		prefix: parts.slice(0, i + 1).join('/') + '/'
	}));
}
